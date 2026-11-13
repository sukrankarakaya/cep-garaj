import { plakaDogrula, plakaNormalizeEt } from "./plaka";

describe("plaka (BR-7)", () => {
  it("normalize eder: büyük harf, tüm boşluklar silinir", () => {
    expect(plakaNormalizeEt(" 34 abc 123 ")).toBe("34ABC123");
    expect(plakaNormalizeEt("06\tAB  12")).toBe("06AB12");
  });

  it("i ve ı locale'den bağımsız I olur; İ de I olur", () => {
    expect(plakaNormalizeEt("34 abi 12")).toBe("34ABI12");
    expect(plakaNormalizeEt("34 abı 12")).toBe("34ABI12");
    expect(plakaNormalizeEt("34 İab 12")).toBe("34IAB12");
  });

  it("tr-TR locale'de de aynı sonucu verir", () => {
    const orijinal = String.prototype.toUpperCase;
    // Simulate a runtime whose default case mapping is Turkish (i → İ).
    String.prototype.toUpperCase = function (this: string) {
      return this.toLocaleUpperCase("tr-TR");
    };
    try {
      expect(plakaNormalizeEt("34 abi 12")).toBe("34ABI12");
      expect(plakaNormalizeEt("34 İab 12")).toBe("34IAB12");
    } finally {
      String.prototype.toUpperCase = orijinal;
    }
  });

  it("normalize edilmiş plakayı döner", () => {
    expect(plakaDogrula(" 34 abc 123 ")).toEqual({ ok: true, value: "34ABC123" });
  });

  it.each(["", "   ", "\t"])("boş plaka reddedilir: %j", (girdi) => {
    expect(plakaDogrula(girdi)).toEqual({ ok: false, hata: "ZORUNLU" });
  });

  it.each(["34-ABC-123", "34ÇŞ12", "34.AB.12", "34ğ12", "34AB12!"])(
    "A–Z ve 0–9 dışında karakter reddedilir: %s",
    (girdi) => {
      expect(plakaDogrula(girdi)).toEqual({ ok: false, hata: "PLAKA_GECERSIZ_KARAKTER" });
    },
  );
});
