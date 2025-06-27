#!/bin/sh

if [ "$1" = "migrate" ]; then
  echo "Running database migrations..."
  npx prisma migrate deploy
else
  echo "Starting application..."
  exec npx fastify start -l info -a 0.0.0.0 dist/app.js
fi 