#!/bin/bash

docker build -f local-npm.dockerfile -t local-npm . 
docker run -d -v "$WS_DIR/.npm_cache":/data -p 5080:5080 local-npm

echo "NPM local mirror is running on http://localhost:5080"
