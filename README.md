<div align="center">

# Dify Robots

### A focused workspace for AI conversations.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square) ![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square) ![Streaming](https://img.shields.io/badge/response-SSE-0ea5e9?style=flat-square)

流式对话 · 文件交互 · 多会话管理 · 深浅主题

[Website](https://dify-robots.vercel.app) · [Portfolio](https://github.com/foxviot)

</div>

---

## Overview


基于 React 18 + Vite + Tailwind CSS 构建的 [Dify](https://dify.ai) 聊天助手前端应用，提供类 ChatGPT 的流畅对话体验。


## ✨ 功能特性


- **💬 实时对话** — 流式输出，AI 回复逐字显示，带打字光标动画
- **📜 会话历史** — 左侧边栏管理多会话，支持搜索、切换、删除
- **📎 文件上传** — 支持图片和文档上传，带预览和大小显示
- **🎨 Markdown 渲染** — 支持代码高亮、表格、列表、引用块等
- **⏹️ 流式控制** — 支持中途停止生成、重新生成回复
- **🌙 深色模式** — 一键切换亮/暗主题，自动记忆偏好
- **📱 响应式布局** — 完美适配桌面和移动端
- **🎨 青白配色** — 清爽现代的 cyan/teal/emerald 配色方案


## 🛠️ 技术栈


| 技术 | 用途 |
|------|------|
| React 18 + Vite | 现代化 SPA 框架 |
| Tailwind CSS | 实用优先的样式方案 |
| react-markdown + remark-gfm | Markdown 渲染 |
| react-syntax-highlighter | 代码语法高亮 |
| Fetch + ReadableStream | SSE 流式响应解析 |


## 📦 快速开始


### 1. 安装依赖


```bash
npm install
```


### 2. 配置环境变量


编辑 `.env` 文件，填入你的 Dify 应用信息：


```env
VITE_DIFY_API_BASE=https://api.dify.ai/v1
VITE_DIFY_API_KEY=app-xxxxxxxxxxxxxxxxxxxxxxxx
VITE_DIFY_USER=frontend-user
```


### 3. 启动开发服务器


```bash
npm run dev
```


应用将在 `http://localhost:5173` 运行。


### 4. 构建生产版本


```bash
npm run build
```


构建产物位于 `dist/` 目录，可部署到任何静态服务器。


## 📁 项目结构


```
src/
├── main.jsx              # 应用入口
├── App.jsx               # 主应用（布局 + 错误提示）
├── index.css            # 全局样式（滚动条/Markdown/动画）
├── components/
│   ├── ChatWindow.jsx    # 聊天窗口（欢迎页/消息列表/输入区）

## Deployment note

Vite exposes `VITE_*` values in the browser bundle. Keep production Dify credentials behind a server-side proxy; this frontend configuration is for local development and controlled demos.
