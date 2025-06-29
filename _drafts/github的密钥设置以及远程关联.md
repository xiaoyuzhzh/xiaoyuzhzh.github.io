# Git 操作总结

## 配置 SSH 密钥

### 检查现有的 SSH 密钥
ssh密钥都是共用的，统一放在一个目录
```bash
ls -la ~/.ssh
```

### 生成新的 SSH 密钥
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

### 将 SSH 公钥添加到 GitHub
- 使用 `cat` 查看公钥内容：
  ```bash
  cat ~/.ssh/id_ed25519.pub
  ```
- 复制公钥内容到 GitHub 的 SSH keys 设置中。

## 修改 Git 仓库的远程 URL

### 查看当前远程仓库配置
```bash
git remote -v
```

### 修改远程仓库 URL 为 SSH 地址
```bash
git remote set-url origin git@github.com:username/repo.git
```

## 推送至远程仓库

### 首次推送设置上游分支
```bash
git push --set-upstream origin master
```

### 配置自动设置远程上游分支
```bash
git config --global push.autoSetupRemote true
```

## 常见问题及解决方法

### 添加 GitHub 服务器到 known_hosts
- 在首次连接时，确认并接受 GitHub 的 SSH 指纹。

### 解决权限拒绝问题
- 确保 SSH 密钥已正确添加到 GitHub。
- 确保使用正确的 SSH URL。

### 自动创建远程分支
- 使用 `git config --global push.autoSetupRemote true` 配置 Git 自动为新分支创建远程分支。