# Stage 1: Install dependencies and build
FROM node:22-alpine AS builder

WORKDIR /server

RUN npm install pnpm@10.11.1 -g

# Copy package manager files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY apps/storefront/package.json ./apps/storefront/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /server

RUN npm install pnpm@10.11.1 -g

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY apps/storefront/package.json ./apps/storefront/

# Install all dependencies (needed for build at startup)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Copy start script
COPY apps/storefront/start-storefront.sh .

EXPOSE 8000

ENTRYPOINT ["./start-storefront.sh"]