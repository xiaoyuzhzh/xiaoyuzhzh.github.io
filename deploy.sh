#!/bin/bash

set -e

npm run build

git add -A

# 获取当前日期时间，格式为 2024-07-24 14:35:01
CURRENT_DATE=$(date +"%Y-%m-%d %H:%M:%S")

# 带日期的提交信息
COMMIT_MSG="auto: build and deploy ($CURRENT_DATE)"

if ! git diff --cached --quiet; then
  git commit -m "$COMMIT_MSG"
else
  echo "No changes to commit."
fi

git push origin gh-pages