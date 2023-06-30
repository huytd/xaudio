mod youtube;
mod cache;

use std::time::{SystemTime, UNIX_EPOCH};
use actix::prelude::*;
use actix_redis::{Command as RedisCommand, RedisActor};
use cache::{read_from_redis, write_to_redis};
use rand::Rng;
use redis_async::{resp_array, resp::RespValue};
use serde::Deserialize;
use serde_json::json;
use actix_web::{App, Error, HttpResponse, HttpServer, Responder, get, post, web};
use actix_files::Files;
use futures::StreamExt;
use youtube::Playlist;

#[derive(Deserialize)]
struct SearchQuery {
    query: String
}

#[derive(Deserialize)]
struct PlayQuery {
    id: String
}

#[derive(Deserialize)]
struct UrlQuery {
    url: String
}

#[derive(Deserialize)]
struct SessionQuery {
    session_id: String
}

#[get("/api/search")]
async fn search(param: web::Query<SearchQuery>, redis: web::Data<Addr<RedisActor>>, redis_password: web::Data<String>, redis_user: web::Data<String>) -> impl Responder {
    if let Some(cached ) = read_from_redis(redis.clone(), redis_user.clone(), redis_password.clone(), format!("search{}", param.query.to_string())).await {
        if let Ok(parsed) = serde_json::from_str(cached.as_str()) {
            web::Json(parsed)
        } else {
            web::Json(json!({ "success": false }))
        }
    } else {
        let result = youtube::search_song(&param.query).await.unwrap_or(vec![]);
        let json_string = json!(result).to_string();
        actix::spawn(async move {
            write_to_redis(redis.clone(), redis_user, redis_password, format!("search{}", param.query.to_string()), json_string).await;
        });
        web::Json(json!(result))
    }
}

#[get("/api/suggestion")]
async fn suggestion(param: web::Query<SearchQuery>, redis: web::Data<Addr<RedisActor>>, redis_password: web::Data<String>, redis_user: web::Data<String>) -> impl Responder {
    if let Some(cached ) = read_from_redis(redis.clone(), redis_user.clone(), redis_password.clone(), format!("suggestion{}", param.query.to_string())).await {
        if let Ok(parsed) = serde_json::from_str(cached.as_str()) {
            web::Json(parsed)
        } else {
            web::Json(json!({ "success": false }))
        }
    } else {
        let result = youtube::similar_songs(&param.query).await.unwrap_or(vec![]);
        let json_string = json!(result).to_string();
        actix::spawn(async move {
            write_to_redis(redis.clone(), redis_user, redis_password, format!("suggestion{}", param.query.to_string()), json_string).await;
        });
        web::Json(json!(result))
    }
}

#[get("/api/play")]
async fn play(param: web::Query<PlayQuery>) -> impl Responder {
    let result = youtube::get_song_url(&param.id);
    match result {
        Ok(song_url) => web::Json(json!({ "url": song_url })),
        Err(error) => {
            println!("ERROR: {}", error);
            return web::Json(json!({ "success": false }));
        }
    }
}

#[get("/api/stream")]
async fn stream(param: web::Query<PlayQuery>) -> impl Responder {
    if let Ok(url) = youtube::get_song_url(&param.id) {
        let response = youtube::get_song_stream(&url).await;
        match response {
            Ok(body) => {
                let headers = body.headers().clone();
                let stream = body.bytes_stream().map(|item| item.map_err(|_| HttpResponse::Gone()));
                let mut builder = HttpResponse::Ok();
                for key in headers.keys() {
                    let value = headers.get(key).unwrap().to_str().unwrap();
                    builder.header(key.as_str(), value);
                }
                return builder.streaming(stream);
            },
            Err(_) => {
                return HttpResponse::NotFound().json(json!({ "success": false }));
            }
        }
    }
    HttpResponse::NotFound().json(json!({ "success": false }))
}

#[post("/api/import")]
async fn import_from_url(param: web::Json<UrlQuery>) -> impl Responder {
    println!("Importing {}", &param.url);
    let result = youtube::get_songs_in_playlist(&param.url);
    match result {
        Ok(playlist) => web::Json(json!(playlist)),
        Err(_) => web::Json(json!({ "success": false }))
    }
}

#[get("/api/session/{session_id}")]
async fn read_session(param: web::Path<SessionQuery>, redis: web::Data<Addr<RedisActor>>, redis_password: web::Data<String>, redis_user: web::Data<String>) -> impl Responder {
    if let Some(cached ) = read_from_redis(redis.clone(), redis_user, redis_password, format!("session{}", param.session_id)).await {
        println!("DBG::FOUND SESSION {}", param.session_id);
        if let Ok(parsed) = serde_json::from_str(cached.as_str()) {
            println!("DBG::PARSED SESSION {:?}", parsed);
            return web::Json(parsed);
        }
    }
    web::Json(json!({ "success": false }))
}

#[post("/api/session/{session_id}")]
async fn write_session(param: web::Path<SessionQuery>, payload: web::Json<Playlist>, redis: web::Data<Addr<RedisActor>>, redis_password: web::Data<String>, redis_user: web::Data<String>) -> impl Responder {
    let mut session_id = param.session_id.to_owned();
    if session_id.eq("new") {
        // Generate the new ID if session_id param is "new"
        let start = SystemTime::now();
        if let Ok(epoch) = start.duration_since(UNIX_EPOCH) {
            let now = epoch.as_millis() as u32;
            let fuzz: u8 = rand::thread_rng().gen();
            session_id = base64_url::encode(&format!("{}{}", fuzz, now));
        }
    }
    let payload_str = json!(payload.clone()).to_string();
    write_to_redis(redis, redis_user, redis_password, format!("session{}", session_id), payload_str).await;
    web::Json(json!({
        "sessionId": session_id,
    }))
}

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    let port = std::env::var("PORT").unwrap_or("3123".to_owned()).parse::<u16>().unwrap_or(3123);

    // The actix-redis crate based on redis-async, which does not have built-in
    // support for connection string. So we have to manually parse it here. And
    // also have to manually do authantication when the connection string has
    // password inside. Hard coded to work with only Heroku's REDIS_URL.

    let redis_url = std::env::var("REDIS_URL").unwrap_or("127.0.0.1:6379".to_owned());
    let redis_user = std::env::var("REDISUSER").expect("No REDISUSER set");
    let redis_password = std::env::var("REDISPASSWORD").expect("No REDISUSER set");

    HttpServer::new(move || {
        let redis_addr = RedisActor::start(redis_url.as_str());
        let auth_reddit_addr = redis_addr.clone();
        let shared_redis_user = redis_user.clone();
        let shared_redis_password = redis_password.clone();
        actix::spawn(async move {
            match auth_reddit_addr.send(RedisCommand(resp_array!["AUTH", shared_redis_user.as_str(), shared_redis_password.as_str()])).await {
                Ok(auth) => println!("DBG::REDIS AUTH {:?}", auth),
                Err(err) => println!("ERROR: {:?}", err)
            }
        });
        

        App::new()
            .data(redis_password.clone())
            .data(redis_user.clone())
            .data(redis_addr)
            .service(suggestion)
            .service(stream)
            .service(play)
            .service(import_from_url)
            .service(read_session)
            .service(write_session)
            .service(Files::new("/", "./www").index_file("index.html"))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
