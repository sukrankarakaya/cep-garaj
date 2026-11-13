// docs/conventions.md, Error handling: expected errors are returned, never thrown.
export type Result<T, H> = { ok: true; value: T } | { ok: false; hata: H };

export function tamam<T>(value: T): { ok: true; value: T } {
  return { ok: true, value };
}

export function basarisiz<H>(hata: H): { ok: false; hata: H } {
  return { ok: false, hata };
}
