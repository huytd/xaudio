use actix::prelude::*;
use redis::{Client as RedisClient, aio::MultiplexedConnection};

#[derive(Message, Debug)]
#[rtype(result = "Result<Option<String>, redis::RedisError>")]
pub struct InfoCommand;

pub struct RedisActor {
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