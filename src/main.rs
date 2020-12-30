mod youtube;
mod billboard;
use serde::Deserialize;
use serde_json::json;
use actix_web::{App, HttpResponse, HttpServer, Responder, get, post, web};
use actix_files::Files;
use futures::StreamExt;

use actix::prelude::*;
use redis::{Client as RedisClient, aio::MultiplexedConnection};

struct RedisActor {
    conn: MultiplexedConnection,
}

impl RedisActor {
    pub async fn new(redis_url: String) -> Self {
        let client = RedisClient::open(redis_url).unwrap();
        let (conn, call) = client.create_multiplexed_tokio_connection().await.unwrap();
        actix_rt::spawn(call);
        RedisActor { conn }
    }
}

#[derive(Message, Debug)]
#[rtype(result = "Result<Option<String>, redis::RedisError>")]
struct InfoCommand;

impl Handler<InfoCommand> for RedisActor {
    type Result = ResponseFuture<Result<Option<String>, redis::RedisError>>;

    fn handle(&mut self, _msg: InfoCommand, _: &mut Self::Context) -> Self::Result {
        let mut con = self.conn.clone();
        let cmd = redis::cmd("INFO");
        let fut = async move {
            cmd
                .query_async(&mut con)
                .await
        };
        Box::pin(fut)
    }
}

impl Actor for RedisActor {
    type Context = Context<Self>;
}

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
async fn test(redis: web::Data<Addr<RedisActor>>) -> impl Responder {
    let res = redis.send(InfoCommand).await.unwrap().unwrap().unwrap();
    HttpResponse::Ok().body(res)
}

#[actix_rt::main]
async fn main() -> std::io::Result<()> {
    let port = std::env::var("PORT").unwrap_or("3123".to_owned()).parse::<u16>().unwrap_or(3123);
    let redis_port = std::env::var("REDIS_PORT").unwrap_or("6379".to_owned()).parse::<u16>().unwrap_or(6379);
    let redis_path = format!("redis://0.0.0.0:{}", redis_port);
    let redis_actor = RedisActor::new(redis_path).await;
    let addr = redis_actor.start();

    HttpServer::new(move || {
        App::new()
            .data(addr.clone())
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
