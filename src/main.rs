mod youtube;
mod billboard;

use actix::prelude::*;
use serde::Deserialize;
use serde_json::json;
use actix_web::{App, Error, HttpResponse, HttpServer, Responder, get, post, web, HttpMessage, Either, HttpRequest};
use actix_files::Files;
use futures::StreamExt;
use futures::future::{FutureExt, Ready, ok};
use actix_redis::{Command as RedisCommand, RedisActor};
use redis_async::{resp_array, resp::RespValue};
use actix_web::dev::{Service, Transform, ServiceRequest, ServiceResponse};
use std::rc::Rc;
use std::pin::Pin;
use std::task::{Context, Poll};
use std::cell::RefCell;
use reqwest::header::{HeaderName, HeaderValue};
use actix_web::body::ResponseBody;

const HAS_CACHE: &'static str = "has-cache";

pub struct RedCache;
pub struct RedCacheMiddleware<S> {
    service: Rc<RefCell<S>>,
}

impl<S, B> Transform<S> for RedCache
where
    S: Service<Request = ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
    S::Future: 'static,
    B: 'static,
{
    type Request = ServiceRequest;
    type Response = ServiceResponse<B>;
    type Error = Error;
    type InitError = ();
    type Transform = RedCacheMiddleware<S>;
    type Future = Ready<Result<Self::Transform, Self::InitError>>;

    fn new_transform(&self, service: S) -> Self::Future {
        ok(RedCacheMiddleware {
            service: Rc::new(RefCell::new(service))
        })
    }
}

impl<S, B> Service for RedCacheMiddleware<S>
    where
        S: Service<Request = ServiceRequest, Response = ServiceResponse<B>, Error = Error> + 'static,
        S::Future: 'static,
        B: 'static,
{
    type Request = ServiceRequest;
    type Response = ServiceResponse<B>;
    type Error = Error;
    type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>>>>;

    fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
        self.service.poll_ready(cx)
    }

    fn call(&mut self, req: ServiceRequest) -> Self::Future {
        let service = Rc::clone(&self.service);

        async move {
            let path = req.path().to_string();
            let query = req.query_string().to_string();
            let mut cached = String::new();
            if let Some(redis) = req.app_data::<web::Data<Addr<RedisActor>>>() {
                if let Some(data) = get_cached_data(redis.clone(), path, query).await {
                    cached = data;
                }
            }
            let mut req = req;
            req.headers_mut().insert(HeaderName::from_static(HAS_CACHE), HeaderValue::from(cached.len()));
            let fut = service.borrow_mut().call(req);
            let mut res = fut.await?;
            if cached.len() > 0 {
                res = ServiceResponse::new(
                    res.request().clone(),
                    HttpResponse::Ok().body(cached).into_body()
                );
            } else {
                let rez = res.response().body();
            }
            Ok(res)
        }.boxed_local()
    }
}


#[derive(Deserialize)]
struct SearchQuery {
    query: String
}

async fn get_cached_data(redis: web::Data<Addr<RedisActor>>, action: String, query: String) -> Option<String> {
    if let Ok(result) = redis.send(RedisCommand(resp_array!["GET", format!("{}{}", action, query)])).await {
        match result {
            Ok(RespValue::BulkString(data)) => return Some(String::from_utf8(data).unwrap()),
            _ => return None
        }
    }
    None
}

fn write_cache_data(redis: web::Data<Addr<RedisActor>>, action: String, query: String, data: String) {
    redis.do_send(RedisCommand(resp_array!["SET", format!("{}{}", action, query), data, "EX", "86400"])); // cache for 1 day
}

#[get("/api/search")]
async fn search(req: HttpRequest, param: web::Query<SearchQuery>, redis: web::Data<Addr<RedisActor>>) -> impl Responder {
    let default = HeaderValue::from_static("0");
    let has_cache = req.headers().get(HAS_CACHE).unwrap_or(&default);
    if has_cache.eq("0") {
        println!("CALLING YOUTUBE API");
        let result = youtube::search_song(&param.query).await.unwrap_or(vec![]);
        return web::Json(result);
    } else {
        println!("SKIP");
        return web::Json(vec![]);
    }
}

#[get("/api/suggestion")]
async fn suggestion(param: web::Query<SearchQuery>, redis: web::Data<Addr<RedisActor>>) -> impl Responder {
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
            .wrap(RedCache)
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
