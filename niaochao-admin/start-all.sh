#!/bin/bash

SERVER_IP="47.102.138.5"
NACOS_ADDR="47.102.138.5:8848"

BASE_DIR="/opt/niaochao/gt-niaochao"

SERVICES=(
  "gt-auth"
  "gt-system"
  "gt-market"
  "gt-file"
  "gt-gateway"
)

echo "==================================="

# 先停止旧服务
pkill -f 'java -jar'
sleep 2

for service in "${SERVICES[@]}"; do
  echo -e "\n>>> 启动：$service"
  
  JAR=$(ls $BASE_DIR/$service/target/*.jar | head -1)
  
  if [ -f "$JAR" ]; then
    nohup java -jar "$JAR" \
      --spring.cloud.nacos.discovery.server-addr=$NACOS_ADDR \
      --spring.cloud.nacos.config.server-addr=$NACOS_ADDR \
      --spring.cloud.nacos.discovery.ip=$SERVER_IP \
      --spring.cloud.inetutils.preferred-networks=$SERVER_IP \
      > $BASE_DIR/$service/$service.log 2>&1 &
    
    echo " $service 启动完成"
  else
    echo " $service JAR包不存在"
  fi
done

echo -e "\n 所有服务启动成功！"