/**
 * ============================================================
 *  SERVER-ONLY: Baca data situs dari JSON files
 * ============================================================
 *  Import ini HANYA dari Server Components / API routes.
 *  Jangan import dari file "use client".
 * ============================================================
 */
import fs from "node:fs";
import path from "node:path";
import type { LinkItem, SiteData } from "./site";

const dataDir = path.join(process.cwd(), "content", "data");

/* ── Helpers untuk baca JSON ────────────────────────────── */
function readJSONSafe<T>(filename: string, fallback: T): T {
  try {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch {
    return fallback;
  }
}

/* ── Fallback data ──────────────────────────────────────── */
const FALLBACK_CONFIG = {
  name: "LUX0RIA",
  tagline: "Blog pribadi untuk cerita, catatan, dan segala hal yang ingin kubagikan.",
  description: "Blog pribadi LUX0RIA — cerita, catatan, dan karya.",
  url: "https://lux0ria.example.com",
  author: "LUX0RIA",
};

const FALLBACK_DONATION: LinkItem[] = [
  { name: "Saweria", url: "https://saweria.co/username-kamu", description: "Traktir kopi.", icon: "coffee" },
];

const FALLBACK_SOCIALS: LinkItem[] = [
  { name: "Instagram", url: "https://instagram.com/username-kamu", handle: "@username-kamu", icon: "instagram" },
];

const FALLBACK_OTHER: LinkItem[] = [];

/* ── Exported function — panggil di setiap server component ── */
export function getSiteData(): SiteData {
  const config = readJSONSafe("site-config.json", FALLBACK_CONFIG);
  const donation = readJSONSafe<LinkItem[]>("donasi.json", FALLBACK_DONATION);
  const terhubung = readJSONSafe<{ socials: LinkItem[]; otherLinks: LinkItem[] }>(
    "terhubung.json",
    {
      socials: FALLBACK_SOCIALS,
      otherLinks: FALLBACK_OTHER,
    }
  );

  return {
    ...config,
    donation,
    socials: terhubung.socials,
    otherLinks: terhubung.otherLinks,
  };
}
