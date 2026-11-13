import { IDBFactory, IDBKeyRange } from "fake-indexeddb";
import type { Arac } from "../domain/arac";
import { dexieAracRepository } from "./arac-repository";
import { CepGarajDb } from "./db";

// Every test gets its own empty in-memory IndexedDB (docs/testing.md, Resource hygiene 5).
let indexedDB: IDBFactory;
const acik: CepGarajDb[] = [];

function yeniDb(): CepGarajDb {
  const db = new CepGarajDb("cep-garaj-test", { indexedDB, IDBKeyRange });
  acik.push(db);
  return db;
}

function arac(no: number, olusturulmaTarihi: string): Arac {
  return {
    id: `id-${no}`,
    tur: "otomobil",
    marka: `Marka ${no}`,
    model: `Model ${no}`,
    plaka: `34AB${no}`,
    olusturulmaTarihi,
  };
}

beforeEach(() => {
  indexedDB = new IDBFactory();
});

afterEach(() => {
  for (const db of acik.splice(0)) db.close();
});

describe("araç repository (IndexedDB)", () => {
  it("boş garajda boş liste döner", async () => {
    expect(await dexieAracRepository(yeniDb()).listele()).toEqual([]);
  });

  it("son eklenen en üstte", async () => {
    const repo = dexieAracRepository(yeniDb());
    await repo.ekle(arac(1, "2026-11-13T08:00:00.000Z"));
    await repo.ekle(arac(3, "2026-11-13T10:00:00.000Z"));
    await repo.ekle(arac(2, "2026-11-13T09:00:00.000Z"));
    expect((await repo.listele()).map((a) => a.id)).toEqual(["id-3", "id-2", "id-1"]);
  });

  it("yeni db örneği eklenen araçları aynı sırayla okur", async () => {
    const ilk = yeniDb();
    const repo = dexieAracRepository(ilk);
    await repo.ekle(arac(1, "2026-11-13T08:00:00.000Z"));
    await repo.ekle(arac(2, "2026-11-13T09:00:00.000Z"));
    const once = await repo.listele();
    ilk.close();

    // A fresh instance on the same device storage = the app restarted.
    const sonra = await dexieAracRepository(yeniDb()).listele();
    expect(sonra).toEqual(once);
    expect(sonra.map((a) => a.id)).toEqual(["id-2", "id-1"]);
    expect(sonra[0]).toEqual(arac(2, "2026-11-13T09:00:00.000Z"));
  });

  it("aynı plakayı ikinci kez kaydetmez (tekil indeks)", async () => {
    const repo = dexieAracRepository(yeniDb());
    await repo.ekle(arac(1, "2026-11-13T08:00:00.000Z"));
    await expect(
      repo.ekle({ ...arac(2, "2026-11-13T09:00:00.000Z"), plaka: "34AB1" }),
    ).rejects.toThrow();
    expect(await repo.listele()).toHaveLength(1);
  });
});
