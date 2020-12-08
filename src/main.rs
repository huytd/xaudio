mod youtube;
use serde::Deserialize;
use serde_json::json;
use actix_web::{web, App, Responder, get, post, HttpServer};
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

#[post("/api/import")]
async fn import_from_url(param: web::Json<UrlQuery>) -> impl Responder {
    let result = youtube::get_songs_in_playlist(&param.url);
    match result {
        Ok(playlist) => web::Json(json!(playlist)),
        Err(_) => web::Json(json!({ "success": false }))
    }
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let port = std::env::var("PORT").unwrap_or("3123".to_owned()).parse::<u16>().unwrap_or(3123);

    HttpServer::new(|| {
        App::new()
            .service(search)
            .service(play)
            .service(import_from_url)
            .service(Files::new("/", "./www").index_file("index.html"))
    })
    .bind(("0.0.0.0", port))?
    .run()
    .await
}
