#!/usr/bin/env bash
set -euo pipefail

TENANT_INPUT="${1:-}"
if [[ -z "$TENANT_INPUT" ]]; then
  echo "usage: $0 <tenant-slug>"
  exit 1
fi

TENANT_SLUG="$(echo "$TENANT_INPUT" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9-]+/-/g; s/^-+|-+$//g; s/-+/-/g')"
if [[ -z "$TENANT_SLUG" ]]; then
  echo "invalid tenant slug"
  exit 1
fi

NAMESPACE="tenant-${TENANT_SLUG}"

echo "[fiyuu-work] creating/updating namespace ${NAMESPACE}"

kubectl apply -f - <<MANIFEST
apiVersion: v1
kind: Namespace
metadata:
  name: ${NAMESPACE}
  labels:
    fiyuu.work/tenant: "${TENANT_SLUG}"
    fiyuu.work/managed-by: "fiyuu-platform"
    pod-security.kubernetes.io/enforce: restricted
    pod-security.kubernetes.io/audit: restricted
    pod-security.kubernetes.io/warn: restricted
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: fiyuu-runtime
  namespace: ${NAMESPACE}
automountServiceAccountToken: false
---
apiVersion: v1
kind: LimitRange
metadata:
  name: tenant-limits
  namespace: ${NAMESPACE}
spec:
  limits:
    - type: Container
      defaultRequest:
        cpu: 100m
        memory: 128Mi
      default:
        cpu: 500m
        memory: 512Mi
      max:
        cpu: "1"
        memory: 1Gi
---
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-quota
  namespace: ${NAMESPACE}
spec:
  hard:
    pods: "8"
    requests.cpu: "2"
    limits.cpu: "4"
    requests.memory: 2Gi
    limits.memory: 4Gi
    services: "4"
    persistentvolumeclaims: "2"
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-all
  namespace: ${NAMESPACE}
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-ingress-from-nginx
  namespace: ${NAMESPACE}
spec:
  podSelector:
    matchLabels:
      app.kubernetes.io/name: fiyuu-app
  policyTypes:
    - Ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: ingress-nginx
      ports:
        - protocol: TCP
          port: 4070
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-dns-egress
  namespace: ${NAMESPACE}
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - namespaceSelector:
            matchLabels:
              kubernetes.io/metadata.name: kube-system
          podSelector:
            matchLabels:
              k8s-app: kube-dns
      ports:
        - protocol: UDP
          port: 53
        - protocol: TCP
          port: 53
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: allow-https-egress
  namespace: ${NAMESPACE}
spec:
  podSelector: {}
  policyTypes:
    - Egress
  egress:
    - to:
        - ipBlock:
            cidr: 0.0.0.0/0
      ports:
        - protocol: TCP
          port: 443
MANIFEST

echo "[fiyuu-work] namespace ready: ${NAMESPACE}"
