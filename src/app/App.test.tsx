import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { Arac } from "../domain/arac";
import type { AracRepository } from "../storage";
import { App } from "./App";

function sahteRepository(): AracRepository {
  const araclar: Arac[] = [];
  return {
    listele: async () => [...araclar],
    ekle: async (arac) => {
      araclar.unshift(arac);
    },
  };
}

function storageAyarla(storage: unknown) {
  Object.defineProperty(navigator, "storage", { value: storage, configurable: true });
}

afterEach(() => {
  Reflect.deleteProperty(navigator, "storage");
});

async function aracEklenebilir() {
  const kullanici = userEvent.setup();
  await screen.findByText("Garajında henüz araç yok");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  await kullanici.click(screen.getByRole("button", { name: "Araç ekle" }));
  await kullanici.selectOptions(screen.getByLabelText("Tür"), "otomobil");
  await kullanici.type(screen.getByLabelText("Marka"), "Fiat");
  await kullanici.type(screen.getByLabelText("Model"), "Egea");
  await kullanici.type(screen.getByLabelText("Plaka"), "16 abc 16");
  await kullanici.click(screen.getByRole("button", { name: "Kaydet" }));
  expect(await screen.findByText("16ABC16")).toBeInTheDocument();
}

describe("uygulama açılışı", () => {
  it("açılışta persist istenir", async () => {
    const persist = vi.fn(async () => true);
    storageAyarla({ persist });
    render(<App repository={sahteRepository()} />);
    await aracEklenebilir();
    expect(persist).toHaveBeenCalled();
  });

  it.each([
    ["reddedilirse", { persist: vi.fn(async () => false) }],
    ["hata verirse", { persist: vi.fn(async () => Promise.reject(new Error("SecurityError"))) }],
    ["persist yoksa", {}],
    ["storage API yoksa", undefined],
  ])("persist yoksa veya reddedilirse akış çalışır: %s", async (_durum, storage) => {
    storageAyarla(storage);
    render(<App repository={sahteRepository()} />);
    await aracEklenebilir();
    expect(screen.queryByText(/SecurityError|depolama izni/i)).not.toBeInTheDocument();
  });
});
