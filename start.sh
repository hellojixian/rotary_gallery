#!/bin/bash

# 360° 图片画廊启动脚本

echo "🚀 启动 360° 图片画廊..."

# 检查Node.js版本
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未找到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ 错误: Node.js 版本过低，需要 16+，当前版本: $(node -v)"
    exit 1
fi

# 检查是否已安装依赖
if [ ! -d "node_modules" ] || [ ! -d "server/node_modules" ] || [ ! -d "client/node_modules" ]; then
    echo "📦 安装依赖..."
    npm run install:all
fi

# 检查albums目录
if [ ! -d "albums" ]; then
    echo "📁 创建 albums 目录..."
    mkdir albums
    echo "ℹ️  请将图片文件夹放入 albums 目录中"
fi

# 检查是否有图片
ALBUM_COUNT=$(find albums -maxdepth 1 -type d | wc -l)
if [ "$ALBUM_COUNT" -le 1 ]; then
    echo "⚠️  警告: albums 目录中没有找到相册文件夹"
    echo "   请将包含图片的文件夹放入 albums 目录中"
fi

echo "🔧 启动开发服务器..."
echo "   - 后端服务: http://localhost:3001"
echo "   - 前端应用: http://localhost:5173"
echo ""
echo "💡 提示:"
echo "   - 使用 Ctrl+C 停止服务"
echo "   - 在浏览器中打开 http://localhost:5173 查看应用"
echo ""

# 启动服务
npm run dev
