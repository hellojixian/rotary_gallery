# 多阶段构建
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制根目录的package.json
COPY package*.json ./

# 复制服务端代码
COPY server/ ./server/
COPY client/ ./client/

# 安装依赖
RUN npm install

# 构建前端
WORKDIR /app/client
RUN npm install && npm run build

# 构建后端
WORKDIR /app/server
RUN npm install && npm run build

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app

# 复制构建好的后端代码
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/package*.json ./
COPY --from=builder /app/server/node_modules ./node_modules

# 复制构建好的前端代码（可选，如果使用nginx单独服务前端）
COPY --from=builder /app/client/dist ./public

# 创建albums目录
RUN mkdir -p albums

# 暴露端口
EXPOSE 3001

# 启动应用
CMD ["node", "dist/index.js"]
