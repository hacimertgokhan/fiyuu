# fiyuu.work Altyapı Temeli

Bu klasör, `*.fiyuu.work` çok kiracılı (multi-tenant) yayın için başlangıç altyapısını verir.

## İçerik

- `k8s/platform/*`: cluster baseline, wildcard TLS ve metadata bloklama örnekleri
- `scripts/create-tenant-namespace.sh`: tenant namespace + quota + network policy
- `scripts/deploy-tenant-app.sh`: tenant container deploy + ingress
- `scripts/delete-tenant.sh`: tenant silme
- `control-plane/*`: hesap/token/proje/deploy API + queue worker

## Ana Makinede Yapman Gerekenler

1. DNS:
- `A` kaydı: `fiyuu.work` -> sunucu public IP
- `A` wildcard: `*.fiyuu.work` -> aynı public IP

2. Cluster:
- K3s/K8s kur
- `ingress-nginx` ve `cert-manager` yükle
- `infra/fiyuu-work/k8s/platform/00-cluster-baseline.yaml` uygula
- TLS için `01-wildcard-certificate.example.yaml` içindeki solver/email alanlarını doldurup uygula

3. Tenant izolasyonu:
- Her kullanıcıyı `tenant-<slug>` namespace’ine koy
- Namespace oluştururken `create-tenant-namespace.sh` kullan
- Varsayılan deny network policy + pod-security etiketlerini zorunlu tut

4. Control Plane:
- `infra/fiyuu-work/control-plane` altında API’yi çalıştır
- `FIYUU_ADMIN_SECRET` tanımla
- `data/store.json` için düzenli yedek al

5. Deploy Worker:
- `FIYUU_DEPLOY_HOOK` ile build/push/deploy scriptini tanımla
- Worker’ı daemon olarak çalıştır (`npm run start:worker`)

6. Reverse proxy:
- `api.fiyuu.work` -> control-plane (`:7788`)
- tenant trafiği ingress-nginx üzerinden `*.fiyuu.work`

## PM2 (ecosystem.config.js) Örneği

Hazır örnek dosya: `infra/fiyuu-work/ecosystem.config.example.cjs`

```js
module.exports = {
  apps: [
    {
      name: "fiyuu-control-plane",
      cwd: "/opt/fiyuu/control-plane",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: "7788",
        FIYUU_ADMIN_SECRET: "change-me",
      },
    },
    {
      name: "fiyuu-deploy-worker",
      cwd: "/opt/fiyuu/control-plane",
      script: "npm",
      args: "run start:worker",
      env: {
        NODE_ENV: "production",
        FIYUU_DEPLOY_HOOK: "/opt/fiyuu/hooks/deploy-tenant.sh",
      },
    },
  ],
};
```

## `fiyuu` CLI ile Kullanıcı Akışı

1. Kullanıcı dashboard’da hesap açar (`/v1/accounts/register`).
2. Dashboard session ile CLI token üretir (`/v1/accounts/cli-token`).
3. Kullanıcı localde:
- `fiyuu cloud login <token> --endpoint https://api.fiyuu.work`
- `fiyuu cloud project create mysite`
- `fiyuu cloud deploy mysite`

`free` planda API otomatik olarak max 3 proje sınırını uygular.
