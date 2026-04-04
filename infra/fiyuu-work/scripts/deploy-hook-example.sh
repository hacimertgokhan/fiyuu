#!/usr/bin/env bash
set -euo pipefail

DEPLOYMENT_ID="${1:-}"
PROJECT_SLUG="${2:-}"
SUBDOMAIN="${3:-}"
ARTIFACT_PATH="${4:-}"

if [[ -z "$DEPLOYMENT_ID" || -z "$PROJECT_SLUG" || -z "$ARTIFACT_PATH" ]]; then
  echo "usage: $0 <deployment-id> <project-slug> <subdomain> <artifact-path>"
  exit 1
fi

if [[ ! -f "$ARTIFACT_PATH" ]]; then
  echo "[hook] artifact not found: $ARTIFACT_PATH"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOMAIN_SUFFIX="${FIYUU_DOMAIN_SUFFIX:-fiyuu.work}"
IMAGE_PREFIX="${FIYUU_IMAGE_PREFIX:-ghcr.io/fiyuu/sites}"
IMAGE_TAG="${PROJECT_SLUG}-${DEPLOYMENT_ID}"
IMAGE="${IMAGE_PREFIX}/${PROJECT_SLUG}:${IMAGE_TAG}"
WORKDIR="/tmp/fiyuu-build-${DEPLOYMENT_ID}"

echo "[hook] deployment: ${DEPLOYMENT_ID}"
echo "[hook] project: ${PROJECT_SLUG}"
echo "[hook] subdomain: ${SUBDOMAIN}"
echo "[hook] artifact: ${ARTIFACT_PATH}"
echo "[hook] image: ${IMAGE}"

rm -rf "$WORKDIR"
mkdir -p "$WORKDIR"
tar -xzf "$ARTIFACT_PATH" -C "$WORKDIR"

if [[ ! -f "$WORKDIR/Dockerfile" ]]; then
  cat >"$WORKDIR/Dockerfile" <<'DOCKERFILE'
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN npm install --omit=dev && npm run build
EXPOSE 4070
CMD ["npm", "run", "start"]
DOCKERFILE
fi

docker build -t "$IMAGE" "$WORKDIR"
docker push "$IMAGE"

"${SCRIPT_DIR}/deploy-tenant-app.sh" "$PROJECT_SLUG" "$IMAGE" "$DOMAIN_SUFFIX"

echo "[hook] deployment completed: https://${PROJECT_SLUG}.${DOMAIN_SUFFIX}"
