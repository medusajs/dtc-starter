#!/bin/sh
set -e

echo "Starting Storefront in production mode..."
echo "NODE_ENV=${NODE_ENV:-development}"

cd /server/apps/storefront

# Build Next.js at runtime (backend must be available for generateStaticParams)
echo "Building Next.js storefront..."
pnpm next build

# Start Next.js in production mode
echo "Starting Next.js on port 8000..."
exec pnpm next start -p 8000