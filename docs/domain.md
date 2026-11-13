# Domain

> cep-garaj: bireysel araç sahiplerinin garajındaki araçları, yasal yükümlülüklerini (muayene,
> trafik sigortası, MTV) ve bakım/masraf kayıtlarını telefonda takip ettiği uygulama.
> Bootstrap 2026-11-13. Burada olmayan bir terimi kod veya spec'te kullanmadan önce buraya ekleyin.

## Ürün ve fazlar
- **Faz 1 — Çevrimdışı MVP (şu anki kapsam):** veri yalnızca cihazda (IndexedDB); sunucu ve
  kimlik doğrulama yok. Çoklu araçlı garaj, akıllı hatırlatıcılar (geri sayım), bakım/yakıt/masraf
  kayıtları ve masraf özeti. İlk spec: walking skeleton.
- **Faz 2 — Seyahat defteri:** motor/araç rotaları, tarihler ve kişisel notlar; kronolojik defter.
- **Faz 3 — Medya ve video birleştirme:** sunucu/bulut mimarisine geçişten sonra; seyahatlerdeki
  1–2 sn'lik videolar buluta yüklenip arka planda tek parça "highlight" filmine dönüştürülür.

Faz 2 ve Faz 3 şu an kapsam dışıdır (`docs/architecture.md`, Deliberately out of scope).

## Ubiquitous language

| Term | Meaning | Notes / not to be confused with |
|---|---|---|
| Garaj | Kullanıcının tüm araçlarının listesi ve özet ekranı (dashboard) | Fiziksel garaj, oto servis |
| Araç (`Arac`) | Garajdaki tek bir taşıt profili: tür (otomobil / motosiklet / scooter), marka, model, plaka, şasi no (VIN), güncel km, ilk tescil tarihi | — |
| Kilometre kaydı | Belirli bir tarihte okunan km değeri | Yakıt kaydındaki km |
| Hatırlatıcı | Tarihe bağlı yasal yükümlülük: muayene, trafik sigortası, MTV | Bakım hatırlatması (km'ye de bağlıdır, bkz. Bakım planı) |
| Geri sayım | Son tarihe kalan gün sayısı; negatifse durum "gecikti" | — |
| Bakım kaydı | Yapılmış periyodik bakım (yağ, lastik vb.): tarih, km, tutar | Masraf kaydı (her bakım kaydı bir masraftır, tersi değil) |
| Bakım planı | "Her X km'de veya Y ayda bir" kuralı; hangisi önce dolarsa | Bakım kaydı |
| Yakıt kaydı | Yakıt alımı: tarih, km, litre, tutar | — |
| Masraf | Tutarı olan her kayıt; kategoriler: yakıt, bakım, sigorta, MTV, diğer | — |
| Masraf özeti | Araç ve dönem bazında toplam tutar ve kategori dağılımı | — |
| Takvim günü (`TakvimGunu`) | Saatsiz, saat dilimsiz tarih (`YYYY-MM-DD`) | Zaman damgası (UTC ISO) |
| Kuruş (`Kurus`) | Tutarların saklandığı tam sayı birim (1 TL = 100 kuruş) | TL gösterimi (yalnızca ekranda) |

## Business rules
- **BR-1 Muayene (otomobil, motosiklet):** ilk muayene ilk tescil tarihinden 3 yıl sonra; sonrakiler
  son muayeneden itibaren 2 yılda bir.
- **BR-2 Muayene (scooter / 50 cc altı motorlu bisiklet):** kural varsayılmaz; muayene aralığını
  kullanıcı girer. Uygulama bu araç türü için varsayılan aralık uydurmaz.
- **BR-3 MTV:** yılda iki dönem, Ocak ve Temmuz; son ödeme günü ilgili ayın son günü.
- **BR-4 Trafik sigortası:** son tarih poliçe bitiş tarihidir; yenilemede yeni poliçe bitiş tarihi girilir.
- **BR-5 Kilometre:** yeni bir km değeri aracın mevcut km'sinden küçük olamaz.
- **BR-6 Bakım planı:** bir bakımın vadesi, km sınırı veya süre sınırından hangisi önce dolarsa odur.
- **BR-7 Plaka:** garaj içinde tekildir; normalize edilerek saklanır (büyük harf, boşluksuz).
- **BR-8 Şasi no:** isteğe bağlı; girilirse 17 karakter ve I, O, Q harflerini içermez.
- **BR-9 Para:** tüm tutarlar TL, kuruş cinsinden tam sayı olarak saklanır; kayan nokta yok.
- **BR-10 Araç silme:** araç kalıcı silinmez, arşivlenir; kayıtları korunur, masraf özetinden çıkar.

## Key domain invariants
- Para her yerde kuruş tam sayıdır (BR-9).
- Bir aracın km'si geriye gitmez (BR-5).
- Hatırlatıcı son tarihleri her zaman kurallardan **hesaplanır**, elle yazılmaz. Kullanıcı yalnızca
  kaynak tarihleri girer: ilk tescil, son muayene, poliçe bitişi (scooter için muayene aralığı).

## Sensitive areas
1. **Hatırlatıcı tarih hesapları** (BR-1…BR-4, BR-6) — yanlış tarih kullanıcıya gecikme cezası
   veya sigortasız araç kullanımı olarak döner. Ay sonu, 29 Şubat, saat dilimi ve "bugün"
   sınırları özellikle risklidir.
2. **Kişisel veri (KVKK)** — plaka, şasi no; Faz 2'de rota/konum ve notlar. Veri cihaz dışına
   çıkmaz, analitik/telemetri yok, dışa aktarma yalnızca kullanıcının açık eylemiyle
   (`docs/security.md`).

Masraf hesapları hassas alan **değildir** (bilgilendirme amaçlı, ödeme/transfer yok; BR-9 yeterli).
