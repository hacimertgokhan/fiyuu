# Sade Framework Mimarisi (Inventory Uygulamasi)

Bu ornek uygulamada asagidaki cekirdek protokoller aktiflestirildi:

## 1) Anti-Ternary Kontrol Etiketleri
- `lib/pure-framework.ts` icinde `If`, `Else`, `For` primitive'leri eklendi.
- Sayfalarda template icinde karmasik kosul/iterasyon bloklari yerine bu primitive'ler kullanildi.

Ornek:
```ts
${If({ condition: categories.length > 0, then: () => html`<p>...</p>` })}

${For({
  each: products,
  render: (product) => productRow(product),
  empty: () => html`<tr>...</tr>`,
})}
```

## 2) Anti-Effect ve Reaktif Akis
- Manuel dependency listesi gerektiren bir yapi yok.
- `createFlatStore` (signal tabanli) eklendi.
- Urunler sayfasinda istemci tarafi form/saving durumu store ile yonetiliyor.

## 3) Anti-Provider Flat Store
- `lib/inventory-flat-store.ts` global import/export store olarak eklendi.
- Para birimi, locale, varsayilan birim gibi ortak durumlar dogrudan import edilerek kullaniliyor.

## 4) Anti-Class Soup / Scoped Stil
- `scopedStyles` helper'i eklendi (`:scope` tabanli).
- `app/page.tsx` ve `app/products/page.tsx` lokal stilleri scope ederek tanimliyor.

## 5) Insancil Hata Yonetimi
- `humanDebugOverlay()` eklendi ve `app/layout.tsx` icinde global aktif edildi.
- Hata paneli; mesaj, dosya/satir, son etkilesilen etiket ve olasi mantik eksigini insan dilinde gosterir.

## 6) Islands + Resumability Yonelimi
- `lib/pure-framework.ts` icinde `island(...)` helper'i eklendi.
- Interaktif kodun click/hover/visible tetikleyicileriyle gec baslatilmasi desteklenir.

## 7) Standartlara Donus
- Tum primitive'ler standart JavaScript + Web API ustune kuruldu.
- Ozel buyulu syntax yerine okunur fonksiyonel DSL tercih edildi.

## Uygulanan Dosyalar
- `lib/pure-framework.ts`
- `lib/inventory-flat-store.ts`
- `app/page.tsx`
- `app/products/page.tsx`
- `app/layout.tsx`
