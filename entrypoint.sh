#!/bin/sh
echo "Verify backend"
ls -la tubemusic
echo "Verify frontend"
ls -la www
echo "Verify youtube-dl"
youtube-dl --version
echo "Run"
PORT=$PORT YOUTUBE_API_KEY=$YOUTUBE_API_KEY ./tubemusic
