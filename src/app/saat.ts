// The only place that reads the device clock (docs/architecture.md, Communication rules).

/** Current instant as UTC ISO-8601 (docs/conventions.md, Data rules: timestamps). */
export function simdi(): string {
  return new Date().toISOString();
}

/** docs/conventions.md, Data rules: IDs. */
export function yeniId(): string {
  return crypto.randomUUID();
}
