#!/bin/bash
# rtpengine Docker 启动脚本 (Windows Docker)

export MSYS_NO_PATHCONV=1

IMAGE="drachtio/rtpengine:latest"
NAME="rtpengine"
HOST_IP="192.168.1.101"

# 停止旧容器
docker rm -f "$NAME" 2>/dev/null

docker run -d \
  --name "$NAME" \
  --restart unless-stopped \
  -p 22222:22222/udp \
  -p 22222:22222/tcp \
  -p 22223:22223/tcp \
  -p 10000-10100:10000-10100/udp \
  "$IMAGE" \
  rtpengine -f -E \
    -i "$HOST_IP" \
    -n 22222 \
    -l 22223 \
    -m 10000 \
    -M 10100 \
    -L 6 \
    --SDES-no \
    --dtls-passive

echo "rtpengine started. Status:"
docker ps --filter "name=$NAME" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
