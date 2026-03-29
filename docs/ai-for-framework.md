# Fiyuu: AI Icin Calisan Framework

Bu proje runtime icinde entegre bir LLM calistirmayi hedeflemez.
Hedef, AI araclarinin projeyi daha iyi anlamasi ve guvenli mudahale yapmasidir.

## Prensipler

- Runtime deterministik kalir.
- AI baglami dosya-temelli olarak uretilir.
- Otomatik mudahaleler sadece dusuk riskli ve geri alinabilir olur.

## AI baglam dosyalari

`fiyuu sync` komutu `.fiyuu/` altinda su dosyalari uretir:

- `PROJECT.md`
- `PATHS.md`
- `STATES.md`
- `FEATURES.md`
- `WARNINGS.md`
- `SKILLS.md`
- `EXECUTION.md`
- `INTERVENTIONS.md`
- `DOCTOR.md`

Bu dosyalar harici AI ajanlarina (Copilot, Claude, OpenCode, vb.) dogrudan verilebilir.

## Guvenli mudahale akislari

`fiyuu doctor --fix` su an su alanlarda otomatik duzeltme uygular:

- `className=` -> `class=`
- eksik `execute()` fonksiyonlari (`action.ts`, `query.ts`)
- eksik `app/not-found.tsx` ve `app/error.tsx`
- eksik `seo.title` ve `seo.description`

Not: Riskli degisiklikler (XSS, React hook migration, noJs script ihlalleri) otomatik yapilmaz.

## SEO baseline

- Her route icin `seo.title` route'a ozel olmali.
- `seo.description` icin onerilen aralik: 12-28 kelime.

## Onerilen workflow

```bash
fiyuu sync
fiyuu doctor --fix
fiyuu doctor
fiyuu build
```

## Skills ile proje-baglamli otomasyon

Hazir skilller:

- `seo-baseline`
- `perf-route-hotspots`
- `contract-coverage`

Calistirma:

```bash
fiyuu skill list
fiyuu skill run seo-baseline
```
