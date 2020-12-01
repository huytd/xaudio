# Build Backend
FROM rust AS backend
ADD . /app
WORKDIR /app
RUN cargo b --release

# Build Frontend
FROM node AS frontend
ADD ./www_src /app
WORKDIR /app
RUN npm install
RUN npm run build

# Build Final
FROM alpine:3.7 AS xaudio
RUN apk add youtube-dl
COPY --from=backend /app/target/release/tubemusic .
RUN mkdir www
COPY --from=frontend /www ./www
CMD ["./tubemusic"]
