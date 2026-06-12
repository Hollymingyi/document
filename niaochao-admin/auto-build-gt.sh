#!/bin/bash

BRANCH="dev-任务重构"

# 后端
JAVA_GIT="http://47.117.85.102:3001/sunbin/gt-niaochao"
JAVA_DIR="/opt/niaochao/gt-niaochao"

# 前端
WEB_GIT="http://47.117.85.102:3001/sunbin/my-project"
WEB_DIR="/opt/niaochao/my-project"
WEB_VUE_DIR="$WEB_DIR/nestify-admin"

echo -e "\n==================== 拉取指定分支：$BRANCH ====================\n"

# ==================== 后端拉代码 ====================
cd /opt || exit

if [ ! -d "$JAVA_DIR" ]; then
    git clone -b "$BRANCH" $JAVA_GIT $JAVA_DIR
else
    cd $JAVA_DIR
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
fi

cd $JAVA_DIR || exit

mvn clean package \
  -Dmaven.test.skip=true \
  -Dmaven.compiler.source=17 \
  -Dmaven.compiler.target=17 \
  -Dmaven.compiler.release=17 \
  -Dlombok.version=1.18.30

echo -e "\n 后端编译成功！"

echo -e "\n==================== 前端 ===================="
cd /opt || exit

if [ ! -d "$WEB_DIR" ]; then
    git clone -b "$BRANCH" $WEB_GIT $WEB_DIR
else
    cd $WEB_DIR
    git checkout "$BRANCH"
    git pull origin "$BRANCH"
fi

if command -v npm &> /dev/null; then
    cd $WEB_VUE_DIR || exit
    npm install --registry=https://registry.npmmirror.com
    npm run build
    echo -e "\n 前端编译完成"
else
    echo -e "\n  未安装 npm，前端跳过"
fi

echo -e "\n 全部完成！"