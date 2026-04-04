#!/usr/bin/env bash
set -euo pipefail

TENANT_INPUT="${1:-}"
if [[ -z "$TENANT_INPUT" ]]; then
  echo "usage: $0 <tenant-slug>"
  exit 1
fi

TENANT_SLUG="$(echo "$TENANT_INPUT" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9-]+/-/g; s/^-+|-+$//g; s/-+/-/g')"
NAMESPACE="tenant-${TENANT_SLUG}"

echo "[fiyuu-work] deleting namespace ${NAMESPACE}"
kubectl delete namespace "${NAMESPACE}" --wait=true

echo "[fiyuu-work] tenant deleted: ${TENANT_SLUG}"
