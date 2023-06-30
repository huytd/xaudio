# Build Backend
FROM ekidd/rust-musl-builder:stable AS backend
ADD --chown=rust:rust . /backend
WORKDIR /backend
RUN cargo b --release

# Build Frontend
FROM node AS frontend
ADD ./www_src /frontend
WORKDIR /frontend
RUN yarn install
RUN yarn build

# Build Final
FROM alpine:latest
EXPOSE $PORT
EXPOSE $REDIS_URL
EXPOSE $YOUTUBE_API_KEY
RUN apk update \
    && apk add --no-cache ca-certificates bash curl python
RUN curl -L https://github.com/huytd/cdn/raw/master/yfetcher -o /usr/local/bin/yfetcher
RUN chmod a+rx /usr/local/bin/yfetcher
COPY --from=backend /backend/target/x86_64-unknown-linux-musl/release/tubemusic .
RUN mkdir www
COPY --from=frontend /www ./www
ADD ./entrypoint.sh .
RUN chmod +x entrypoint.sh
CMD ["./entrypoint.sh"]
