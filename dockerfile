FROM node:20-bullseye-slim
LABEL author="etik"

WORKDIR /app

# 1) Copy root manifests
COPY package.json package-lock.json ./

# 2) Copy workspace manifests (tối thiểu phải có package.json của từng workspace)
COPY packages/seat-picker/package.json packages/seat-picker/package.json

# 3) Install deps
RUN npm ci --legacy-peer-deps && npm cache clean --force

# 4) Copy the rest source
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Build (nhớ build script của bạn có thể build seat-picker + next)
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
