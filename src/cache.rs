use actix::Addr;
use actix_redis::{Command as RedisCommand, RedisActor};
use actix_web::web;
use redis_async::{resp_array, resp::RespValue};

pub async fn read_from_redis(redis: web::Data<Addr<RedisActor>>, key: String) -> Option<String> {
    println!("DBG::READ KEY {}", key);
    if let Ok(result) = redis.send(RedisCommand(resp_array!["GET", key])).await {
        match result {
            Ok(RespValue::BulkString(data)) => return Some(String::from_utf8(data).unwrap()),
            _ => return None
        }
    }
    None
}

pub fn write_to_redis(redis: web::Data<Addr<RedisActor>>, key: String, data: String) {
    println!("DBG::WRITE REDIS {} {}", key, data);
    redis.do_send(RedisCommand(resp_array!["SET", key, data, "EX", "86400"])); // cache for 1 day
}
