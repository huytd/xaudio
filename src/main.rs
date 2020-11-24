mod youtube;
use serde::Deserialize;
use serde_json::json;
use actix_web::{web, App, Responder, get, HttpServer};
use actix_files::Files;

#[derive(Deserialize)]
struct SearchQuery {
    query: String
}

#[get("/api/search")]
async fn search(param: web::Query<SearchQuery>) -> impl Responder {
    let result = youtube::search_song(&param.query).await.unwrap_or(vec![]);
    web::Json(result)
}

#[derive(Deserialize)]
struct PlayQuery {
    id: String
}

#[get("/api/play")]
async fn play(param: web::Query<PlayQuery>) -> impl Responder {
    let result = youtube::get_song_url(&param.id);
    match result {
        Ok(song_url) => web::Json(json!({ "url": song_url })),
        Err(_) => web::Json(json!({ "success": false }))
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .service(search)
            .service(play)
            .service(Files::new("/", "./www").index_file("index.html"))
    })
    .bind("127.0.0.1:3123")?
    .run()
    .await
}