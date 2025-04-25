# 视频管理工具

本项目是一个本地穿搭视频管理工具，帮助穿搭博主高效管理服饰、视频素材、成品视频及发布信息。

## 技术栈
- React 18
- Vite
- TypeScript
- Electron
- Ant Design
- Dexie（本地 IndexedDB 数据库）

## 功能模块
- 服饰信息管理
- 视频素材管理
- 成品视频管理
- 发布信息管理
- 数据本地存储与导出

## 启动方式

1. 安装依赖：
   ```bash
   npm install
   ```
2. 启动开发环境：
   ```bash
   npm run dev
   ```

3. 打包构建：
   ```bash
   npm run electron:build
   ```

## 项目结构
- `src/` - React应用源码
- `electron/` - Electron主进程代码
- `src/db/` - Dexie数据库模型定义
- `src/pages/` - 应用页面组件

---

如需扩展功能或桌面化，可后续集成 Electron/Tauri。 