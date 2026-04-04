#!/usr/bin/env bash
set -euo pipefail

TENANT_INPUT="${1:-}"
IMAGE="${2:-}"
DOMAIN_SUFFIX="${3:-fiyuu.work}"

if [[ -z "$TENANT_INPUT" || -z "$IMAGE" ]]; then
  echo "usage: $0 <tenant-slug> <image> [domain-suffix]"
  echo "example: $0 acme ghcr.io/fiyuu/tenant-acme:latest fiyuu.work"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
"${SCRIPT_DIR}/create-tenant-namespace.sh" "$TENANT_INPUT"

TENANT_SLUG="$(echo "$TENANT_INPUT" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9-]+/-/g; s/^-+|-+$//g; s/-+/-/g')"
NAMESPACE="tenant-${TENANT_SLUG}"
HOSTNAME="${TENANT_SLUG}.${DOMAIN_SUFFIX}"

echo "[fiyuu-work] deploying ${IMAGE} to ${NAMESPACE} (${HOSTNAME})"

kubectl apply -n "$NAMESPACE" -f - <<MANIFEST
apiVersion: apps/v1
kind: Deployment
metadata:
  name: fiyuu-app
  labels:
    app.kubernetes.io/name: fiyuu-app
    app.kubernetes.io/instance: ${TENANT_SLUG}
    fiyuu.work/tenant: ${TENANT_SLUG}
spec:
  replicas: 1
  selector:
    matchLabels:
      app.kubernetes.io/name: fiyuu-app
      app.kubernetes.io/instance: ${TENANT_SLUG}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: fiyuu-app
        app.kubernetes.io/instance: ${TENANT_SLUG}
        fiyuu.work/tenant: ${TENANT_SLUG}
    spec:
      serviceAccountName: fiyuu-runtime
      automountServiceAccountToken: false
      securityContext:
        runAsNonRoot: true
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: app
          image: ${IMAGE}
          imagePullPolicy: Always
          ports:
            - containerPort: 4070
              name: http
          env:
            - name: NODE_ENV
              value: production
            - name: PORT
              value: "4070"
          resources:
            requests:
              cpu: 100m
              memory: 128Mi
            limits:
              cpu: 500m
              memory: 512Mi
          securityContext:
            allowPrivilegeEscalation: false
            readOnlyRootFilesystem: true
            runAsNonRoot: true
            capabilities:
              drop:
                - ALL
          volumeMounts:
            - name: tmp
              mountPath: /tmp
          readinessProbe:
            httpGet:
              path: /
              port: http
            initialDelaySeconds: 5
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /
              port: http
            initialDelaySeconds: 15
            periodSeconds: 15
      volumes:
        - name: tmp
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: fiyuu-app
  labels:
    app.kubernetes.io/name: fiyuu-app
    app.kubernetes.io/instance: ${TENANT_SLUG}
spec:
  selector:
    app.kubernetes.io/name: fiyuu-app
    app.kubernetes.io/instance: ${TENANT_SLUG}
  ports:
    - name: http
      protocol: TCP
      port: 80
      targetPort: http
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: fiyuu-app
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "15m"
    nginx.ingress.kubernetes.io/limit-rps: "20"
    nginx.ingress.kubernetes.io/limit-burst-multiplier: "2"
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - ${HOSTNAME}
      secretName: fiyuu-work-wildcard-tls
  rules:
    - host: ${HOSTNAME}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: fiyuu-app
                port:
                  number: 80
MANIFEST

echo "[fiyuu-work] tenant deployment applied: https://${HOSTNAME}"
