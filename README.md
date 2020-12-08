# Xaudio.me

First, make sure you have `YOUTUBE_API_KEY` environment variable on your machine, please check this document to see [how to create one](https://developers.google.com/youtube/registering_an_application).

If you want to change the HTTP Server port, you can pass the `PORT` environment variable when you run the backend.

## Run with Docker

To run Xaudio with Docker, use the following command:

```
$ docker build --tag xaudio-server .
$ docker run -e YOUTUBE_API_KEY=$YOUTUBE_API_KEY xaudio-server
```

## Run without Docker

To run it locally, mostly for development purpose,

Run the backend:

```
$ cargo r
```

Then, serve the frontend:

```
$ cd www_src
$ yarn
$ yarn dev
```

## Deploy on Heroku

To create and deploy Xaudio app on Heroku, you can use the following steps:

```
$ heroku create <app-name>
$ heroku stack:set container
$ git push heroku master
```

This will build and deploy your Docker container on Heroku, so you don't need to have Docker on your local machine.
