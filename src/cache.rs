use actix::Addr;
use actix_redis::{Command as RedisCommand, RedisActor};
use actix_web::web;
use redis_async::{resp_array, resp::RespValue};

pub async fn read_from_redis(redis: web::Data<Addr<RedisActor>>, redis_pass: web::Data<String>, key: String) -> Option<String> {
    println!("DBG::READ KEY {}", key);
    if let Ok(_auth_ret) = redis.send(RedisCommand(resp_array!["AUTH", redis_pass.as_str()])).await {
        if let Ok(result) = redis.send(RedisCommand(resp_array!["GET", key])).await {
            match result {
                Ok(RespValue::BulkString(data)) => return Some(String::from_utf8(data).unwrap()),
                _ => return None
            }
        }
    }
    None
}

pub async fn write_to_redis(redis: web::Data<Addr<RedisActor>>, redis_pass: web::Data<String>, key: String, data: String) {
    println!("DBG::WRITE REDIS {:?} {} {}", redis_pass, key, data);
    if let Ok(_auth_ret) = redis.send(RedisCommand(resp_array!["AUTH", redis_pass.as_str()])).await {
        let result = redis.send(RedisCommand(resp_array!["SET", key, data, "EX", "864000"])).await;
        match result {
            Ok(result) => println!("DBG::DATA SENT {:?}", result),
            Err(err) => println!("DBG::REDIS SEND ERROR {:?}", err)
        }
    }
}
