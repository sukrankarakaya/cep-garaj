# ADR 0001 — Faz 1: çevrimdışı PWA, modüler monolit

- Status: Accepted
- Date: 2026-11-13

## Context
cep-garaj Faz 1'de sunucusuz, çevrimdışı çalışan bir MVP olacak; asıl hedef telefon. Veri
yalnızca cihazda kalmalı (KVKK, hassas alan 2). Faz 3'te bulut mimarisine geçilecek; o geçişte
iş kuralları ve ekranlar yeniden yazılmamalı. Ekip küçük; derleme/test zinciri hafif olmalı.

## Decision
Uygulama TypeScript (strict) + React + Vite ile, IndexedDB (Dexie) üzerinde veri tutan bir PWA
olarak yazılır; yapı, lint ile denetlenen sınırlara sahip modüler bir monolittir
(`docs/architecture.md`).

## Consequences
- Kazanç: mağazasız kurulum, tam çevrimdışı çalışma, hafif test zinciri (Vitest, jsdom); saf
  `domain/` katmanı Faz 3'e taşınabilir; ağ yasağı veri sızıntısını araçla engeller.
- Bedel: uygulama kapalıyken güvenilir bildirim yok (özellikle iOS) — hatırlatıcılar uygulama
  açılınca gösterilir. Tarayıcı depolaması silinebilir (iOS, disk dolu) — kalıcı depolama izni
  ve dışa aktarma (yedek) erken planlanmalı.

## Alternatives considered
- **React Native (Expo):** kapalıyken yerel bildirim ve mağaza dağıtımı sağlar; ancak emülatör ve
  mağaza süreçleri derleme/test zincirini ve walking skeleton'ı belirgin büyütür. Faz 1'de
  kapalıyken bildirim olmazsa olmaz olmadığı için kaybetti.
- **localStorage:** ~5 MB sınır, senkron API, yalnızca metin; sorgu ve Faz 3 medyası için yetersiz.

## Revisit triggers
- Kapalıyken bildirim Faz 1/2 için zorunlu hale gelirse.
- Faz 3'e (sunucu/bulut) geçiş başladığında.
- Kullanıcılardan depolama silinmesi kaynaklı veri kaybı raporları gelirse.
