# 360° 图片画廊 (Rotary Gallery)

一个基于Web的360度图片查看工具，支持移动端触摸手势和自动播放功能。

## 功能特性

### 🖼️ 图片查看
- 360度图片浏览体验
- 支持图片缩放（0.5x - 3x）
- 平滑的图片切换动画
- 自动播放功能（每秒切换）

### 📱 移动端优化
- 响应式设计，完美适配手机屏幕
- 触摸手势支持：
  - 横向滑动切换图片（左滑下一张，右滑上一张）
  - 双指缩放图片
  - 单指拖拽（放大状态下）
- 防止页面滚动干扰

### ⌨️ 桌面端控制
- 键盘快捷键：
  - `←` / `→` 切换图片
  - `空格键` 播放/暂停
  - `R` 重置缩放
- 鼠标滚轮缩放
- 拖拽支持（放大状态下）

### 📁 相册管理
- 自动扫描 `albums` 目录
- 自动生成 `metadata.json` 文件
- 支持中文相册名称
- 图片按文件名升序排列

## 技术栈

### 后端
- **Node.js** + **TypeScript**
- **Express.js** - Web框架
- **exifr** - EXIF数据提取
- **sharp** - 图片处理（可选）

### 前端
- **React 18** + **TypeScript**
- **Vite** - 构建工具
- **React Router** - 路由管理
- **Axios** - HTTP客户端

## 快速开始

### 1. 安装依赖
```bash
npm run install:all
```

### 2. 启动开发服务器
```bash
npm run dev
```

这将同时启动：
- 后端服务器：http://localhost:3001
- 前端应用：http://localhost:5173

### 3. 添加图片
将图片文件夹放入 `albums` 目录中，例如：
```
albums/
├── 我的相册1/
│   ├── IMG_001.JPG
│   ├── IMG_002.JPG
│   └── ...
└── 我的相册2/
    ├── photo1.jpg
    ├── photo2.jpg
    └── ...
```

系统会自动：
- 扫描图片文件
- 生成 `metadata.json`
- 提取EXIF信息（如果有）

## 项目结构

```
rotary-gallery/
├── albums/                 # 图片存储目录
│   ├── Camera 1/
│   ├── Camera 2/
│   └── ...
├── server/                 # 后端代码
│   ├── src/
│   │   ├── routes/         # API路由
│   │   ├── services/       # 业务逻辑
│   │   ├── types/          # 类型定义
│   │   └── utils/          # 工具函数
│   └── package.json
├── client/                 # 前端代码
│   ├── src/
│   │   ├── components/     # React组件
│   │   ├── pages/          # 页面组件
│   │   ├── services/       # API服务
│   │   └── types/          # 类型定义
│   └── package.json
└── package.json           # 根配置文件
```

## API接口

### 获取所有相册
```
GET /api/albums
```

### 获取特定相册
```
GET /api/albums/:albumId
```

### 获取图片
```
GET /api/albums/:albumId/images/:imageName
```

### 静态文件访问
```
GET /static/albums/:albumId/:imageName
```

## 部署

### 构建生产版本
```bash
npm run build
```

### 启动生产服务器
```bash
npm start
```

## 支持的图片格式

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- BMP (.bmp)
- WebP (.webp)

## 浏览器兼容性

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 开发

### 单独启动服务
```bash
# 仅启动后端
npm run server:dev

# 仅启动前端
npm run client:dev
```

### 构建
```bash
# 构建前端
npm run client:build

# 构建后端
npm run server:build
```

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
