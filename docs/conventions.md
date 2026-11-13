# Conventions

> Bootstrap 2026-11-13. Yalnızca gerçek kurallar: araçla denetlenen (tercih edilen) ya da
> review'da kontrol edilen.

## Language
<!-- Set at bootstrap (step 0) and mirrored in AGENTS.md. Changing it later is allowed — edit both
     places; existing documents are not translated retroactively. -->
- Chat language (interviews, sessions): Türkçe (`tr`)
- Document language (docs/, specs, plans, ADRs, review and verify reports): Türkçe (`tr`)
- Always English (protocol, not prose): ANEW core files, template headings and field labels,
  `Status:` values (Draft / Approved / In progress / Shipped), `Approved by / on:`, `Source:`.
- Code identifiers, branch names, commit messages: alan terimleri Türkçe ASCII (`Arac`,
  `muayeneTarihi`, `BakimPlani`, `Kurus`; ç/ş/ğ/ı/ö/ü yok); teknik kelimeler İngilizce
  (`repository`, `useCase`, `render`); dal adları ve commit mesajları İngilizce (`docs/git.md`).
- Agent messages (handoff summaries, refusals, `Next:` lines): chat language; command names, file
  paths and protocol fields verbatim.

## Language & framework versions
Sabitlendi: spec 0001 (2026-11-13), `package.json` exact sürümler + `package-lock.json`; kurulum her zaman `npm ci`.
- Node.js **26 LTS** (makinede 26.13.1; `requires` ≥ 26) ve npm 11 — yalnızca derleme/test; kullanıcı tarafında sunucu yok.
  (Bootstrap'te "24 LTS" yazılmıştı; plan 0001 Risk 1 ile 26'ya geçildi.)
- TypeScript 5.9.3 (`strict: true`; typescript-eslint 8.72 TS < 6.1 destekliyor), React 19.3.1, Vite 8.3.8, Dexie 4.4.7.
- Test: Vitest 5.1.0, jsdom 31.0.1, Testing Library (react 16.3.3, dom 10.4.2, user-event 14.6.10, jest-dom 7.0.1), fake-indexeddb 6.2.8.
- Araçlar: ESLint 10.14.0 + typescript-eslint 8.72.2, Prettier 3.10.1.
- Proje `.npmrc`: `legacy-peer-deps=false`, `engine-strict=true` (kullanıcı ayarlarını ezer; plan 0001 A-1).
- PWA (service worker + manifest): spec 0002.

## Naming
- Dosyalar `kebab-case.ts`; React bileşen dosyaları `PascalCase.tsx`.
- Tipler ve bileşenler `PascalCase`; fonksiyonlar ve değişkenler `camelCase`.
- Testler kaynağın yanında: `*.test.ts` / `*.test.tsx`; storage entegrasyon testleri `*.int.test.ts`.
- Alan terimleri `docs/domain.md` sözlüğündeki kelimeyle aynıdır (ör. `Arac`, `Vehicle` değil).

## Error handling
- **Beklenen hatalar fırlatılmaz:** doğrulama ve kural ihlalleri `Result` tipiyle döner —
  `{ ok: true, value } | { ok: false, hata: "KM_GERI_GIDEMEZ" }`. Hata kodları
  `SCREAMING_SNAKE_CASE`; ekran kodu Türkçe mesaja çevirir.
- **Beklenmeyen hatalar** error boundary'de yakalanır; kullanıcıya genel bir Türkçe mesaj
  gösterilir. Stack trace ve ham veri (plaka, şasi no) asla ekrana veya loga çıkmaz.

## Data rules
- Para: `Kurus` tipi, tam sayı (BR-9). Kayan nokta ile hesap yasak; TL biçimlendirmesi yalnızca ekranda.
- Takvim tarihleri (muayene, poliçe bitişi, kayıt tarihi): `TakvimGunu`, saklama `"YYYY-MM-DD"`,
  saat dilimi yok. "Bugün" yalnızca `src/app/` saat sağlayıcısında, cihazın yerel saatine göre üretilir.
- Tarih aritmetiği ("+3 yıl", ay sonu) `src/domain/` içinde, JS `Date` kullanmadan yıl/ay/gün
  tam sayılarıyla yapılır ve tamamı testle korunur (hassas alan 1).
- Zaman damgaları (`olusturulmaTarihi` vb.): UTC ISO-8601.
- ID'ler: `crypto.randomUUID()`.
- Km: negatif olmayan tam sayı.

## Known traps
<!-- Starts empty. One line per trap of this stack that a builder can know up front:
     "<trap> — <what to do instead> — from <spec/finding>". A line is added when triage marks a
     finding real and the reviewer says a build-time rule would have caught it; the human
     approves it at triage as Amendment A-n and the Developer writes it in the fix round.
     Builders read this section before the first plan step.
     A trap that tooling can catch moves to "Enforced by tooling" instead. -->
- `new Date("2026-03-01")` UTC olarak yorumlanır, yerel saatte gün kayabilir — takvim tarihleri için `TakvimGunu` kullan — from bootstrap 2026-11-13
- `setMonth(+1)` 31 Ocak'tan 3 Mart'a taşar; 29 Şubat + 1 yıl sorunlu — ay sonunu açıkça kurala bağla (29 Şubat + 1 yıl = 28 Şubat) — from bootstrap 2026-11-13
- `vitest` terminalde watch modunda açık kalır (resource hygiene) — check'te her zaman `vitest run` — from bootstrap 2026-11-13
- Dexie şeması değişip `version()` artırılmazsa kullanıcı verisi açılmaz/kaybolur — her şema değişikliği yeni `version(n)` + migration + migration entegrasyon testi — from bootstrap 2026-11-13
- Service worker eski sürümü önbellekte tutar — güncelleme stratejisini açıkça seç ("yeni sürüm var, yenile"); test ve geliştirmede service worker kapalı — from bootstrap 2026-11-13
- IndexedDB verisi depolama dolunca veya iOS'ta uzun kullanılmamada silinebilir — `navigator.storage.persist()` iste; dışa aktarma (yedek) ilk özellikler arasında — from bootstrap 2026-11-13
- ESLint `no-restricted-properties` yalnızca `nesne.özellik` biçimini eşler; `window.navigator.sendBeacon`, `window.self.fetch`, `Date()` gibi biçimler kaçar — global API yasaklarında `no-restricted-syntax` ile `property.name` / `callee` seçicisi kullan ve kural testine ekle — from 0001 review L-2

## Enforced by tooling
<!-- Wire new rules into `scripts/check` whenever possible — prose is advice, tooling is law. -->
Walking skeleton bunları `scripts/check` içine bağlar; o zamana kadar plan halindedir:
- TypeScript `strict` (typecheck adımı).
- ESLint: `docs/architecture.md` "Forbidden dependencies" 1–4 (import sınırları, ağ API'leri
  yasağı), `dangerouslySetInnerHTML` yasağı, `src/app/` dışında `new Date()`/`Date.now()` yasağı.
- Prettier biçimlendirmesi (kontrol modu).
