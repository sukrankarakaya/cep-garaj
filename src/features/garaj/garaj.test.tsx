import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Arac } from "../../domain/arac";
import type { AracRepository } from "../../storage";
import { GarajEkrani } from "./index";

// Test double for the storage public interface; stores in memory, newest first.
function sahteRepository(baslangic: Arac[] = []) {
  const araclar = [...baslangic];
  const repo = {
    listele: vi.fn<AracRepository["listele"]>(async () => [...araclar]),
    ekle: vi.fn<AracRepository["ekle"]>(async (arac) => {
      araclar.unshift(arac);
    }),
  };
  return { repo, araclar };
}

function bekleyen<T>() {
  let coz!: (deger: T) => void;
  let reddet!: (hata: unknown) => void;
  const promise = new Promise<T>((c, r) => {
    coz = c;
    reddet = r;
  });
  return { promise, coz, reddet };
}

// Fixed, increasing clock and ids (docs/testing.md, Determinism).
function ciz(repo: AracRepository) {
  let n = 0;
  const simdi = () => `2026-11-13T10:00:${String(n++).padStart(2, "0")}.000Z`;
  let id = 0;
  const yeniId = () => `id-${++id}`;
  return render(<GarajEkrani repository={repo} simdi={simdi} yeniId={yeniId} />);
}

const ornek: Arac = {
  id: "eski",
  tur: "motosiklet",
  marka: "Honda",
  model: "CB650R",
  plaka: "34ABC123",
  olusturulmaTarihi: "2026-11-01T09:00:00.000Z",
};

async function formuDoldur(
  kullanici: ReturnType<typeof userEvent.setup>,
  { tur = "otomobil", marka = "Renault", model = "Clio", plaka = "06 ab 1234" } = {},
) {
  await kullanici.click(screen.getByRole("button", { name: "Araç ekle" }));
  if (tur) await kullanici.selectOptions(screen.getByLabelText("Tür"), tur);
  if (marka) await kullanici.type(screen.getByLabelText("Marka"), marka);
  if (model) await kullanici.type(screen.getByLabelText("Model"), model);
  if (plaka) await kullanici.type(screen.getByLabelText("Plaka"), plaka);
}

function satirlar() {
  return within(screen.getByRole("list", { name: "Araçlar" }))
    .getAllByRole("listitem")
    .map((li) => li.textContent);
}

describe("garaj ekranı", () => {
  it("boş garajda mesaj ve Araç ekle butonu", async () => {
    ciz(sahteRepository().repo);
    expect(await screen.findByText("Garajında henüz araç yok")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Araç ekle" })).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("okuma sürerken Yükleniyor gösterir", async () => {
    const okuma = bekleyen<Arac[]>();
    const { repo } = sahteRepository();
    repo.listele.mockReturnValueOnce(okuma.promise);
    ciz(repo);
    expect(screen.getByText("Yükleniyor…")).toBeInTheDocument();
    okuma.coz([ornek]);
    expect(await screen.findByText("Honda")).toBeInTheDocument();
    expect(screen.queryByText("Yükleniyor…")).not.toBeInTheDocument();
  });

  it("geçerli araç eklenince listede görünür", async () => {
    const kullanici = userEvent.setup();
    const { repo } = sahteRepository();
    ciz(repo);
    await screen.findByText("Garajında henüz araç yok");
    await formuDoldur(kullanici);
    await kullanici.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(await screen.findByRole("list", { name: "Araçlar" })).toBeInTheDocument();
    expect(satirlar()).toEqual(["Otomobil · Renault Clio · 06AB1234"]);
    expect(repo.ekle).toHaveBeenCalledWith({
      id: "id-1",
      tur: "otomobil",
      marka: "Renault",
      model: "Clio",
      plaka: "06AB1234",
      olusturulmaTarihi: "2026-11-13T10:00:00.000Z",
    });
  });

  it("kayıt sürerken Kaydet devre dışı", async () => {
    const kullanici = userEvent.setup();
    const kayit = bekleyen<void>();
    const { repo } = sahteRepository();
    repo.ekle.mockReturnValue(kayit.promise);
    ciz(repo);
    await screen.findByText("Garajında henüz araç yok");
    await formuDoldur(kullanici);
    await kullanici.dblClick(screen.getByRole("button", { name: "Kaydet" }));

    expect(screen.getByRole("button", { name: "Kaydediliyor…" })).toBeDisabled();
    kayit.coz();
    await screen.findByRole("list", { name: "Araçlar" });
    expect(repo.ekle).toHaveBeenCalledTimes(1);
    expect(satirlar()).toHaveLength(1);
  });

  it("liste sırası korunur: son eklenen en üstte", async () => {
    const kullanici = userEvent.setup();
    ciz(sahteRepository([ornek]).repo);
    await screen.findByText("Honda");
    await formuDoldur(kullanici, { plaka: "06AB1" });
    await kullanici.click(screen.getByRole("button", { name: "Kaydet" }));
    await formuDoldur(kullanici, { tur: "scooter", marka: "Vespa", model: "GTS", plaka: "35x9" });
    await kullanici.click(screen.getByRole("button", { name: "Kaydet" }));

    await waitFor(() => expect(satirlar()).toHaveLength(3));
    expect(satirlar()).toEqual([
      "Scooter · Vespa GTS · 35X9",
      "Otomobil · Renault Clio · 06AB1",
      "Motosiklet · Honda CB650R · 34ABC123",
    ]);
  });

  it("alan hatası diğer değerleri korur", async () => {
    const kullanici = userEvent.setup();
    const { repo } = sahteRepository();
    ciz(repo);
    await screen.findByText("Garajında henüz araç yok");
    await formuDoldur(kullanici, { tur: "", marka: "   ", plaka: "34-ABC-123" });
    await kullanici.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(screen.getByLabelText("Tür")).toHaveAccessibleDescription("Araç türünü seçin");
    expect(screen.getByLabelText("Marka")).toHaveAccessibleDescription("Bu alan zorunlu");
    expect(screen.getByLabelText("Plaka")).toHaveAccessibleDescription(
      "Plaka yalnızca harf ve rakam içerebilir",
    );
    expect(screen.getByLabelText("Plaka")).toBeInvalid();
    expect(screen.getByLabelText("Model")).toHaveValue("Clio");
    expect(screen.getByLabelText("Model")).not.toHaveAccessibleDescription();
    expect(screen.getByLabelText("Plaka")).toHaveValue("34-ABC-123");
    expect(repo.ekle).not.toHaveBeenCalled();
  });

  it("50 karakteri aşan model reddedilir", async () => {
    const kullanici = userEvent.setup();
    const { repo } = sahteRepository();
    ciz(repo);
    await screen.findByText("Garajında henüz araç yok");
    await formuDoldur(kullanici, { model: "m".repeat(51) });
    await kullanici.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(screen.getByLabelText("Model")).toHaveAccessibleDescription("En fazla 50 karakter");
    expect(screen.getByLabelText("Marka")).toHaveValue("Renault");
    expect(repo.ekle).not.toHaveBeenCalled();
  });

  it("tekrarlanan plaka mesajı", async () => {
    const kullanici = userEvent.setup();
    const { repo } = sahteRepository([ornek]);
    ciz(repo);
    await screen.findByText("Honda");
    await formuDoldur(kullanici, { plaka: "34 abc 123" });
    await kullanici.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(screen.getByLabelText("Plaka")).toHaveAccessibleDescription(
      "Bu plaka garajda zaten var",
    );
    expect(repo.ekle).not.toHaveBeenCalled();
  });

  it("kayıt hatası mesajı ve değerler korunur", async () => {
    const kullanici = userEvent.setup();
    const { repo } = sahteRepository();
    repo.ekle.mockRejectedValueOnce(new Error("QuotaExceededError: ham-hata-metni"));
    ciz(repo);
    await screen.findByText("Garajında henüz araç yok");
    await formuDoldur(kullanici);
    await kullanici.click(screen.getByRole("button", { name: "Kaydet" }));

    expect(
      await screen.findByText("Araç kaydedilemedi. Tarayıcı depolamasına erişilemiyor."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/ham-hata-metni|QuotaExceeded/)).not.toBeInTheDocument();
    expect(screen.getByLabelText("Tür")).toHaveValue("otomobil");
    expect(screen.getByLabelText("Marka")).toHaveValue("Renault");
    expect(screen.getByLabelText("Model")).toHaveValue("Clio");
    expect(screen.getByLabelText("Plaka")).toHaveValue("06 ab 1234");
    expect(screen.getByRole("button", { name: "Kaydet" })).toBeEnabled();
  });

  it("okuma hatası mesajı", async () => {
    const { repo } = sahteRepository();
    repo.listele.mockRejectedValueOnce(new Error("InvalidStateError: ham-hata-metni"));
    ciz(repo);
    expect(
      await screen.findByText("Araçlar yüklenemedi. Tarayıcı depolamasına erişilemiyor."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/ham-hata-metni/)).not.toBeInTheDocument();
  });

  it("Vazgeç kayıt yapmadan garaja döner", async () => {
    const kullanici = userEvent.setup();
    const { repo } = sahteRepository();
    ciz(repo);
    await screen.findByText("Garajında henüz araç yok");
    await formuDoldur(kullanici);
    await kullanici.click(screen.getByRole("button", { name: "Vazgeç" }));

    expect(screen.getByText("Garajında henüz araç yok")).toBeInTheDocument();
    expect(repo.ekle).not.toHaveBeenCalled();
  });

  it("akış yalnızca klavyeyle tamamlanır", async () => {
    const kullanici = userEvent.setup();
    ciz(sahteRepository().repo);
    await screen.findByText("Garajında henüz araç yok");
    await kullanici.tab();
    expect(screen.getByRole("button", { name: "Araç ekle" })).toHaveFocus();
    await kullanici.keyboard("{Enter}");
    await kullanici.tab();
    expect(screen.getByLabelText("Tür")).toHaveFocus();
    await kullanici.selectOptions(screen.getByLabelText("Tür"), "motosiklet");
    await kullanici.tab();
    await kullanici.keyboard("Yamaha");
    await kullanici.tab();
    await kullanici.keyboard("MT-07");
    await kullanici.tab();
    await kullanici.keyboard("35ab77{Enter}");

    expect(await screen.findByRole("list", { name: "Araçlar" })).toBeInTheDocument();
    expect(satirlar()).toEqual(["Motosiklet · Yamaha MT-07 · 35AB77"]);
  });

  it("akış boyunca ağ API'si çağrılmaz", async () => {
    const ag = {
      fetch: vi.fn(),
      XMLHttpRequest: vi.fn(),
      WebSocket: vi.fn(),
      EventSource: vi.fn(),
    };
    for (const [ad, sahte] of Object.entries(ag)) vi.stubGlobal(ad, sahte);
    const sendBeacon = vi.fn();
    Object.defineProperty(navigator, "sendBeacon", { value: sendBeacon, configurable: true });
    try {
      const kullanici = userEvent.setup();
      ciz(sahteRepository([ornek]).repo);
      await screen.findByText("Honda");
      await formuDoldur(kullanici);
      await kullanici.click(screen.getByRole("button", { name: "Kaydet" }));
      await waitFor(() => expect(satirlar()).toHaveLength(2));

      for (const sahte of [...Object.values(ag), sendBeacon]) expect(sahte).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
      Reflect.deleteProperty(navigator, "sendBeacon");
    }
  });
});
