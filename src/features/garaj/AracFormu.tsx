import { useId, useRef, useState, type FormEvent } from "react";
import {
  ARAC_TURLERI,
  yeniAracDogrula,
  type AlanHatalari,
  type AracHatasi,
  type AracTuru,
  type GecerliYeniArac,
  type YeniAracGirdisi,
} from "../../domain/arac";

// User-facing Turkish texts of the garage feature (spec 0001, User experience).
export const METIN = {
  baslik: "Garajım",
  yukleniyor: "Yükleniyor…",
  bos: "Garajında henüz araç yok",
  aracEkle: "Araç ekle",
  okumaHatasi: "Araçlar yüklenemedi. Tarayıcı depolamasına erişilemiyor.",
  kayitHatasi: "Araç kaydedilemedi. Tarayıcı depolamasına erişilemiyor.",
  formBaslik: "Araç ekle",
  tur: "Tür",
  turSecin: "Seçin",
  marka: "Marka",
  model: "Model",
  plaka: "Plaka",
  kaydet: "Kaydet",
  kaydediliyor: "Kaydediliyor…",
  vazgec: "Vazgeç",
} as const;

export const TUR_ADI: Record<AracTuru, string> = {
  otomobil: "Otomobil",
  motosiklet: "Motosiklet",
  scooter: "Scooter",
};

export const HATA_METNI: Record<AracHatasi, string> = {
  TUR_SECILMEDI: "Araç türünü seçin",
  ZORUNLU: "Bu alan zorunlu",
  EN_FAZLA_50: "En fazla 50 karakter",
  PLAKA_GECERSIZ_KARAKTER: "Plaka yalnızca harf ve rakam içerebilir",
  PLAKA_ZATEN_VAR: "Bu plaka garajda zaten var",
};

type Props = {
  mevcutPlakalar: readonly string[];
  /** Resolves when stored; rejects when storage fails (the form then keeps its values). */
  onKaydet: (arac: GecerliYeniArac) => Promise<void>;
  onVazgec: () => void;
};

const BOS: YeniAracGirdisi = { tur: "", marka: "", model: "", plaka: "" };

export function AracFormu({ mevcutPlakalar, onKaydet, onVazgec }: Props) {
  const id = useId();
  const [degerler, setDegerler] = useState<YeniAracGirdisi>(BOS);
  const [hatalar, setHatalar] = useState<AlanHatalari>({});
  const [kayitHatasi, setKayitHatasi] = useState(false);
  const [kaydediliyor, setKaydediliyor] = useState(false);
  const kayitSuruyor = useRef(false); // R-9: a second submit before re-render is ignored too

  const degistir = (alan: keyof YeniAracGirdisi) => (deger: string) =>
    setDegerler((onceki) => ({ ...onceki, [alan]: deger }));

  async function gonder(olay: FormEvent<HTMLFormElement>) {
    olay.preventDefault();
    if (kayitSuruyor.current) return;
    const sonuc = yeniAracDogrula(degerler, mevcutPlakalar);
    if (!sonuc.ok) {
      setHatalar(sonuc.hata);
      return;
    }
    setHatalar({});
    setKayitHatasi(false);
    kayitSuruyor.current = true;
    setKaydediliyor(true);
    try {
      await onKaydet(sonuc.value);
    } catch {
      // docs/conventions.md: the raw error never reaches the screen.
      setKayitHatasi(true);
      kayitSuruyor.current = false;
      setKaydediliyor(false);
    }
  }

  const alan = (ad: keyof YeniAracGirdisi) => {
    const hata = hatalar[ad];
    const hataId = `${id}-${ad}-hata`;
    return {
      girdi: {
        id: `${id}-${ad}`,
        value: degerler[ad],
        "aria-invalid": hata ? true : undefined,
        "aria-describedby": hata ? hataId : undefined,
      },
      etiket: { htmlFor: `${id}-${ad}` },
      hata: hata ? (
        <p id={hataId} role="alert">
          {HATA_METNI[hata]}
        </p>
      ) : null,
    };
  };

  const tur = alan("tur");
  const marka = alan("marka");
  const model = alan("model");
  const plaka = alan("plaka");

  return (
    <form onSubmit={gonder} noValidate aria-labelledby={`${id}-baslik`}>
      <h2 id={`${id}-baslik`}>{METIN.formBaslik}</h2>

      <label {...tur.etiket}>{METIN.tur}</label>
      <select {...tur.girdi} onChange={(e) => degistir("tur")(e.target.value)}>
        <option value="">{METIN.turSecin}</option>
        {ARAC_TURLERI.map((t) => (
          <option key={t} value={t}>
            {TUR_ADI[t]}
          </option>
        ))}
      </select>
      {tur.hata}

      <label {...marka.etiket}>{METIN.marka}</label>
      <input {...marka.girdi} onChange={(e) => degistir("marka")(e.target.value)} />
      {marka.hata}

      <label {...model.etiket}>{METIN.model}</label>
      <input {...model.girdi} onChange={(e) => degistir("model")(e.target.value)} />
      {model.hata}

      <label {...plaka.etiket}>{METIN.plaka}</label>
      <input
        {...plaka.girdi}
        autoCapitalize="characters"
        onChange={(e) => degistir("plaka")(e.target.value)}
      />
      {plaka.hata}

      {kayitHatasi ? <p role="alert">{METIN.kayitHatasi}</p> : null}

      <button type="submit" disabled={kaydediliyor}>
        {kaydediliyor ? METIN.kaydediliyor : METIN.kaydet}
      </button>
      <button type="button" onClick={onVazgec}>
        {METIN.vazgec}
      </button>
    </form>
  );
}
