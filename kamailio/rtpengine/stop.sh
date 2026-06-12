#!/bin/bash
# 停止 rtpengine 容器
docker rm -f rtpengine 2>/dev/null
echo "rtpengine stopped."
