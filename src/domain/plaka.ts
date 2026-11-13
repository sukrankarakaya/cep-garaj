import { basarisiz, tamam, type Result } from "./result";

export type PlakaHatasi = "ZORUNLU" | "PLAKA_GECERSIZ_KARAKTER";

/**
 * BR-7: uppercase, every whitespace removed. Independent of the device language: the Turkish
 * letters i, ı and İ always become I (a Turkish locale would turn i into İ).
 */
export function plakaNormalizeEt(girdi: string): string {
  return girdi.replace(/\s+/gu, "").replace(/[iıİ]/gu, "I").toUpperCase();
}

/** Normalized plate, or why it is rejected. Only A–Z and 0–9 (full format check: B-2). */
export function plakaDogrula(girdi: string): Result<string, PlakaHatasi> {
  const plaka = plakaNormalizeEt(girdi);
  if (plaka === "") return basarisiz("ZORUNLU");
  if (!/^[A-Z0-9]+$/u.test(plaka)) return basarisiz("PLAKA_GECERSIZ_KARAKTER");
  return tamam(plaka);
}
