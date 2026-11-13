# Spec 0001 — Walking skeleton: garaja araç ekleme ve listeleme

- Status: In progress
- Mode: lite
- Plan: `specs/plans/0001-plan.md`
- Self-critique: done

## Intent
Araç sahibi cep-garaj'ı ilk açtığında garajına bir araç (tür, marka, model, plaka) ekleyebilmeli
ve onu garaj listesinde görebilmeli. Eklenen araçlar telefonda saklanır; sayfa yenilense ya da
uygulama kapatılıp açılsa da kaybolmaz ve cihaz dışına çıkmaz (hassas alan 2, KVKK). Başarı: bu
en küçük dilim uçtan uca çalışır ve projenin doğrulama zinciri (`scripts/check`) ilk kez gerçek
adımlarla yeşil olur. Bilinçli olarak yapılmayanlar: düzenleme, arşivleme, şasi no, km, tarihler,
hatırlatıcılar, masraflar ve telefona kurulum / çevrimdışı açılış (PWA, spec 0002).

## Requirements
- R-1 Garaj ekranı, garajdaki araçları listeler; sıralama ölçütü aracın eklenme zamanıdır, son
  eklenen en üstte (yeniden açılışta da aynı ölçüt). Her satırda tür, marka,
  model ve (normalize edilmiş) plaka görünür.
- R-2 Kullanıcı "Araç ekle" ile bir form açar; tür (Otomobil / Motosiklet / Scooter), marka,
  model ve plaka zorunludur.
- R-3 Plaka BR-7'ye göre normalize edilir (büyük harf, tüm boşluklar silinir) ve garaj içinde
  tekildir; tekillik normalize edilmiş değer üzerinden karşılaştırılır. Büyük harfe çevirme
  cihazın dilinden bağımsızdır: `i`, `ı` ve `İ` her zaman `I` olur. Normalize edilmiş plaka yalnızca
  A–Z harfleri ve 0–9 rakamlarından oluşabilir (tam biçim kontrolü B-2'de).
- R-3a Marka ve model baştaki/sondaki boşluklar silinerek saklanır; harf büyüklüğü girildiği gibi
  korunur; boşluklar silindikten sonra 1–50 karakter olmalıdır.
- R-4 Geçersiz girdide araç kaydedilmez; kullanıcı hangi alanın neden reddedildiğini görür ve
  girdiği bilgiler formda kalır.
- R-5 Kaydedilen araçlar cihazda kalıcıdır: uygulama yeniden açıldığında aynı liste görünür.
- R-6 Kayıt veya okuma depolama hatası yüzünden başarısız olursa kullanıcı genel bir Türkçe hata
  mesajı görür; ham hata metni gösterilmez, formdaki bilgiler silinmez.
- R-7 Uygulama açılışta tarayıcıdan kalıcı depolama izni ister; sonuç kullanıcıya gösterilmez
  ve uygulamanın çalışmasını etkilemez.
- R-8 Uygulama kodu hiçbir ağ API'si çağırmaz; veri cihaz dışına çıkmaz. (Sayfanın kendi
  dosyalarının yüklenmesi bu kuralın dışındadır.)
- R-9 Kayıt sürerken "Kaydet" tekrar tetiklenemez.

## User experience
- Flow: uygulama açılır → garaj ekranı (liste veya boş durum) → "Araç ekle" → form → "Kaydet" →
  garaj ekranına dönülür, yeni araç listenin en üstünde. Formda "Vazgeç" garaj ekranına kayıt
  yapmadan döner.
- States:
  - Garaj — yükleniyor: araçlar okunurken "Yükleniyor…" metni.
  - Garaj — boş: "Garajında henüz araç yok" metni ve "Araç ekle" butonu.
  - Garaj — liste: araç satırları ve "Araç ekle" butonu.
  - Garaj — hata: okuma başarısızsa "Araçlar yüklenemedi. Tarayıcı depolamasına erişilemiyor."
  - Form — doğrulama hatası: ilgili alanın yanında alan bazlı mesaj; diğer alanlar korunur.
  - Form — kayıt hatası: "Araç kaydedilemedi. Tarayıcı depolamasına erişilemiyor."; bilgiler korunur.
  - Form — başarılı: garaj ekranına dönüş, araç listede.
  - Yetkisiz durum: yok (Faz 1'de kimlik doğrulama yok; cihaz kullanıcıdır).
- Design reference: none — the flow above is the design.
- Accessibility: her alanın görünür ve programatik olarak bağlı bir etiketi var; tüm akış yalnızca
  klavyeyle (Tab ve Enter) tamamlanabilir; "Vazgeç" klavyeyle erişilebilen bir butondur (Esc
  kısayolu kapsam dışı); hata mesajları ilgili
  alana bağlı ve ekran okuyucuya duyurulur; metin kontrastı WCAG 2.1 AA.

## Constraints & out of scope
- Sensitive area: Kişisel veri (KVKK) — plaka cihazda saklanır; ağ isteği yok (R-8).
- Split: proposed none (0001 tek); kept as one — sukrankarakaya, walking skeleton tek dilim olmalı.
- Teknik kısıtlar (davranış değil; plan bunların nasılını belirler):
  - Stack ve modül sınırları `docs/architecture.md` ve ADR 0001'e uyar; 4 yasak bağımlılık
    ESLint ile `scripts/check` içinde denetlenir.
  - `scripts/check.conf` içindeki planlı adımlar aktif hale gelir; `./scripts/check` (full ve
    `--fast`) gerçek adımlarla yeşil; `./scripts/residue` iki profilde temiz; her test adımının
    test sayısı switch'lerden önce ve sonra aynı.
  - CI (`.github/workflows/check.yml`) Node 26 LTS ve `npm ci` ile full profili çalıştırır
    (plan 0001 Risk 1 kararı).
  - Kesin bağımlılık sürümleri `package-lock.json` ile sabitlenir ve `docs/conventions.md`'ye yazılır.
- Out of scope: araç düzenleme, silme ve arşivleme (BR-10); şasi no (BR-8); km (BR-5); tescil
  tarihi ve tüm hatırlatıcılar (hassas alan 1); bakım, yakıt, masraf; Türk plaka biçimi kontrolü
  (B-2); PWA kurulumu, service worker ve çevrimdışı açılış (spec 0002); dışa/içe aktarma.

## Acceptance criteria
- [ ] AC-1 — Garajda araç yokken garaj ekranı "Garajında henüz araç yok" metnini ve "Araç ekle" butonunu gösterir.
- [ ] AC-2 — Araçlar okunurken garaj ekranı "Yükleniyor…" gösterir; okuma bitince liste veya boş durum görünür.
- [ ] AC-3 — Dört alan geçerli doldurulup kaydedilince garaj ekranına dönülür ve araç tür, marka, model ve plakasıyla listede görünür; kayıt sürerken "Kaydet" devre dışıdır (iki hızlı tıklama tek araç oluşturur).
- [ ] AC-4 — Uygulama yeniden başlatıldığında (aynı cihaz depolaması) daha önce eklenen araçlar aynı sırayla listelenir.
- [ ] AC-5 — Birden çok araç varken liste eklenme zamanına göre, son eklenen en üstte olacak şekilde sıralıdır.
- [ ] AC-6 — Tür seçilmemişse, marka, model veya plakadan biri boş ya da yalnızca boşluksa, marka veya model boşluklar silindikten sonra 50 karakteri aşıyorsa ("En fazla 50 karakter") ya da normalize edilmiş plaka A–Z ve 0–9 dışında karakter içeriyorsa ("Plaka yalnızca harf ve rakam içerebilir"; ör. "34-ABC-123", "34ÇŞ12") araç kaydedilmez; o alan için mesaj gösterilir ve diğer alanların değerleri korunur. Marka ve model baştaki/sondaki boşluklar silinmiş, harf büyüklüğü korunmuş olarak kaydedilir.
- [ ] AC-7 — Plaka büyük harfe çevrilip tüm boşlukları silinerek kaydedilir ve öyle gösterilir (ör. " 34 abc 123 " → "34ABC123"); çevirme cihaz dilinden bağımsızdır: "34 abi 12", "34 abı 12" ve "34 İab 12" → "34ABI12" / "34IAB12" (tr-TR locale'de de).
- [ ] AC-8 — Normalize edilmiş hali garajdaki bir aracın plakasıyla aynı olan plaka (ör. "34abc123" varken "34 ABC 123") kaydedilmez ve "Bu plaka garajda zaten var" mesajı gösterilir.
- [ ] AC-9 — Kayıt depolama hatasıyla başarısız olursa form "Araç kaydedilemedi. Tarayıcı depolamasına erişilemiyor." mesajını gösterir, girilen değerler korunur ve ham hata metni görünmez; okuma başarısızsa garaj ekranı "Araçlar yüklenemedi. Tarayıcı depolamasına erişilemiyor." gösterir.
- [ ] AC-10 — Uygulama açılışta kalıcı depolama izni ister; izin reddedilse veya API yoksa kullanıcıya bir şey gösterilmez ve ekleme/listeleme çalışmaya devam eder.
- [ ] AC-11 — Uygulama kodu ağ API'si çağırmaz: ekleme ve listeleme akışları boyunca fetch, XMLHttpRequest, WebSocket ve sendBeacon hiç çağrılmaz, ve kaynak kodda bunların kullanımı `scripts/check` tarafından reddedilir (sayfanın kendi dosyalarının yüklenmesi kapsam dışı).

## Definition of Done
- [ ] Every acceptance criterion mapped to proof (test or reproducible observation)
- [ ] `scripts/check` green
- [ ] Independent review done; real findings fixed, noise rejected with written rationale, deferred ones in `specs/backlog.md`
- [ ] Docs / ADRs updated if behavior or architecture changed
- [ ] Spec moved to `specs/done/` (it becomes immutable there)

## Scorecard (fill at ship — honest numbers make the process improvable)
| Metric | Value |
|---|---|
| Spec revisions | 2 (plan gate, R-08: `İ` → `I`; review round 1 L-1, R-08: Node 24 → 26 — 2026-11-13) |
| Fix rounds | |
| Review findings: real / noise / deferred | |
| Regressions introduced | |
| Bugs escaped to production | |
