# Security

> Bootstrap 2026-11-13. Faz 1 (çevrimdışı, sunucusuz) için temel kurallar; her plan ve review bunlara uyar.

## Secrets
- Secrets never enter the repo, specs, prompts, or chat. `.env` is gitignored; provide `.env.example`.
- Agents never print secret values, even when debugging.
- Faz 1'de API anahtarı veya parola yoktur; bir tane gerekirse bu bir kapsam değişikliğidir (ADR).

## Input & output
- **Formlar:** her girdi `src/domain/` içinde doğrulanır (plaka BR-7, şasi BR-8, km BR-5,
  tutarlar BR-9) ve `Result` döner (`docs/conventions.md`, Error handling).
- **İçe aktarma güvenilmez veridir:** yedek dosyası `zod` şemasıyla tamamen doğrulanmadan
  veritabanına yazılmaz; bozuk veya eksik dosya mevcut veriyi asla ezmez.
- **Çıktı:** React metni escape eder; `dangerouslySetInnerHTML` ESLint ile yasak.
- **CSP:** sıkı Content-Security-Policy, en az `default-src 'self'; connect-src 'self'`
  (service worker kendi dosyalarını alabilsin); dış kaynaklı script/stil/font yok.
- Hata mesajları ve loglar ham veri (plaka, şasi no, kayıt listeleri) veya stack trace içermez.

## AuthN / AuthZ
- Faz 1'de kimlik doğrulama yok: **cihaz, kullanıcıdır.** Bu bilinçli bir karardır (ADR 0001).
- Faz 3'te (sunucu) ADR ile ele alınır; varsayılan deny.

## Personal data (hassas alan 2, KVKK)
- Veri cihaz dışına çıkmaz: ağ API'leri Faz 1'de yasak (`docs/architecture.md`, Forbidden
  dependencies 4) ve CSP ile de engellenir.
- Analitik, telemetri, üçüncü taraf script yok; font ve ikonlar yerelden (CDN yok).
- Dışa aktarma dosyası yalnızca kullanıcının açık eylemiyle oluşturulur ve ekranda "bu dosya
  kişisel veri içerir (plaka, şasi no)" uyarısı gösterilir.

## Dependencies
- Yeni bağımlılık yalnızca **plan onayında**, adı ve gerekçesiyle eklenir; builder kendiliğinden
  paket ekleyemez (sapma → R-07).
- Lisans: yalnızca MIT, Apache-2.0, BSD, ISC.
- Bakım: son 12 ayda sürüm çıkmış olmalı; çalışma zamanı bağımlılıkları asgari tutulur.
- `package-lock.json` commit edilir; kurulum `npm ci`.
- `npm audit --audit-level=high` yalnızca **full** profilde çalışır (`requires audit: npm ping`
  — ağ ister); `--fast` çevrimdışı da çalışır.

## Review lens
Security is a mandatory dimension of every independent review (see `prompts/review.md`), not a
separate afterthought phase.
