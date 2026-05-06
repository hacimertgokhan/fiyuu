# Fiyuu (.fiu) — WebStorm / JetBrains Syntax Highlighting

TextMate bundle. Kurulum 3 adım.

---

## Kurulum — WebStorm / IntelliJ / Rider / GoLand

1. `Settings` → `Editor` → `TextMate Bundles` aç
2. `+` butonuna tıkla
3. Bu klasörü seç: `editors/jetbrains-textmate/`
4. IDE'yi yeniden başlat

Artık `.fiu` dosyaları renkli görünür.

Daha canlı görünüm istersen VS Code'da `Fiyuu Neon` temasını seç.

---

## Ne Renklendirir?

| Syntax | Renk |
|---|---|
| `@page`, `@component`, `@layout` | **Turuncu** — decorator |
| `@state name = "val"` | Mor — state adı, sarı — değer |
| `@query → QueryName` | Ok + sınıf adı ayrı renk |
| `component Name` | Mavi — keyword, açık mavi — isim |
| `template(data)` | Yeşil — keyword |
| `<div class="...">` | Kırmızı/pembe — tag |
| `<ComponentName />` | Sarı — component (büyük harf) |
| `prop={expr}` | Attribute ismi + embedded JS |
| `{interpolation}` | Gömülü JS ifadesi |
| `// yorum` | Gri — yorum |
| Stringler | Sarı/turuncu |
| JS keyword'ler | Mor (template içinde) |

---

## VS Code

Bu bundle VS Code ile de çalışır.

1. `.vscode/extensions/fiu-language/` klasörü oluştur
2. `fiu.tmLanguage.json`, `package.json`, `language-configuration.json` dosyalarını kopyala
3. VS Code'u yeniden başlat
4. `Preferences: Color Theme` içinden `Fiyuu Neon` temasını seç

---

## Scope Referansı

Kendi renk temanı yazmak istersen:

```
entity.name.tag.decorator.page.fiu      → @page
entity.name.tag.decorator.component.fiu → @component
entity.name.tag.decorator.state.fiu     → @state
entity.name.tag.decorator.query.fiu     → @query
entity.name.class.query.fiu             → → QueryName
variable.other.state.fiu                → state değişken adı
storage.type.component.fiu              → component keyword
entity.name.type.component.fiu          → ComponentName
storage.type.template.fiu               → template keyword
entity.name.tag.html.fiu                → html etiket adı
support.class.component.fiu             → <ComponentName>
entity.other.attribute-name.fiu         → attribute ismi
meta.interpolation.fiu                  → {expr} bloğu
```
