/**
 * ============================================================
 *  SUPABASE CLIENT — Khusus komponen client-side ("use client")
 * ============================================================
 *  Menggunakan NEXT_PUBLIC_ env vars agar aman di browser.
 *  Untuk server-side (API routes), gunakan lib/supabase.ts.
 * ============================================================
 */
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) return null;

  client = createClient(url, key, {
    realtime: {
      params: { eventsPerSecond: 10 },
    },
  });

  return client;
}
