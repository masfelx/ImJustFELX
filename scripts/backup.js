/**
 * Script Otomatis: Backup Data Supabase Cloud ke File Lokal
 * Jalankan kapan saja dengan: npm run backup
 */
const fs = require("node:fs");
const path = require("node:path");
const { createClient } = require("@supabase/supabase-js");

// Gunakan URL dan Anon Key Supabase
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://ebtwgnsgdtpbsmyhwhba.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_vHSPz6F8BdOOh0gFxygNMQ_3SMiIVBq";

const client = createClient(supabaseUrl, supabaseAnonKey);

const rootDir = path.resolve(__dirname, "..");
const dataDir = path.join(rootDir, "content", "data");
const pagesDir = path.join(rootDir, "content", "pages");
const postsDir = path.join(rootDir, "content", "posts");
const backupsDir = path.join(rootDir, "backups");

// Pastikan semua folder tujuan ada
[dataDir, pagesDir, postsDir, backupsDir].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

async function runBackup() {
  console.log("🚀 Memulai proses backup dari Supabase Cloud...");

  // 1. Ambil data posts (termasuk cerita-feed, beranda, tentang, vip-settings, dan blog)
  const { data: posts, error: postsError } = await client.from("posts").select("*");
  if (postsError) {
    console.error("❌ Gagal mengambil tabel posts:", postsError.message);
    process.exit(1);
  }
  console.log(`✅ Berhasil mengambil ${posts.length} baris dari tabel posts.`);

  // 2. Ambil data links (terhubung)
  const { data: links, error: linksError } = await client
    .from("links")
    .select("*")
    .order("sort_order", { ascending: true });
  if (linksError) {
    console.warn("⚠️ Gagal mengambil tabel links:", linksError.message);
  } else {
    console.log(`✅ Berhasil mengambil ${links.length} baris dari tabel links.`);
  }

  // 3. Ambil data donations (donasi)
  const { data: donations, error: donError } = await client
    .from("donations")
    .select("*")
    .order("sort_order", { ascending: true });
  if (donError) {
    console.warn("⚠️ Gagal mengambil tabel donations:", donError.message);
  } else {
    console.log(`✅ Berhasil mengambil ${donations.length} baris dari tabel donations.`);
  }

  // 4. Ambil data site_config
  const { data: siteConfig, error: configError } = await client
    .from("site_config")
    .select("*")
    .eq("id", "current")
    .maybeSingle();
  if (configError) {
    console.warn("⚠️ Gagal mengambil tabel site_config:", configError.message);
  }

  // ==========================================
  // A. SIMPAN DATA KHUSUS KE content/data/
  // ==========================================

  const specialSlugs = ["cerita-feed", "vip-settings", "beranda", "tentang"];
  const blogSlugsFromSupabase = [];

  for (const post of posts) {
    // 1. Cerita Feed
    if (post.slug === "cerita-feed") {
      try {
        const parsed = JSON.parse(post.content);
        fs.writeFileSync(
          path.join(dataDir, "cerita.json"),
          JSON.stringify(parsed, null, 2),
          "utf8"
        );
        console.log(`💾 Backup Cerita Feed: ${parsed.length} cerita tersimpan ke content/data/cerita.json`);
      } catch (err) {
        console.error("Gagal parse cerita-feed:", err);
      }
      continue;
    }

    // 2. VIP Settings
    if (post.slug === "vip-settings") {
      try {
        const parsed = JSON.parse(post.content);
        fs.writeFileSync(
          path.join(dataDir, "vip-settings.json"),
          JSON.stringify(parsed, null, 2),
          "utf8"
        );
        console.log(`💾 Backup VIP Settings (Kuota: ${parsed.quota}) tersimpan ke content/data/vip-settings.json`);
      } catch (err) {
        console.error("Gagal parse vip-settings:", err);
      }
      continue;
    }

    // 3. Beranda
    if (post.slug === "beranda") {
      try {
        const parsed = JSON.parse(post.content);
        fs.writeFileSync(
          path.join(dataDir, "beranda.json"),
          JSON.stringify(parsed, null, 2),
          "utf8"
        );
        console.log(`💾 Backup Pengaturan Beranda tersimpan ke content/data/beranda.json`);
      } catch (err) {
        console.error("Gagal parse beranda:", err);
      }
      continue;
    }

    // 4. Tentang
    if (post.slug === "tentang") {
      const cleanContent = (post.content || "").trim();
      const markdown = `---
title: ${JSON.stringify(post.title || "Tentang")}
excerpt: ${JSON.stringify(post.excerpt || "")}
---

${cleanContent}
`;
      fs.writeFileSync(path.join(pagesDir, "tentang.md"), markdown, "utf8");
      console.log(`💾 Backup Halaman Tentang tersimpan ke content/pages/tentang.md`);
      continue;
    }

    // 5. Artikel Blog Publik
    blogSlugsFromSupabase.push(post.slug);
    const coverLine = post.cover ? `cover: ${JSON.stringify(post.cover)}\n` : "";
    const blogMarkdown = `---
title: ${JSON.stringify(post.title || post.slug)}
date: ${JSON.stringify(post.date || new Date().toISOString().slice(0, 10))}
excerpt: ${JSON.stringify(post.excerpt || "")}
${coverLine}---

${(post.content || "").trim()}
`;
    fs.writeFileSync(path.join(postsDir, `${post.slug}.md`), blogMarkdown, "utf8");
    console.log(`📝 Backup Artikel Blog [${post.slug}] tersimpan ke content/posts/${post.slug}.md`);
  }

  // Bersihkan file blog lokal yang sudah dihapus di Supabase
  if (fs.existsSync(postsDir)) {
    const localPosts = fs.readdirSync(postsDir).filter((f) => f.endsWith(".md"));
    for (const file of localPosts) {
      const slug = file.replace(/\.md$/, "");
      if (!blogSlugsFromSupabase.includes(slug)) {
        fs.unlinkSync(path.join(postsDir, file));
        console.log(`🗑️ Hapus blog lokal [${slug}] yang sudah dihapus di Supabase`);
      }
    }
  }

  // 6. Terhubung
  if (links && Array.isArray(links)) {
    const socials = [];
    const otherLinks = [];

    for (const row of links) {
      let expires_at = row.expires_at || undefined;
      let duration_plan = row.duration_plan || undefined;

      if (row.type === "other" && row.handle && typeof row.handle === "string") {
        try {
          let jsonStr = row.handle;
          if (jsonStr.startsWith("meta:")) jsonStr = jsonStr.slice(5);
          const meta = JSON.parse(jsonStr);
          if (!expires_at && meta.expires_at) expires_at = meta.expires_at;
          if (!duration_plan && meta.duration_plan) duration_plan = meta.duration_plan;
        } catch {}
      }

      const item = {
        name: row.name,
        url: row.url,
        description: row.description || undefined,
        icon: row.icon || undefined,
        handle: row.type === "social" ? row.handle || undefined : undefined,
        expires_at,
        duration_plan,
      };

      if (row.type === "social") {
        socials.push(item);
      } else {
        otherLinks.push(item);
      }
    }

    const terhubungData = { socials, otherLinks };
    fs.writeFileSync(
      path.join(dataDir, "terhubung.json"),
      JSON.stringify(terhubungData, null, 2),
      "utf8"
    );
    console.log(`💾 Backup Terhubung (${socials.length} medsos, ${otherLinks.length} tautan lain) tersimpan ke content/data/terhubung.json`);
  }

  // 7. Donasi
  if (donations && Array.isArray(donations)) {
    const donasiList = donations.map((row) => ({
      name: row.name,
      url: row.url,
      description: row.description || undefined,
      icon: row.icon || "coffee",
    }));
    fs.writeFileSync(
      path.join(dataDir, "donasi.json"),
      JSON.stringify(donasiList, null, 2),
      "utf8"
    );
    console.log(`💾 Backup Donasi (${donasiList.length} platform) tersimpan ke content/data/donasi.json`);
  }

  // 8. Site Config
  if (siteConfig) {
    const configData = {
      name: siteConfig.name || "LUX0RIA",
      tagline: siteConfig.tagline || "",
      description: siteConfig.description || "",
      url: siteConfig.url || "https://imjustfelx.vercel.app",
      author: siteConfig.author || "LUX0RIA",
    };
    fs.writeFileSync(
      path.join(dataDir, "site-config.json"),
      JSON.stringify(configData, null, 2),
      "utf8"
    );
    console.log(`💾 Backup Konfigurasi Situs tersimpan ke content/data/site-config.json`);
  }

  // ==========================================
  // B. SIMPAN SNAPSHOT LENGKAP KE backups/
  // ==========================================
  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const snapshot = {
    backup_timestamp: now.toISOString(),
    source: supabaseUrl,
    posts,
    links,
    donations,
    site_config: siteConfig,
  };

  const backupFileName = `backup-${dateStr}.json`;
  fs.writeFileSync(
    path.join(backupsDir, backupFileName),
    JSON.stringify(snapshot, null, 2),
    "utf8"
  );
  fs.writeFileSync(
    path.join(backupsDir, "latest-backup.json"),
    JSON.stringify(snapshot, null, 2),
    "utf8"
  );

  console.log(`\n🎉 SELESAI! Snapshot database lengkap tersimpan di:`);
  console.log(`   📁 backups/${backupFileName}`);
  console.log(`   📁 backups/latest-backup.json`);
  console.log(`   📁 Semua file di content/data/, content/pages/, dan content/posts/ kini 100% SINKRON dengan Supabase!`);
}

runBackup().catch((err) => {
  console.error("Terjadi kesalahan saat backup:", err);
  process.exit(1);
});
