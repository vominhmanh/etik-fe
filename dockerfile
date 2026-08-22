FROM node:20-bullseye-slim
LABEL author="etik"

RUN npm install -g pnpm

WORKDIR /app

# 1) Copy root manifests
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./

# 2) Copy workspace manifests (tối thiểu phải có package.json của từng workspace)
COPY packages/seat-picker/package.json packages/seat-picker/package.json

# 3) Install deps
RUN pnpm install --frozen-lockfile

# 4) Copy the rest source
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Build (nhớ build script của bạn có thể build seat-picker + next)
RUN pnpm run build

EXPOSE 3000
CMD ["pnpm", "start"]
