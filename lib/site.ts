/**
 * ============================================================
 *  KONFIGURASI SITUS LUX0RIA
 * ============================================================
 *  File ini HANYA berisi tipe & data statis ringan yang aman
 *  diimpor oleh komponen client ("use client").
 *
 *  Data dinamis (dari JSON) dibaca lewat `lib/site-data.ts`
 *  yang hanya diimpor oleh server components.
 * ============================================================
 */

export type LinkItem = {
  /** Nama yang tampil di website */
  name: string;
  /** URL tujuan — WAJIB diawali https:// */
  url: string;
  /** Deskripsi singkat (opsional) */
  description?: string;
  /** Ikon: coffee, spark, gift, heart, instagram, youtube, x, tiktok, globe, link */
  icon?: string;
  /** Username/handle yang tampil (opsional, contoh: @lux0ria) */
  handle?: string;
  /** Tanggal kedaluwarsa YYYY-MM-DD (jika durasi sewa berakhir) */
  expires_at?: string;
  /** Label paket durasi: 1_month, 6_months, 1_year, permanent, custom */
  duration_plan?: string;
};

export type SiteData = {
  name: string;
  tagline: string;
  description: string;
  url: string;
  author: string;
  donation: LinkItem[];
  socials: LinkItem[];
  otherLinks: LinkItem[];
};

/**
 * Memastikan URL memiliki protokol (https://) agar aman diklik dan tidak error.
 */
export function safeUrl(url?: string): string {
  if (!url) return "#";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

/**
 * Mengambil nama domain/hostname dengan aman tanpa menyebabkan TypeError: Invalid URL.
 */
export function safeHostname(url?: string): string {
  if (!url) return "";
  try {
    const valid = safeUrl(url);
    if (valid === "#") return "";
    return new URL(valid).hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || url;
  }
}
