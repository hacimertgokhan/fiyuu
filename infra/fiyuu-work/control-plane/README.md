# Fiyuu Work Control Plane

Bu servis, `fiyuu.work` üzerinde hesap/token/proje/deploy yönetimini sağlar.

Kritik kurallar:
- Hesap bazlı token üretimi
- CLI token ile hesap eşleşmesi
- Ücretsiz plan için kullanıcı başına **max 3 proje**
- `slug.fiyuu.work` subdomain üretimi

## Hızlı Başlatma

```bash
cd infra/fiyuu-work/control-plane
export FIYUU_ADMIN_SECRET='change-this-secret'
npm run start
```

Varsayılan port: `7788`

Deploy queue worker:

```bash
cd infra/fiyuu-work/control-plane
export FIYUU_DEPLOY_HOOK='/opt/fiyuu/hooks/deploy-tenant.sh'
npm run start:worker
```

Worker, queued deployment için hook komutunu şu argümanlarla çağırır:
`<deploymentId> <projectSlug> <subdomain> <artifactPath>`

## Public Auth Akışı

`register`:

```bash
curl -X POST http://127.0.0.1:7788/v1/accounts/register \
  -H 'content-type: application/json' \
  -d '{"email":"user@fiyuu.work","name":"User","password":"strongpass123"}'
```

`login`:

```bash
curl -X POST http://127.0.0.1:7788/v1/accounts/login \
  -H 'content-type: application/json' \
  -d '{"email":"user@fiyuu.work","password":"strongpass123"}'
```

Bu iki endpoint `sessionToken` döner.

Session ile CLI token üret:

```bash
curl -X POST http://127.0.0.1:7788/v1/accounts/cli-token \
  -H "authorization: Bearer <sessionToken>" \
  -H 'content-type: application/json' \
  -d '{"name":"my-laptop"}'
```

## CLI Eşleşmesi

```bash
fiyuu cloud login <api-token> --endpoint http://127.0.0.1:7788
fiyuu cloud project create demo
fiyuu cloud projects
fiyuu cloud deploy demo
```

`project create` çağrısı `free` plan için 3 proje limitini API seviyesinde uygular.

## Admin Bootstrap

```bash
curl -X POST http://127.0.0.1:7788/v1/admin/bootstrap \
  -H 'content-type: application/json' \
  -H 'x-admin-secret: change-this-secret' \
  -d '{"email":"owner@fiyuu.work","name":"Owner","plan":"enterprise"}'
```

## API Özeti

- `GET /healthz`
- `POST /v1/accounts/register`
- `POST /v1/accounts/login`
- `GET /v1/accounts/me` (session token)
- `POST /v1/accounts/cli-token` (session token)
- `POST /v1/admin/bootstrap` (admin secret)
- `GET /v1/me` (CLI/API token)
- `GET /v1/projects` (CLI/API token)
- `POST /v1/projects` (CLI/API token, free planda max 3)
- `POST /v1/tokens` (CLI/API token)
- `POST /v1/projects/:slug/deploy` (CLI/API token)
- `GET /v1/projects/:slug/deployments` (CLI/API token)

## Not

Bu repo içindeki `server.mjs` minimal ama çalışan bir referanstır.
Üretimde:
- PostgreSQL
- Queue + worker
- Merkezi kimlik/oturum servisi
- WAF/rate limit/audit log

kullanmalısın.
