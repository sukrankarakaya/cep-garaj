import { plakaDogrula, plakaNormalizeEt } from "./plaka";
import { basarisiz, tamam, type Result } from "./result";

export const ARAC_TURLERI = ["otomobil", "motosiklet", "scooter"] as const;
export type AracTuru = (typeof ARAC_TURLERI)[number];

export type Arac = {
  id: string;
  tur: AracTuru;
  marka: string;
  model: string;
  /** Normalized (BR-7). */
  plaka: string;
  /** UTC ISO-8601; the list is ordered by it, newest first. */
  olusturulmaTarihi: string;
};

/** What the form holds: raw strings, nothing validated yet. */
export type YeniAracGirdisi = { tur: string; marka: string; model: string; plaka: string };
export type GecerliYeniArac = Pick<Arac, "tur" | "marka" | "model" | "plaka">;

export type AracHatasi =
  "TUR_SECILMEDI" | "ZORUNLU" | "EN_FAZLA_50" | "PLAKA_GECERSIZ_KARAKTER" | "PLAKA_ZATEN_VAR";
export type AlanHatalari = Partial<Record<keyof YeniAracGirdisi, AracHatasi>>;

export const METIN_EN_FAZLA = 50;

function aracTuruMu(deger: string): deger is AracTuru {
  return (ARAC_TURLERI as readonly string[]).includes(deger);
}

function metinDogrula(girdi: string): Result<string, AracHatasi> {
  const metin = girdi.trim();
  if (metin === "") return basarisiz("ZORUNLU");
  if ([...metin].length > METIN_EN_FAZLA) return basarisiz("EN_FAZLA_50");
  return tamam(metin);
}

/**
 * Validates a new vehicle against the garage's existing plates (BR-7: unique after
 * normalization). Reports every invalid field at once.
 */
export function yeniAracDogrula(
  girdi: YeniAracGirdisi,
  mevcutPlakalar: readonly string[],
): Result<GecerliYeniArac, AlanHatalari> {
  const hatalar: AlanHatalari = {};
  const marka = metinDogrula(girdi.marka);
  const model = metinDogrula(girdi.model);
  const plaka = plakaDogrula(girdi.plaka);

  if (!aracTuruMu(girdi.tur)) hatalar.tur = "TUR_SECILMEDI";
  if (!marka.ok) hatalar.marka = marka.hata;
  if (!model.ok) hatalar.model = model.hata;
  if (!plaka.ok) hatalar.plaka = plaka.hata;
  else if (mevcutPlakalar.some((p) => plakaNormalizeEt(p) === plaka.value)) {
    hatalar.plaka = "PLAKA_ZATEN_VAR";
  }

  if (!aracTuruMu(girdi.tur) || !marka.ok || !model.ok || !plaka.ok || hatalar.plaka) {
    return basarisiz(hatalar);
  }
  return tamam({ tur: girdi.tur, marka: marka.value, model: model.value, plaka: plaka.value });
}
