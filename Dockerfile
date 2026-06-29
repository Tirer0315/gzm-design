# 阶段 1: 构建前端
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 阶段 2: 生产镜像
FROM node:20-slim
WORKDIR /app

# sharp 需要的系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

# 前端构建产物
COPY --from=frontend-builder /app/dist ./dist

# 后端代码
COPY src/plugins/haibao/server ./src/plugins/haibao/server

# 环境配置
COPY .env.production ./.env.production

# 数据目录（可挂载 volume）
RUN mkdir -p data/haibao/uploads data/haibao/logos data/haibao/matted

EXPOSE 3001

CMD ["node", "src/plugins/haibao/server/production.cjs"]
