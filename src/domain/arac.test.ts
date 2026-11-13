import { yeniAracDogrula, type YeniAracGirdisi } from "./arac";

const gecerli: YeniAracGirdisi = {
  tur: "otomobil",
  marka: "Renault",
  model: "Clio",
  plaka: "34 abc 123",
};

describe("yeni araç doğrulaması", () => {
  it("geçerli girdiyi normalize edilmiş olarak kabul eder", () => {
    expect(yeniAracDogrula({ ...gecerli, marka: "  Renault ", model: " Clio  " }, [])).toEqual({
      ok: true,
      value: { tur: "otomobil", marka: "Renault", model: "Clio", plaka: "34ABC123" },
    });
  });

  it("marka ve model harf büyüklüğü korunur", () => {
    const sonuc = yeniAracDogrula({ ...gecerli, marka: "bMW", model: "r 1250 GS" }, []);
    expect(sonuc).toMatchObject({ ok: true, value: { marka: "bMW", model: "r 1250 GS" } });
  });

  it.each(["otomobil", "motosiklet", "scooter"])("tür kabul edilir: %s", (tur) => {
    expect(yeniAracDogrula({ ...gecerli, tur }, []).ok).toBe(true);
  });

  it.each(["", "kamyon"])("tür seçilmemişse reddedilir: %j", (tur) => {
    expect(yeniAracDogrula({ ...gecerli, tur }, [])).toEqual({
      ok: false,
      hata: { tur: "TUR_SECILMEDI" },
    });
  });

  it.each(["marka", "model", "plaka"] as const)(
    "%s boş ya da yalnızca boşluksa reddedilir",
    (alan) => {
      for (const deger of ["", "   "]) {
        expect(yeniAracDogrula({ ...gecerli, [alan]: deger }, [])).toEqual({
          ok: false,
          hata: { [alan]: "ZORUNLU" },
        });
      }
    },
  );

  it.each(["marka", "model"] as const)(
    "%s boşluklar silindikten sonra 50 karaktere kadar",
    (alan) => {
      const elli = "a".repeat(50);
      expect(yeniAracDogrula({ ...gecerli, [alan]: `  ${elli}  ` }, []).ok).toBe(true);
      expect(yeniAracDogrula({ ...gecerli, [alan]: "ş".repeat(50) }, []).ok).toBe(true);
      expect(yeniAracDogrula({ ...gecerli, [alan]: `${elli}b` }, [])).toEqual({
        ok: false,
        hata: { [alan]: "EN_FAZLA_50" },
      });
    },
  );

  it("geçersiz plaka karakteri reddedilir", () => {
    expect(yeniAracDogrula({ ...gecerli, plaka: "34-ABC-123" }, [])).toEqual({
      ok: false,
      hata: { plaka: "PLAKA_GECERSIZ_KARAKTER" },
    });
  });

  it("normalize plakası mevcut olan reddedilir", () => {
    expect(yeniAracDogrula({ ...gecerli, plaka: "34 ABC 123" }, ["34ABC123"])).toEqual({
      ok: false,
      hata: { plaka: "PLAKA_ZATEN_VAR" },
    });
    expect(yeniAracDogrula({ ...gecerli, plaka: "34 abı 12" }, ["06AA1", "34ABI12"])).toEqual({
      ok: false,
      hata: { plaka: "PLAKA_ZATEN_VAR" },
    });
    expect(yeniAracDogrula({ ...gecerli, plaka: "34 ABC 124" }, ["34ABC123"]).ok).toBe(true);
  });

  it("birden çok alan hatasını birlikte bildirir", () => {
    expect(yeniAracDogrula({ tur: "", marka: "", model: "Clio", plaka: "34-A" }, [])).toEqual({
      ok: false,
      hata: { tur: "TUR_SECILMEDI", marka: "ZORUNLU", plaka: "PLAKA_GECERSIZ_KARAKTER" },
    });
  });
});
