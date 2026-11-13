import Dexie, { type DexieOptions, type EntityTable } from "dexie";
import type { Arac } from "../domain/arac";

export const DB_ADI = "cep-garaj";

/**
 * IndexedDB schema. Known traps: every schema change is a new version(n) with a migration and a
 * migration integration test — the device holds the only copy of the user's data.
 */
export class CepGarajDb extends Dexie {
  araclar!: EntityTable<Arac, "id">;

  constructor(ad: string = DB_ADI, secenekler?: DexieOptions) {
    super(ad, secenekler);
    this.version(1).stores({
      // &plaka: unique — a second line of defence behind the domain check (BR-7)
      araclar: "id, &plaka, olusturulmaTarihi",
    });
  }
}
