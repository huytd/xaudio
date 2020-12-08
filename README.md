# Setting up

## Installation (MacOS)

- Install rust:

```shell
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

- Install youtube-dl:

```shell
brew install youtube-dl
```

- Create Youtube API Key from [here](https://console.developers.google.com/apis/credentials/wizard),
then set it as an environment variable (`YOUTUBE_API_KEY`) to search videos.

## Run

First, run backend:

```shell
cargo r
```

Then, serve the frontend:

```shell
cd www_src
yarn
yarn dev
```
