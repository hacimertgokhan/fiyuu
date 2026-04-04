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
fiyuu doctor --fix
fiyuu graph stats
fiyuu graph export --format markdown --out docs/graph.md
fiyuu feat list
fiyuu feat socket on
fiyuu feat socket off
fiyuu skill list
fiyuu skill run seo-baseline
```

## Render modları

Route içindeki `meta.ts` dosyasında belirlenir:

- `ssr`: Her istekte server-side render
- `csr`: Client-side render
- `ssg`: Start modunda static benzeri cache render

## Medya ve Responsive yardimcilari

`fiyuu/client` artik performans odakli medya ve responsive yardimcilari sunar:

- `optimizedImage(...)`: lazy loading, decoding ipuclari, fetch priority ve opsiyonel `<picture>` kaynaklari
- `optimizedVideo(...)`: preload varsayilanlari, coklu source tanimi ve daha guvenli oynatim ozellikleri
- `responsiveStyle(...)`, `mediaUp(...)`, `mediaDown(...)`, `mediaBetween(...)`, `fluid(...)`, `responsiveSizes(...)`

Bu yardimcilar string-temelli oldugu icin runtime hafif kalirken modern ergonomi saglar.

## Dev Console (sadece development)

Dev modda tek panelde şu bilgiler bulunur:

- Runtime bilgileri
- AI insights
- Canlı server trace (aç/kapa)

Production modda aktif değildir.

## AI icin Calisan Framework

Fiyuu runtime icinde entegre bir LLM calistirmaz.

- `fiyuu sync` ile `.fiyuu/` altinda AI'nin okuyabilecegi deterministic dokumanlar uretilir
- Insights panelde rule-based oneriler verilir
- guvenli otomatik mudahaleler `fiyuu doctor --fix` ile uygulanir

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
- `deploy` (`fiyuu deploy` icin SSH + PM2 ayarlari)
- `cloud` (`fiyuu cloud` icin control-plane endpoint/proje varsayilani)

## Sorun giderme

- Yapı ve uyumluluk kontrolü için `fiyuu doctor` çalıştır.
- Güvenli otomatik düzeltmeler için `fiyuu doctor --fix` çalıştır.
- Yeni route/feature ekledikten sonra `fiyuu sync` çalıştır.
- Değişiklikler yansımıyorsa bağımlılıkları yeniden kur.

Ek olarak `fiyuu doctor`, `page.tsx` dosyalarindaki ham `<img>` ve `<video>` kullanimlarini da uyarir.

## Strateji ve Benchmark

- Ürün yönü (TR): `docs/v2-product-spec.tr.md`
- Benchmark metodolojisi: `docs/benchmark-matrix.md`
- Benchmark logları ve release scorecard: `docs/benchmarks/README.md`
- AI workflow walkthrough: `docs/ai-demo.md`
- AI-for-framework rehberi: `docs/ai-for-framework.md`
