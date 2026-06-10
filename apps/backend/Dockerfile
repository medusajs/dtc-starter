# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /server

RUN npm install pnpm@10.11.1 -g

# Copy package manager files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./
COPY apps/backend/package.json ./apps/backend/

# Install all dependencies (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build the Medusa backend
RUN cd apps/backend && pnpm medusa build

# Stage 2: Production runner
FROM node:22-alpine AS runner

WORKDIR /server

RUN npm install pnpm@10.11.1 -g

# Copy the built .medusa/server directory (standalone deployment)
COPY --from=builder /server/apps/backend/.medusa/server ./apps/backend/.medusa/server

# Install production dependencies inside the .medusa/server standalone deployment
RUN cd apps/backend/.medusa/server && pnpm install --prod

# Copy start script
COPY apps/backend/start.sh .

EXPOSE 9000

ENTRYPOINT ["./start.sh"]