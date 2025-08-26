FROM node:20-alpine
LABEL author="etik"

WORKDIR /app

# Copy only package.json and package-lock.json first for caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install --legacy-peer-deps \
    && npm cache clean --force

# Copy the rest of the project files
COPY . .

# Build the app
RUN npm run build

EXPOSE 3000

# Start the app
CMD ["npm", "start"]