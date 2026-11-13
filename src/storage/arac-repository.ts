import type { Arac } from "../domain/arac";
import { CepGarajDb } from "./db";

/** The public interface of storage for vehicles; features depend on this, never on Dexie. */
export interface AracRepository {
  /** Every vehicle in the garage, newest first (by olusturulmaTarihi). */
  listele(): Promise<Arac[]>;
  /** Stores a validated vehicle. Rejects when storage is unavailable. */
  ekle(arac: Arac): Promise<void>;
}

export function dexieAracRepository(db: CepGarajDb = new CepGarajDb()): AracRepository {
  return {
    listele: () => db.araclar.orderBy("olusturulmaTarihi").reverse().toArray(),
    ekle: async (arac) => {
      await db.araclar.add(arac);
    },
  };
}
