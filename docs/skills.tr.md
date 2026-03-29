# Fiyuu Skills (TR)

## Skill nedir?

Skill, `skills/` klasorunde duran proje-baglamli TypeScript scriptidir.
Harici AI ajanlari veya gelistiriciler tarafindan proje grafigi ile calistirilir.

## Nerede bulunur?

Varsayılan klasör:

```text
skills/
```

Ornek dosyalar:

- `skills/seo-baseline.ts`
- `skills/perf-route-hotspots.ts`
- `skills/contract-coverage.ts`

## Skill calistirma

```bash
fiyuu skill list
fiyuu skill run seo-baseline
fiyuu skill run perf-route-hotspots
```

## Skill yazım önerisi

Her skill dosyası kısa ve net olmalıdır:

- Ne zaman kullanılacağı
- Hangi çıktıyı üretmesi gerektiği
- Hangi kurallara uyması gerektiği
- Projeye özel sınırlar

Ornek iskelet:

```ts
export const skill = {
  name: "custom-skill",
  description: "Bu skill ne yapiyor",
  tags: ["custom"],
};

export async function run(context) {
  console.log(context.graph.routes.length);
}
```

## İpuçları

- Skill sayısını düşük tut (odaklı olsun).
- Çakışan skill talimatları yazma.
- Proje büyüdükçe skill dosyalarını güncelle.
