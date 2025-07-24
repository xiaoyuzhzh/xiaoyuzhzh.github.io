#!/bin/bash

set -e

# 1. 构建静态站点（num run build 替换为你的实际命令，比如 npm run build）
npm run build

# 2. 添加所有变动（包括新文件、修改、删除）
git add -A

# 3. 提交（如果有变动才提交）
if ! git diff --cached --quiet; then
  git commit -m "auto: build and deploy"
else
  echo "No changes to commit."
fi

# 4. 推送到远程当前分支
git push origin HEAD