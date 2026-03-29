# Fiyuu v2 Product Spec (TR)

## 1) Ürün Tezi (tek cümle)

Fiyuu, web uygulamalarını sadece çalıştırılabilir degil, ayni zamanda AI tarafindan guvenilir sekilde anlasilabilir hale getiren AI-native bir frameworktur.

## 2) Problem Tanimi

Bugun frameworkler routing/rendering problemini iyi cozerken, ekiplerin yeni problemi surada birikiyor:

- AI araclari kod niyetini tutarli okuyamiyor
- Buyuk codebase'lerde etki analizi ve refactor guveni dusuk kaliyor
- "Prompt + code edit" akislarinda baglam kaybi sik yasaniyor

Fiyuu v2'nin odagi bu problemi urun seviyesinde cozmektir.

## 3) Hedef Kullanici

- AI-assisted calisan fullstack ekipler
- Internal tool / dashboard gelistiren urun ekipleri
- Deterministic convention isteyen TypeScript ekipleri

## 4) Net Deger Onerisi

- Route contract'lari standart: `page.tsx`, `query.ts`, `action.ts`, `schema.ts`, `meta.ts`
- Tek komutla graph + AI docs cikar: `fiyuu sync`
- AI prompt'larina route-aware context verir: `fiyuu ai "..."`
- Doktor komutuyla proje kurallarini surekli denetler: `fiyuu doctor`

## 5) v2 Scope (bilerek dar)

### In-scope

- AI graph uretimi ve surdurulebilir schema
- SSR + cache + revalidation cekirdegi
- Deterministic routing contracts
- CLI ve tanilanabilir error experience

### Out-of-scope (v2 icin)

- Kapsamli SSR/CSR/SSG feature parity yarisi
- Buyuk plugin marketi
- Tum edge provider adapter'lari

## 6) Killer Feature

AI-readable project graph + CLI workflow:

1. `fiyuu sync` -> `.fiyuu/graph.json` ve AI dokumanlari
2. `fiyuu ai "prompt"` -> route/query/action baglamini dis LLM'e tasinabilir formatta verme
3. CI adimi -> graph degisimlerinde etki analizi raporu

## 7) Basari Metrikleri (North Star + Guardrails)

- North Star: AI context readiness time (hedef: <= 1s / 100 route)
- Guardrail 1: cold build time
- Guardrail 2: SSR p95 latency
- Guardrail 3: toplam client JS bundle boyutu

Detayli olcum metodolojisi icin `docs/benchmark-matrix.md` kullanilir.

## 8) 90 Gunluk Plan

### Faz 1 (0-30 gun)

- Benchmark harness ve baseline olcumleri yayinla
- README positioning metnini netlestir
- 1 adet referans demo app ve quickstart akisini guclendir

### Faz 2 (30-60 gun)

- Graph schema freeze (v2)
- AI workflow demo: etki analizi + route bagimlilik ciktisi
- CLI DX iyilestirmeleri (error mesaji, debug trace)

### Faz 3 (60-90 gun)

- Built-in cache + request deduplication
- Revalidation stratejisi (ISR-benzeri)
- Ilk resmi plugin seti (auth, db, cache)

## 9) Rekabet Konumlandirmasi (kisa)

- Next/Nuxt/Astro: rendering + ecosystem olgunlugu yuksek
- Fiyuu v2 farki: AI-native graph merkezli developer workflow

Fiyuu "her seyi daha iyi" iddia etmez; AI-first gelistirme akisinda daha guvenilir baglam sunmayi hedefler.

## 10) v2 Release Exit Criteria

- Public benchmark tablosu dolu ve tekrar edilebilir
- README'de "neden fiyuu" metriklerle destekli
- En az bir AI workflow demo videosu/dokumani
- Cache + revalidation uretim seviyesinde temel davranislari sagliyor
