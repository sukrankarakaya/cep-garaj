import { useEffect, useState } from "react";
import type { Arac, GecerliYeniArac } from "../../domain/arac";
import type { AracRepository } from "../../storage";
import { AracFormu, METIN, TUR_ADI } from "./AracFormu";

export type GarajBagimliliklari = {
  repository: AracRepository;
  /** Current instant as UTC ISO-8601 (the clock lives in src/app). */
  simdi: () => string;
  yeniId: () => string;
};

type Okuma = { durum: "yukleniyor" } | { durum: "hata" } | { durum: "hazir"; araclar: Arac[] };

export function GarajEkrani({ repository, simdi, yeniId }: GarajBagimliliklari) {
  const [okuma, setOkuma] = useState<Okuma>({ durum: "yukleniyor" });
  const [formAcik, setFormAcik] = useState(false);

  useEffect(() => {
    let gecerli = true;
    repository.listele().then(
      (araclar) => gecerli && setOkuma({ durum: "hazir", araclar }),
      () => gecerli && setOkuma({ durum: "hata" }),
    );
    return () => {
      gecerli = false;
    };
  }, [repository]);

  async function kaydet(yeni: GecerliYeniArac) {
    const arac: Arac = { id: yeniId(), ...yeni, olusturulmaTarihi: simdi() };
    await repository.ekle(arac);
    setOkuma((o) => (o.durum === "hazir" ? { durum: "hazir", araclar: [arac, ...o.araclar] } : o));
    setFormAcik(false);
  }

  if (okuma.durum === "yukleniyor") return <p>{METIN.yukleniyor}</p>;
  if (okuma.durum === "hata") return <p role="alert">{METIN.okumaHatasi}</p>;

  if (formAcik) {
    return (
      <AracFormu
        mevcutPlakalar={okuma.araclar.map((a) => a.plaka)}
        onKaydet={kaydet}
        onVazgec={() => setFormAcik(false)}
      />
    );
  }

  return (
    <section aria-labelledby="garaj-baslik">
      <h1 id="garaj-baslik">{METIN.baslik}</h1>
      {okuma.araclar.length === 0 ? (
        <p>{METIN.bos}</p>
      ) : (
        <ul aria-label="Araçlar">
          {okuma.araclar.map((a) => (
            <li key={a.id}>
              <span>{TUR_ADI[a.tur]}</span> · <span>{a.marka}</span> <span>{a.model}</span> ·{" "}
              <span>{a.plaka}</span>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => setFormAcik(true)}>
        {METIN.aracEkle}
      </button>
    </section>
  );
}
