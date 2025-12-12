# 项目概述

这是一个基于 Next.js 和 Fumadocs 构建的博客/文档网站。项目使用 MDX 格式来编写文档内容，支持中文内容管理，并集成了搜索功能。网站名为"凌波小碎步"，使用了 Google Analytics 进行访问统计。

## 技术栈

- **Next.js 15.4.2**: React 框架，用于构建服务端渲染应用
- **Fumadocs**: 专门用于创建文档网站的 UI 库和工具集
- **React 19.1.0**: UI 库
- **TypeScript**: 类型检查
- **Tailwind CSS**: 样式框架
- **@orama/orama**: 用于搜索功能的客户端搜索库
- **Lucide React**: 图标库

## 项目架构

### 核心目录结构

- `app/`: Next.js 13+ 的 App Router 结构
  - `layout.tsx`: 根布局文件，包含 Google Analytics 集成
  - `layout.config.tsx`: 布局配置，包括导航栏标题
  - `page.tsx`: 首页
  - `(home)/`: 首页路由组
  - `api/search/route.ts`: 搜索 API 路由处理器
  - `docs/`: 文档页面布局和路由
  - `provider.tsx`: Fumadocs UI 提供者组件
  - `docs-og/`: Open Graph 图像生成路由
- `components/`: React 组件
  - `search.tsx`: 自定义搜索对话框组件
- `content/`: MDX 文档内容
  - `docs/`: 按类别组织的文档文件
  - `meta.json`: 文档结构元数据配置
- `lib/`: 工具库
  - `source.ts`: 内容源适配器
- `public/`: 静态资源
- `draft/`: 草稿文档 (MDX 格式)

### 文档内容结构

文档内容按类别组织在 `content/docs/` 目录下：
- `java/`: Java 相关文档
- `python/`: Python 相关文档
- `wechat/`: 微信相关文档
- `others/`: 其他杂项文档

## 构建和运行

### 开发环境
```bash
npm run dev
# 或
pnpm dev
# 或
yarn dev
```

### 生产构建
```bash
npm run build
```

构建脚本会执行以下操作：
1. 使用 `next build` 构建 Next.js 应用
2. 将输出目录 `out` 重命名为 `docs`
3. 在 `docs` 目录中创建 `.nojekyll` 文件以支持 GitHub Pages

### 启动生产服务器
```bash
npm run start
```

## 开发约定

### 文档编写
- 使用 MDX 格式编写文档 (`*.mdx` 文件)
- 文档内容存放在 `content/docs/` 目录下
- 使用 `meta.json` 文件定义文档结构和元数据
- 支持国际化 (当前显示中文内容)

### 组件开发
- 使用 TypeScript 编写组件
- 遵循 React 最佳实践
- 使用 Tailwind CSS 进行样式设计
- 通过 `@/*` 路径别名引用项目文件

### 搜索功能
- 集成了 Orama 搜索引擎
- 搜索组件位于 `components/search.tsx`
- 支持静态搜索类型
- 默认配置为英文语言（可在 `search.tsx` 中修改）

## 部署

项目似乎配置为部署到 GitHub Pages，输出目录为 `docs/`，通过 `.nojekyll` 文件禁用 Jekyll 处理。

## 依赖管理

- 使用 npm 管理依赖
- 主要依赖包括 Fumadocs 生态系统、Next.js、React 等
- 开发依赖包括 TypeScript、Tailwind CSS 等

## 特殊配置

- 集成了 Google Analytics (ID: G-LF308Y9BGJ)
- 自定义字体 (Inter)
- 图标支持 (favicon.svg)
- 搜索功能配置
- 中文界面支持 (通过 Fumadocs 国际化上下文)

## 文件处理脚本

- `deploy.sh`: 部署脚本 (存在但未查看具体内容)
- `postinstall` 脚本: 自动运行 `fumadocs-mdx`