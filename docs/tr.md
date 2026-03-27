# Fiyuu Dokümanı (TR)

## Fiyuu nedir?

Fiyuu, **Gea temelli fullstack bir framework**tür.
Amaç; hem geliştiriciler hem de AI araçları için okunabilir, belirgin ve tutarlı bir yapı sunmaktır.

## Ana yaklaşım

- Route bazlı dosya yapısı net ve sabittir.
- Davranışlar açıktır (gizli sihir yoktur).
- Geliştirme sırasında görünürlük vardır (Dev Console, Insights, server trace).
- Birden fazla render modu desteklenir (`ssr`, `csr`, `ssg`).

## Proje oluşturma

```bash
npm create fiyuu-app@latest my-app
cd my-app
npm install
npm run dev
```

Kurulum sırasında özellik ve skill seçimi interaktif yapılır.

## Proje yapısı

Temel yapı:

```text
app/
  layout.tsx
  layout.meta.ts
  page.tsx
  query.ts
  schema.ts
  meta.ts
  not-found.tsx
  error.tsx
  api/
    .../route.ts
```

Örnek route klasörü (`/requests`):

```text
app/requests/
  page.tsx
  query.ts
  schema.ts
  meta.ts
  action.ts (opsiyonel)
```

## Temel komutlar

```bash
fiyuu dev
fiyuu build
fiyuu start
fiyuu sync
fiyuu doctor
fiyuu feat list
fiyuu feat socket on
fiyuu feat socket off
fiyuu ai setup
```

## Render modları

Route içindeki `meta.ts` dosyasında belirlenir:

- `ssr`: Her istekte server-side render
- `csr`: Client-side render
- `ssg`: Start modunda static benzeri cache render

## Dev Console (sadece development)

Dev modda tek panelde şu bilgiler bulunur:

- Runtime bilgileri
- AI insights
- Canlı server trace (aç/kapa)

Production modda aktif değildir.

## AI Inspector

```bash
fiyuu ai setup
```

Bu komut `.fiyuu/ai/` altında local AI altyapısını hazırlar.
Model varsa local AI, yoksa fallback mod çalışır.

## Tema

Tema özelliği seçildiyse starter projede light/dark geçiş butonu gelir.
Seçim `localStorage` ile hatırlanır.

## Skill dokümantasyonu

Skill yapısı ve kullanım detayları için:

- `docs/skills.tr.md` (Türkçe)
- `docs/skills.md` (English)

## Konfigürasyon

Ana ayar dosyası: `fiyuu.config.ts`

Sık kullanılan alanlar:

- `app`
- `ai` (özellikle `ai.inspector`)
- `fullstack`
- `websocket`
- `middleware`
- `developerTools`
- `featureFlags`

## Sorun giderme

- Yapı ve uyumluluk kontrolü için `fiyuu doctor` çalıştır.
- Yeni route/feature ekledikten sonra `fiyuu sync` çalıştır.
- Değişiklikler yansımıyorsa bağımlılıkları yeniden kur.
