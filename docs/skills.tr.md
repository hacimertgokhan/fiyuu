# Fiyuu Skills (TR)

## Skill nedir?

Skill, AI Inspector ve AI akışlarında kullanılan görev odaklı bilgi paketidir.
Amaç, AI çıktısını daha tutarlı ve proje yapısına uygun hale getirmektir.

## Nerede bulunur?

Varsayılan klasör:

```text
skills/
```

Örnek dosyalar:

- `skills/product-strategist.md`
- `skills/support-triage.md`
- `skills/seo-optimizer.md`

## Setup sırasında skill seçimi

`create-fiyuu-app` sırasında skill seçimi interaktiftir (yön tuşları + space + enter).

## fiyuu.config.ts ayarı

```ts
export default {
  ai: {
    enabled: true,
    skillsDirectory: "./skills",
    defaultSkills: ["product-strategist", "seo-optimizer"],
  },
} as const;
```

## Skill yazım önerisi

Her skill dosyası kısa ve net olmalıdır:

- Ne zaman kullanılacağı
- Hangi çıktıyı üretmesi gerektiği
- Hangi kurallara uyması gerektiği
- Projeye özel sınırlar

Örnek iskelet:

```md
# SEO Optimizer

## Kullanım
- Route meta iyileştirme

## Kurallar
- seo.title zorunlu
- seo.description önerisi

## Çıktı
- Kısa, uygulanabilir maddeler
```

## İpuçları

- Skill sayısını düşük tut (odaklı olsun).
- Çakışan skill talimatları yazma.
- Proje büyüdükçe skill dosyalarını güncelle.
