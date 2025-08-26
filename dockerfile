FROM node:20-bullseye-slim
LABEL author="etik"

WORKDIR /app

# Copy manifests first to leverage Docker cache
COPY package.json package-lock.json ./

# Install deps (uses package-lock for reproducible builds)
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Copy the rest
COPY . .

# Optional: disable Next telemetry in CI
ENV NEXT_TELEMETRY_DISABLED=1

# Build
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]