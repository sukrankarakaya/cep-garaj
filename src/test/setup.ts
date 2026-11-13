import "@testing-library/jest-dom/vitest";

// docs/testing.md, Determinism: check pins TZ=Europe/Istanbul. Refuse to run on any other zone,
// so a test that passes only by accident of the machine's zone is never green.
const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
if (zone !== "Europe/Istanbul") {
  throw new Error(`Tests must run with TZ=Europe/Istanbul (got ${zone}); use ./scripts/check.`);
}
