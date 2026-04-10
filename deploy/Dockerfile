# Stage 1: Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy files định nghĩa thư viện trước để cache
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy toàn bộ code và thực hiện build
COPY . .
RUN yarn build

# Thiết kế cho Nuxt.js (Nếu bạn dùng Nuxt 3)
# Chỉ copy folder .output - đây là tất cả những gì cần để chạy prod
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json ./package.json

# Cấu hình biến môi trường
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=80

EXPOSE 80

# Chạy trực tiếp file server của Nuxt (không cần qua yarn)
# Điều này giúp PID 1 luôn là process của app, container sẽ không bị chết
CMD ["node", ".output/server/index.mjs"]