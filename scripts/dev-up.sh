#!/usr/bin/env bash
set -euo pipefail

CONTAINER_NAME="gamecave-postgres"
IMAGE_NAME="postgres:15"
DB_USER="gamecave"
DB_PASSWORD="gamecave"
DB_NAME="gamecave"
DB_PORT="5432"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found. Please install Docker Desktop first."
  exit 1
fi

if ! docker ps -a --format '{{.Names}}' | grep -qx "${CONTAINER_NAME}"; then
  echo "Creating Postgres container: ${CONTAINER_NAME}"
  docker run --name "${CONTAINER_NAME}" \
    -e POSTGRES_USER="${DB_USER}" \
    -e POSTGRES_PASSWORD="${DB_PASSWORD}" \
    -e POSTGRES_DB="${DB_NAME}" \
    -p "${DB_PORT}:5432" \
    -d "${IMAGE_NAME}" >/dev/null
else
  echo "Starting Postgres container: ${CONTAINER_NAME}"
  docker start "${CONTAINER_NAME}" >/dev/null
fi

echo "Waiting for Postgres to accept connections..."
for i in {1..30}; do
  if docker exec "${CONTAINER_NAME}" pg_isready -U "${DB_USER}" >/dev/null 2>&1; then
    echo "Postgres is ready."
    break
  fi
  sleep 1
done

if ! docker exec "${CONTAINER_NAME}" pg_isready -U "${DB_USER}" >/dev/null 2>&1; then
  echo "Postgres did not become ready in time."
  exit 1
fi

echo "Starting Next dev server..."
pnpm run dev
