#!/bin/sh
set -e

echo "Starting in production mode..."
echo "NODE_ENV=${NODE_ENV:-development}"

# The medusa build creates a standalone deployment in .medusa/server
# Change to the .medusa/server directory for production start
cd /server/apps/backend/.medusa/server

# Run database migrations
if [ "$MEDUSA_WORKER_MODE" != "worker" ]; then
  echo "Running database migrations..."
  npx medusa db:migrate
fi

# Run seed if MEDUSA_SEED is set to true
if [ "$MEDUSA_SEED" = "true" ] && [ "$MEDUSA_WORKER_MODE" != "worker" ]; then
  echo "Seeding database..."
  # Check if seed script exists in the .medusa/server package.json
  if grep -q '"seed"' /server/apps/backend/.medusa/server/package.json; then
    npx medusa seed || echo "Seed completed."
  else
    echo "No seed script found, skipping..."
  fi
fi

# Start the Medusa server in production mode from the .medusa/server directory
echo "Starting Medusa server on port ${PORT:-9000}..."
exec npx medusa start