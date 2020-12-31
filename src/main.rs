mod youtube;
mod billboard;

use actix::prelude::*;
use serde::Deserialize;
use serde_json::json;
use actix_web::{App, Error, HttpResponse, HttpServer, Responder, get, post, web};
use actix_files::Files;
use futures::StreamExt;
use actix_redis::{Command as RedisCommand, RedisActor};
use redis_async::{resp_array, resp::RespValue};

#[derive(Deserialize)]
struct SearchQuery {
    query: String
}

#[get("/api/search")]
async fn search(param: web::Query<SearchQuery>) -> impl Responder {
    let result = youtube::search_song(&param.query).await.unwrap_or(vec![]);
    web::Json(result)
}

#[get("/api/suggestion")]
async fn suggestion(param: web::Query<SearchQuery>) -> impl Responder {
    let result = youtube::similar_songs(&param.query).await.unwrap_or(vec![]);
    web::Json(result)
}

#[derive(Deserialize)]
struct PlayQuery {
    id: String
}

#[derive(Deserialize)]
struct UrlQuery {
    url: String
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
    let result = youtube::get_songs_in_playlist(&param.url);
    match result {
        Ok(playlist) => web::Json(json!(playlist)),
        Err(_) => web::Json(json!({ "success": false }))
    }
}

#[get("/api/billboard")]
async fn get_billboard() -> impl Responder {
    let result = billboard::get_top_songs().await;
    match result {
        Ok(songs) => web::Json(json!({ "songs": songs })),
        Err(_) => web::Json(json!({ "success": false }))
    }
}

#[get("/api/test")]
async fn test(redis: web::Data<Addr<RedisActor>>) -> Result<HttpResponse, Error> {
    let result = redis.send(RedisCommand(resp_array!["INFO"])).await?;
    match result {
        Ok(RespValue::BulkString(value)) => Ok(HttpResponse::Ok().body(format!("{:?}", String::from_utf8(value)))),
        Err(error) => Ok(HttpResponse::Ok().body(format!("{:?}", error))),
        _ => Ok(HttpResponse::Ok().body("unhandled response type"))
    }
}

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    let port = std::env::var("PORT").unwrap_or("3123".to_owned()).parse::<u16>().unwrap_or(3123);

    // The actix-redis crate based on redis-async, which does not have built-in
    // support for connection string. So we have to manually parse it here. And
    // also have to manually do authantication when the connection string has
    // password inside. Hard coded to work with only Heroku's REDIS_URL.

    let mut redis_url = std::env::var("REDIS_URL").unwrap_or("127.0.0.1:6379".to_owned());
    let mut redis_pass = String::new();
    if redis_url.starts_with("redis://") {
        let processed = redis_url.replace("redis://:", "");
        let parts = processed.split('@').collect::<Vec<&str>>();
        redis_pass = parts[0].to_owned();
        redis_url = parts[1].to_owned();
    }

    HttpServer::new(move || {
        let redis_addr = RedisActor::start(redis_url.as_str());
        if !redis_pass.is_empty() {
            redis_addr.do_send(RedisCommand(resp_array!["AUTH", redis_pass.as_str()]));
        }

        App::new()
            .data(redis_addr)
            .service(search)
            .service(suggestion)
            .service(stream)
            .service(play)
            .service(get_billboard)
            .service(import_from_url)
            .service(test)
            .service(Files::new("/", "./www").index_file("index.html"))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
