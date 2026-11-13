// @vitest-environment node
// Proves the forbidden-dependency rules (docs/architecture.md 1-4, docs/security.md) actually
// fire: a misconfigured rule would otherwise pass check silently.
import { ESLint } from "eslint";
import { fileURLToPath } from "node:url";

const eslint = new ESLint({ cwd: fileURLToPath(new URL("..", import.meta.url)) });

async function kurallar(code: string, filePath: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? []).map((m) => m.ruleId ?? m.message);
}

// ESLint loads its config and plugins on the first call (seconds under a parallel run): pay that
// once here, so no single assertion carries the cold start.
beforeAll(async () => {
  await eslint.lintText("export {};", { filePath: "src/domain/isinma.ts" });
}, 30_000);

describe("yasak bağımlılık kuralları", () => {
  it.each([
    "import { x } from 'react';",
    "import { x } from 'dexie';",
    "import { x } from '../storage';",
    "import { x } from '../storage/db';",
    "import { x } from '../features/garaj';",
    "import { x } from '../ui/Buton';",
    "import { x } from '../app/saat';",
  ])("1: domain/ içinde reddedilir: %s", async (code) => {
    expect(await kurallar(`${code}\nexport const y = x;`, "src/domain/ornek.ts")).toContain(
      "no-restricted-imports",
    );
  });

  it("1: domain/ kendi modüllerini import edebilir", async () => {
    const code = "import { x } from './result';\nexport const y = x;";
    expect(await kurallar(code, "src/domain/ornek.ts")).not.toContain("no-restricted-imports");
  });

  it.each(["import { x } from 'dexie';", "import { x } from '../../storage/db';"])(
    "2: features içinde reddedilir: %s",
    async (code) => {
      const dosya = "src/features/garaj/ornek.ts";
      expect(await kurallar(`${code}\nexport const y = x;`, dosya)).toContain(
        "no-restricted-imports",
      );
    },
  );

  it("2: features storage public arayüzünü kullanabilir", async () => {
    const code = "import { x } from '../../storage';\nexport const y = x;";
    expect(await kurallar(code, "src/features/garaj/ornek.ts")).not.toContain(
      "no-restricted-imports",
    );
  });

  it("3: başka feature'ın iç dosyası reddedilir, index'i ve kendi dosyaları serbest", async () => {
    const dosya = "src/features/garaj/ornek.ts";
    const kullan = (yol: string) =>
      kurallar(`import { x } from '${yol}';\nexport const y = x;`, dosya);
    expect(await kullan("../hatirlatici/liste")).toContain("no-restricted-imports");
    expect(await kullan("../../features/hatirlatici/liste")).toContain("no-restricted-imports");
    expect(await kullan("../hatirlatici")).not.toContain("no-restricted-imports");
    expect(await kullan("./AracFormu")).not.toContain("no-restricted-imports");
  });

  it.each([
    ["fetch('/x');", "no-restricted-globals"],
    ["new XMLHttpRequest();", "no-restricted-globals"],
    ["new WebSocket('ws://x');", "no-restricted-globals"],
    ["new EventSource('/x');", "no-restricted-globals"],
    ["navigator.sendBeacon('/x');", "no-restricted-properties"],
    ["window.fetch('/x');", "no-restricted-properties"],
    ["globalThis.fetch('/x');", "no-restricted-properties"],
    // review round 1, L-2: chains that no-restricted-properties (object.property) misses
    ["window.navigator.sendBeacon('/x');", "no-restricted-syntax"],
    ["globalThis.navigator.sendBeacon('/x');", "no-restricted-syntax"],
    ["window.self.fetch('/x');", "no-restricted-syntax"],
    ["new window.parent.WebSocket('ws://x');", "no-restricted-syntax"],
  ])("4: ağ API'leri reddedilir: %s", async (code, kural) => {
    for (const dosya of [
      "src/domain/a.ts",
      "src/features/garaj/a.ts",
      "src/storage/a.ts",
      "src/app/a.ts",
    ]) {
      expect(await kurallar(code, dosya)).toContain(kural);
    }
  });

  it("dangerouslySetInnerHTML reddedilir", async () => {
    const code = "export const A = () => <div dangerouslySetInnerHTML={{ __html: 'x' }} />;";
    expect(await kurallar(code, "src/features/garaj/A.tsx")).toContain("no-restricted-syntax");
  });

  it("saat yalnızca src/app/ içinde okunur", async () => {
    for (const code of [
      "export const t = new Date();",
      "export const t = Date.now();",
      // review round 1, L-2: Date() without new also returns the current time
      "export const t = Date();",
      "export const t = new globalThis.Date();",
      "export const t = window.Date.now();",
    ]) {
      expect(await kurallar(code, "src/domain/a.ts")).not.toHaveLength(0);
      expect(await kurallar(code, "src/features/garaj/a.ts")).not.toHaveLength(0);
      expect(await kurallar(code, "src/app/saat.ts")).toHaveLength(0);
    }
  });
});
