// A write can fail because RLS rejected it (e.g. a non-admin writing an
// admin-only row) rather than because of a real server error. Callers use
// this to surface a clear message instead of a raw Postgres/PostgREST error.
export function isRlsRejection(error: { code?: string; message: string }): boolean {
  return error.code === "42501" || /row-level security/i.test(error.message);
}
