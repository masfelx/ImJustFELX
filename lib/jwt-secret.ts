/**
 * ============================================================
 *  JWT SECRET — satu sumber kebenaran (Edge & Node compatible)
 * ============================================================
 *  PRINSIP KEAMANAN:
 *  - Di production, JWT_SECRET WAJIB diisi. Tidak ada fallback.
 *  - Fallback hanya boleh ada di development agar lokal tetap jalan.
 *  - Kalau secret kosong di production → semua akses admin ditolak.
 * ============================================================
 */

const DEV_FALLBACK_SECRET = "lux0ria-dev-only-insecure-secret-do-not-deploy";

let warned = false;

export function getJwtSecret(): string | null {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) return secret;

  if (process.env.NODE_ENV !== "production") {
    if (!warned) {
      warned = true;
      console.warn(
        "[auth] JWT_SECRET belum diset — memakai fallback khusus development. " +
          "Jangan pernah deploy tanpa JWT_SECRET.",
      );
    }
    return DEV_FALLBACK_SECRET;
  }

  console.error(
    "[auth] JWT_SECRET wajib diset di production. Semua akses admin ditolak.",
  );
  return null;
}
