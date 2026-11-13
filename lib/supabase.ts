import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ebtwgnsgdtpbsmyhwhba.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_vHSPz6F8BdOOh0gFxygNMQ_3SMiIVBq";

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Client admin hanya dibuat kalau Service Role Key benar-benar ada.
 *
 * PENTING: jangan pernah fallback ke anon key. Anon key tidak bisa menulis
 * (RLS menolak) sehingga operasi admin akan "sukses palsu" — data tidak
 * tersimpan tetapi UI bilang berhasil. Lebih baik client = null dan
 * pemanggil menampilkan error yang jelas.
 */
export const isSupabaseAdminConfigured = Boolean(
  supabaseUrl && supabaseServiceKey,
);

/**
 * Client untuk public queries (frontend / read-only)
 */
export const supabasePublic = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Client admin khusus Backend / API Routes (Bypass RLS dengan Service Role Key)
 */
export const supabaseAdmin = isSupabaseAdminConfigured
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

if (!isSupabaseAdminConfigured) {
  console.warn(
    "[supabase] SUPABASE_SERVICE_ROLE_KEY belum diset/kosong — operasi tulis " +
      "(admin, cerita, upload) tidak akan bisa menyimpan ke database.",
  );
}
