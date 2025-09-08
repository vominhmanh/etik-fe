# syntax=docker/dockerfile:1.6

########################
# 1) Install deps (cache)
########################
FROM node:20-bullseye-slim AS deps
WORKDIR /app

# Bật cache cho npm để lần sau không phải tải lại
RUN --mount=type=cache,id=npm-cache,target=/root/.npm corepack enable || true

COPY package.json package-lock.json ./
RUN --mount=type=cache,id=npm-cache,target=/root/.npm \
    npm ci --legacy-peer-deps --no-audit --no-fund

########################
# 2) Build (cache Next)
########################
FROM node:20-bullseye-slim AS builder
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy code và node_modules từ stage deps
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Giữ cache cho SWC/transform để build nhanh hơn ở lần sau
RUN --mount=type=cache,id=next-cache,target=/app/.next/cache \
    npm run build

########################
# 3) Runtime siêu gọn (standalone)
########################
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Tạo user không phải root để chạy an toàn hơn
RUN useradd -m nextjs
USER nextjs

# Copy output dạng standalone (Next sẽ đóng gói server + deps cần thiết)
# .next/standalone chứa server node đã bundle sẵn
COPY --chown=nextjs:nextjs --from=builder /app/.next/standalone ./
# .next/static và public cần được copy theo đúng đường dẫn
COPY --chown=nextjs:nextjs --from=builder /app/.next/static ././.next/static
COPY --chown=nextjs:nextjs --from=builder /app/public ./public

# (Tùy) Nếu bạn có file .env.production, copy ở đây:
# COPY --chown=nextjs:nextjs .env.production ./

EXPOSE 3000
ENV PORT=3000

# Trong thư mục standalone có server.js và package.json đã tinh gọn
CMD ["node", "server.js"]
