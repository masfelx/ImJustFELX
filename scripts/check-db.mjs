/**
 * ============================================================
 *  CEK KONEKSI DATABASE SUPABASE — LUX0RIA
 * ============================================================
 *  Jalankan: npm run check:db
 *
 *  Script ini TIDAK mengubah data apa pun. Fungsinya:
 *   - memastikan SUPABASE_SERVICE_ROLE_KEY valid
 *   - memastikan tabel yang dibutuhkan sudah ada
 *   - memastikan bucket storage cerita-photos sudah ada
 * ============================================================
 */
import { createClient } from "@supabase/supabase-js";

const ok = (msg) => console.log(`  [OK]    ${msg}`);
const bad = (msg) => console.log(`  [GAGAL] ${msg}`);
const info = (msg) => console.log(`  [INFO]  ${msg}`);

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("\n=== CEK KONFIGURASI ===\n");

  if (!url) {
    bad("NEXT_PUBLIC_SUPABASE_URL kosong.");
    return 1;
  }
  ok(`URL: ${url}`);

  if (!anon) {
    bad("NEXT_PUBLIC_SUPABASE_ANON_KEY kosong.");
  } else {
    ok(`Anon key terisi (${anon.length} karakter).`);
  }

  if (!service) {
    bad("SUPABASE_SERVICE_ROLE_KEY kosong. Operasi tulis TIDAK akan berfungsi.");
    return 1;
  }
  ok(`Service role key terisi (${service.length} karakter).`);

  // Service key valid hanya kalau bisa query dengan hak admin.
  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("\n=== CEK SERVICE ROLE KEY ===\n");

  const keyTest = await admin.from("posts").select("slug").limit(1);
  if (keyTest.error) {
    bad(`Service key ditolak: ${keyTest.error.message}`);
    console.log(
      "\n  Perbaiki: buat Secret Key baru di Supabase Dashboard ->\n" +
        "  Project Settings -> API Keys -> Secret keys -> Create new secret key,\n" +
        "  lalu ganti SUPABASE_SERVICE_ROLE_KEY di .env.local dan Vercel.\n",
    );
    return 1;
  }
  ok("Service key valid (bisa akses database).");

  console.log("\n=== CEK TABEL ===\n");

  const tables = [
    "site_config",
    "donations",
    "links",
    "posts",
    "stories",
    "story_replies",
  ];

  let missing = 0;

  for (const table of tables) {
    const res = await admin.from(table).select("*", { count: "exact", head: true });
    if (res.error) {
      missing += 1;
      bad(`Tabel '${table}' tidak bisa diakses — ${res.error.message}`);
    } else {
      ok(`Tabel '${table}' siap (${res.count ?? 0} baris).`);
    }
  }

  console.log("\n=== CEK STORAGE ===\n");

  const buckets = await admin.storage.listBuckets();
  if (buckets.error) {
    bad(`Gagal membaca daftar bucket — ${buckets.error.message}`);
  } else {
    const bucket = buckets.data?.find((b) => b.id === "cerita-photos");
    if (bucket) {
      ok(`Bucket 'cerita-photos' ada (public: ${Boolean(bucket.public)}).`);
    } else {
      bad("Bucket 'cerita-photos' belum ada. Jalankan supabase-stories.sql.");
    }
  }

  console.log("\n=== RINGKASAN ===\n");

  if (missing > 0) {
    info(
      `${missing} tabel belum siap. Jalankan file supabase-stories.sql ` +
        "(dan supabase-schema.sql kalau tabel dasar juga belum ada) di SQL Editor Supabase.",
    );
    return 1;
  }

  ok("Semua tabel siap. Cerita akan tersimpan permanen di Supabase.");
  console.log("");
  return 0;
}

// process.exitCode (bukan process.exit) agar koneksi HTTP selesai dengan rapi.
process.exitCode = await main();
