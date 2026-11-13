import fs from "node:fs";
import path from "node:path";
import { supabaseAdmin, supabasePublic } from "./supabase";

const dataDir = path.join(process.cwd(), "content", "data");
const vipSettingsFile = path.join(dataDir, "vip-settings.json");
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

export const VIP_SETTINGS_SLUG = "vip-settings";

export interface VipMerchantInfo {
  name: string;        // "FELXSTORE"
  nmid: string;        // "ID1025408420731"
  store_id: string;    // "g373569475"
  city: string;        // "INDRAGIRI HULU"
  postal_code: string; // "29351"
  printed_by: string;  // "93600914"
  raw_qris?: string;   // EMVCo QRIS string
}

export interface VipTransaction {
  id: string;
  story_id: string;
  author_name: string;
  amount: number;
  proof_image_url?: string;
  created_at: string;
}

export interface VipSettings {
  quota: number;              // Sisa kuota admin saat ini (misal 500000)
  initial_quota: number;      // Kuota acuan admin (misal 500000)
  price_per_vip: number;      // Biaya per VIP (5000)
  qris_image_url: string;     // URL gambar QRIS admin aktif
  merchant?: VipMerchantInfo; // Identitas merchant resmi
  total_earned: number;       // Total uang masuk yang sudah tercatat
  total_transactions: number; // Jumlah cerita VIP yang sudah diproses
  transactions: VipTransaction[];
}

export const DEFAULT_MERCHANT: VipMerchantInfo = {
  name: "FELXSTORE",
  nmid: "ID1025408420731",
  store_id: "g373569475",
  city: "INDRAGIRI HULU",
  postal_code: "29351, 29371",
  printed_by: "93600914",
  raw_qris: "00020101021126610014COM.GO-JEK.WWW01189360091433735694750210G3735694750303UMI51440014ID.CO.QRIS.WWW0215ID10254084207310303UMI5204549953033605802ID5909felxstore6014INDRAGIRI HULU61052931162070703A016304A619",
};

export const DEFAULT_SETTINGS: VipSettings = {
  quota: 500000,
  initial_quota: 500000,
  price_per_vip: 5000,
  qris_image_url: "/qris-felxstore.png",
  merchant: DEFAULT_MERCHANT,
  total_earned: 0,
  total_transactions: 0,
  transactions: [],
};

// In-memory cache agar navigasi instan
let memoryVipCache: { data: VipSettings; timestamp: number } | null = null;
const CACHE_TTL_MS = 5000; // 5 detik TTL

function ensureDirectoryExists() {
  if (isVercel) return;
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
  } catch {
    // Ignore in read-only environment
  }
}

function readLocalSettings(): VipSettings {
  try {
    ensureDirectoryExists();
    if (!fs.existsSync(vipSettingsFile)) {
      return { ...DEFAULT_SETTINGS };
    }
    const content = fs.readFileSync(vipSettingsFile, "utf-8");
    const parsed = JSON.parse(content);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
    };
  } catch (err) {
    console.error("[readLocalSettings Error]:", err);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Ambil data kuota & pengaturan VIP secara ASYNC dari Supabase Cloud (dengan memory cache).
 * Menjamin 100% persistensi di Vercel Serverless.
 */
export async function getVipSettingsAsync(): Promise<VipSettings> {
  const now = typeof performance !== "undefined" ? performance.now() : 0;
  if (memoryVipCache && now - memoryVipCache.timestamp < CACHE_TTL_MS) {
    return memoryVipCache.data;
  }

  const client = supabaseAdmin || supabasePublic;

  // 1. Coba baca dari Supabase Cloud (tabel posts, slug = 'vip-settings')
  if (client) {
    try {
      const { data, error } = await client
        .from("posts")
        .select("content")
        .eq("slug", VIP_SETTINGS_SLUG)
        .maybeSingle();

      if (!error && data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          const fullSettings: VipSettings = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            transactions: Array.isArray(parsed.transactions) ? parsed.transactions : [],
          };
          memoryVipCache = { data: fullSettings, timestamp: now };
          return fullSettings;
        } catch (parseErr) {
          console.warn("[getVipSettingsAsync] JSON parse error:", parseErr);
        }
      }
    } catch (err) {
      console.warn("[getVipSettingsAsync] Supabase query failed:", err);
    }
  }

  // 2. Fallback baca file lokal
  const local = readLocalSettings();
  memoryVipCache = { data: local, timestamp: now };
  return local;
}

/**
 * Simpan data kuota & pengaturan VIP secara ASYNC ke Supabase Cloud.
 *
 * Di production, kegagalan tulis TIDAK boleh ditelan diam-diam: kalau
 * tersimpan gagal, cache juga tidak diperbarui supaya dashboard tidak
 * menampilkan angka palsu.
 */
export async function saveVipSettingsAsync(settings: VipSettings): Promise<void> {
  if (isVercel && !supabaseAdmin) {
    throw new Error(
      "Penyimpanan belum siap: SUPABASE_SERVICE_ROLE_KEY wajib diset di Vercel.",
    );
  }

  // 1. Simpan ke Supabase Cloud (utama di Vercel)
  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from("posts").upsert(
        {
          slug: VIP_SETTINGS_SLUG,
          title: "VIP Settings Data",
          excerpt: "Internal storage for VIP quota & settings",
          content: JSON.stringify(settings),
          date: new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" }
      );
      if (error) throw error;
    } catch (err) {
      console.error("[saveVipSettingsAsync] Supabase error:", err);
      if (isVercel) {
        throw new Error(
          "Gagal menyimpan pengaturan VIP ke database. Periksa SUPABASE_SERVICE_ROLE_KEY.",
        );
      }
      // Di lokal, lanjutkan simpan ke file supaya tetap bisa dipakai.
    }
  }

  // Cache baru diperbarui setelah penyimpanan cloud berhasil (atau di lokal).
  const now = typeof performance !== "undefined" ? performance.now() : 0;
  memoryVipCache = { data: settings, timestamp: now };

  // 2. Simpan ke local file jika bukan di Vercel
  if (!isVercel) {
    try {
      ensureDirectoryExists();
      fs.writeFileSync(vipSettingsFile, JSON.stringify(settings, null, 2), "utf-8");
    } catch (err) {
      console.error("[saveVipSettingsAsync] Local write error:", err);
    }
  }
}

/**
 * Wrapper Sinkron untuk backward-compatibility.
 */
export function getVipSettings(): VipSettings {
  if (memoryVipCache) {
    return memoryVipCache.data;
  }
  return readLocalSettings();
}

/**
 * Wrapper Sinkron untuk backward-compatibility.
 */
export function saveVipSettings(settings: VipSettings): void {
  const now = typeof performance !== "undefined" ? performance.now() : 0;
  memoryVipCache = { data: settings, timestamp: now };
  saveVipSettingsAsync(settings).catch((err) => {
    console.error("[saveVipSettings Background Error]:", err);
  });
}

/**
 * Potong kuota admin sebesar price (default 5.000)
 * dan catat riwayat transaksinya secara ASYNC ke Supabase.
 */
export async function deductVipQuotaAsync(
  amount: number,
  storyId: string,
  authorName: string,
  proofImageUrl?: string
): Promise<VipSettings> {
  const current = await getVipSettingsAsync();
  const deductAmount = amount > 0 ? amount : current.price_per_vip;

  const newQuota = Math.max(0, current.quota - deductAmount);
  const newEarned = current.total_earned + deductAmount;
  const newTransactionsCount = current.total_transactions + 1;

  const newTrx: VipTransaction = {
    id: `trx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    story_id: storyId,
    author_name: authorName || "Anonim",
    amount: deductAmount,
    proof_image_url: proofImageUrl,
    created_at: new Date().toISOString(),
  };

  const updated: VipSettings = {
    ...current,
    quota: newQuota,
    total_earned: newEarned,
    total_transactions: newTransactionsCount,
    transactions: [newTrx, ...current.transactions].slice(0, 100), // Simpan 100 histori terakhir
  };

  await saveVipSettingsAsync(updated);
  return updated;
}

export function deductVipQuota(
  amount: number,
  storyId: string,
  authorName: string,
  proofImageUrl?: string
): VipSettings {
  const current = getVipSettings();
  const deductAmount = amount > 0 ? amount : current.price_per_vip;

  const newQuota = Math.max(0, current.quota - deductAmount);
  const newEarned = current.total_earned + deductAmount;
  const newTransactionsCount = current.total_transactions + 1;

  const newTrx: VipTransaction = {
    id: `trx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    story_id: storyId,
    author_name: authorName || "Anonim",
    amount: deductAmount,
    proof_image_url: proofImageUrl,
    created_at: new Date().toISOString(),
  };

  const updated: VipSettings = {
    ...current,
    quota: newQuota,
    total_earned: newEarned,
    total_transactions: newTransactionsCount,
    transactions: [newTrx, ...current.transactions].slice(0, 100),
  };

  saveVipSettings(updated);
  return updated;
}

/**
 * Cek apakah URL bukti pembayaran sudah pernah digunakan
 * dalam transaksi cerita VIP sebelumnya untuk mencegah penggunaan ulang screenshot.
 */
export async function isProofAlreadyUsedAsync(proofUrl: string): Promise<boolean> {
  if (!proofUrl) return false;
  const settings = await getVipSettingsAsync();
  const normalized = proofUrl.trim().toLowerCase();
  return settings.transactions.some((trx) => {
    return (
      Boolean(trx.proof_image_url) &&
      trx.proof_image_url!.trim().toLowerCase() === normalized
    );
  });
}

export function isProofAlreadyUsed(proofUrl: string): boolean {
  if (!proofUrl) return false;
  const settings = getVipSettings();
  const normalized = proofUrl.trim().toLowerCase();
  return settings.transactions.some((trx) => {
    return (
      Boolean(trx.proof_image_url) &&
      trx.proof_image_url!.trim().toLowerCase() === normalized
    );
  });
}
