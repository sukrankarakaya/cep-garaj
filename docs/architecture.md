# Architecture

> Bootstrap 2026-11-13. Karar verilmiş mimari; gerekçesi ADR 0001'de.

## System overview
cep-garaj, telefona kurulabilen tek sayfalık bir web uygulamasıdır (PWA): TypeScript + React +
Vite, veri cihazda IndexedDB'de (Dexie). Sunucu yoktur. Stil **modüler monolit**: tek uygulama,
lint ile denetlenen modül sınırları. Faz 3'te buluta geçerken yalnızca `storage/` katmanının
değişmesi, kuralların (`domain/`) ve ekranların yerinde kalması hedeflenir.
Gerekçe: [ADR 0001](decisions/0001-pwa-moduler-monolit.md).

## Modules / components and ownership

| Module | Single responsibility | Owns |
|---|---|---|
| `src/domain/` | Saf iş kuralları: tarih hesapları (BR-1…4, BR-6), km (BR-5), para (BR-9), plaka/şasi (BR-7, BR-8) | Kurallar ve alan tipleri (`Arac`, `TakvimGunu`, `Kurus`, `Result`) |
| `src/features/garaj/` | Araç ekleme, düzenleme, arşivleme; garaj ekranı | Araç akışları |
| `src/features/hatirlatici/` | Geri sayımlar, yaklaşan/gecikmiş listeleri | Hatırlatıcı akışları |
| `src/features/bakim/` | Bakım planı, bakım kaydı, yakıt kaydı | Kayıt akışları |
| `src/features/masraf/` | Masraf özeti | Özet akışları |
| `src/storage/` | IndexedDB (Dexie): şema, migration'lar, repository'ler | Kalıcı veri |
| `src/ui/` | Ortak görsel bileşenler (buton, form, rozet) | Görsel bileşenler |
| `src/app/` | Kabuk: yönlendirme, PWA kurulumu, saat sağlayıcı ("bugün") | Uygulama başlatma |

## Communication rules
- Akış: **ekran → feature → (domain + storage repository arayüzü)**. Doğrudan fonksiyon çağrısı;
  global event bus yok.
- **Saat dışarıdan verilir:** domain fonksiyonları "bugün"ü parametre olarak alır; `new Date()` /
  `Date.now()` yalnızca `src/app/` içindeki saat sağlayıcıda kullanılır.
- Feature'lar birbirini yalnızca diğerinin `index.ts` (public arayüz) üzerinden kullanır.

## Forbidden dependencies (make them testable)
ESLint kuralları ile denetlenir ve `scripts/check` içinde çalışır:
1. `src/domain/` hiçbir şey import etmez: React, Dexie, `src/storage/`, `src/features/`, `src/ui/`,
   `src/app/` yasak.
2. `src/features/*` Dexie'yi doğrudan import etmez; veriye yalnızca `src/storage/` public arayüzünden erişir.
3. Bir feature başka bir feature'ın iç dosyalarını import etmez; yalnızca `index.ts`.
4. **Faz 1'de ağ çağrısı yok:** `fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`
   kullanılmaz (hassas alan 2, KVKK). CSP ile tarayıcı seviyesinde de uygulanır (`docs/security.md`).

## Deliberately out of scope
- Sunucu, kimlik doğrulama, senkronizasyon, çoklu cihaz.
- Uygulama kapalıyken bildirim (push); Faz 1'de hatırlatıcılar uygulama açılınca gösterilir.
- Faz 2 (seyahat defteri) ve Faz 3 (bulut, video birleştirme).
Her biri kapsama alınırken bir ADR ile açılır.
