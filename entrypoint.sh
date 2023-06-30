#!/bin/sh
echo "Verify backend"
ls -la tubemusic
echo "Verify frontend"
ls -la www
echo "Verify yfetcher"
yfetcher --version
echo "Run"
REDIS_URL=$REDIS_URL PORT=$PORT YOUTUBE_API_KEY=$YOUTUBE_API_KEY ./tubemusic
