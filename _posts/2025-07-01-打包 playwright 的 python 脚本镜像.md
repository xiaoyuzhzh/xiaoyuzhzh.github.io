## 最终 Docker 打包方案总结（Playwright + Python 爬虫）

### 🎯 目标
将使用 Playwright 的 Python 脚本打包为 Docker 镜像，支持在 NAS 上运行，并实现浏览器缓存复用、定时任务和 token 缓存。

---

### 📦 镜像构建流程

#### 1. 构建基础镜像：python-with-chromium:x86

📁 项目目录结构（用于构建）

```
.
├── Dockerfile-chromium         # 构建 python-with-chromium:x86 镜像用
├── Dockerfile                  # 构建最终爬虫镜像用
├── requirements.txt
├── query_frame_data.py         # 我的爬虫脚本
├── scraper.py
└── wxcloud.py
```


用于下载 Chromium 浏览器（Playwright 1.53.0）并缓存在镜像中：

```dockerfile
# 推荐用明确版本避免隐式平台差异
FROM python:3.10-slim-bullseye AS python-with-chromium

# 更新源并安装依赖
RUN sed -i 's|http://deb.debian.org|https://mirrors.tuna.tsinghua.edu.cn|g' /etc/apt/sources.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends \
    wget gnupg ca-certificates curl \
    fonts-liberation libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxss1 libasound2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 \
    libgtk-3-0 libx11-xcb1 \
 && apt-get clean && rm -rf /var/lib/apt/lists/*

# 安装 playwright
RUN pip install playwright==1.53.0

# 保证镜像内的时区是中国的时区
RUN apt-get update && apt-get install -y tzdata
ENV TZ=Asia/Shanghai

# 下载 Chromium 到指定路径
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN playwright install chromium
```

构建命令：

```bash
docker buildx build --platform=linux/amd64 -t python-with-chromium:x86 --load -f Dockerfile-chromium .
```

---

#### 2. 构建最终爬虫镜像

基于上面构建好的 `python-with-chromium:x86`：

```dockerfile
FROM python-with-chromium:x86

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY query_frame_data.py scraper.py wxcloud.py .

ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
# 根据实际构建的镜像取找对应的 chrome 的执行路径
ENV BROWSER_PATH=/ms-playwright/chromium-1179/chrome-linux/chrome

# 脚本的入口，是 main 函数
CMD ["python", "query_frame_data.py"]
```

```python

```

构建命令：

```bash
docker buildx build --platform=linux/amd64 -t sf6-spider:x86 --load .
```

---

### 📦 导出镜像上传到 NAS

打包镜像文件：

```bash
docker save -o sf6-spider-x86.tar sf6-spider:x86
```

NAS 上加载镜像：

```bash
docker load -i sf6-spider-x86.tar
```
> 习惯界面操作的话可以直接在界面加载 nas
---

### ✅ 运行容器命令

```bash
docker run --rm sf6-spider:x86
```

若需长期运行，请改用 `-d` 并挂载日志目录。