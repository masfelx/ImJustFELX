/**
 * ============================================================
 *  MIGRASI CERITA LOKAL -> SUPABASE — LUX0RIA
 * ============================================================
 *  Jalankan: npm run migrate:cerita
 *
 *  Memindahkan isi `content/data/cerita.json` (cerita yang sempat
 *  dibuat saat database belum siap) ke tabel `stories` + `story_replies`.
 *
 *  - Aman dijalankan berkali-kali (tidak menduplikasi cerita).
 *  - Butuh SUPABASE_SERVICE_ROLE_KEY yang VALID.
 *  - Tabel harus sudah dibuat lewat `supabase-stories.sql`.
 * ============================================================
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const keyOf = (content, createdAt) =>
  `${String(content ?? "").trim()}::${String(createdAt ?? "").slice(0, 19)}`;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !service) {
    console.error(
      "\n[GAGAL] NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env.local.\n",
    );
    return 1;
  }

  const ceritaPath = path.join(process.cwd(), "content", "data", "cerita.json");

  if (!fs.existsSync(ceritaPath)) {
    console.log("\n[INFO] content/data/cerita.json tidak ada — tidak ada yang dimigrasi.\n");
    return 0;
  }

  let local = [];
  try {
    local = JSON.parse(fs.readFileSync(ceritaPath, "utf-8"));
  } catch (err) {
    console.error("\n[GAGAL] cerita.json tidak bisa dibaca:", err.message, "\n");
    return 1;
  }

  if (!Array.isArray(local) || local.length === 0) {
    console.log("\n[INFO] Tidak ada cerita lokal untuk dimigrasi.\n");
    return 0;
  }

  const admin = createClient(url, service, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Pastikan tabel stories ada.
  const tableCheck = await admin.from("stories").select("id").limit(1);
  if (tableCheck.error) {
    console.error(
      "\n[GAGAL] Tabel 'stories' belum siap: " + tableCheck.error.message + "\n" +
        "Jalankan supabase-stories.sql di Supabase SQL Editor terlebih dahulu.\n",
    );
    return 1;
  }

  // Ambil cerita yang sudah ada untuk mencegah duplikasi.
  const existing = await admin
    .from("stories")
    .select("id, content, created_at")
    .limit(2000);

  if (existing.error) {
    console.error("\n[GAGAL] Gagal membaca data cerita:", existing.error.message, "\n");
    return 1;
  }

  const existingKeys = new Map(
    (existing.data ?? []).map((row) => [keyOf(row.content, row.created_at), row.id]),
  );

  let inserted = 0;
  let skipped = 0;
  let repliesInserted = 0;

  for (const story of local) {
    const content = String(story.content ?? "").trim();
    if (!content) continue;

    const createdAt = story.created_at || new Date().toISOString();
    const key = keyOf(content, createdAt);

    let storyId = existingKeys.get(key);

    if (storyId) {
      skipped += 1;
    } else {
      const payload = {
        author_name: story.author_name || "Anonim",
        author_handle: story.author_handle || "@anon",
        content,
        avatar_color: story.avatar_color || "bg-blue-600",
        likes: Number(story.likes) || 0,
        is_vip: Boolean(story.is_vip),
        vip_theme: story.vip_theme || null,
        pinned_until: story.pinned_until || null,
        image_url: story.image_url || null,
        proof_image_url: story.proof_image_url || null,
        is_edited: Boolean(story.is_edited),
        edited_at: story.edited_at || null,
        created_at: createdAt,
      };

      const res = await admin.from("stories").insert(payload).select("id").single();

      if (res.error) {
        console.error(`  [GAGAL] "${content.slice(0, 40)}..." — ${res.error.message}`);
        continue;
      }

      storyId = res.data.id;
      existingKeys.set(key, storyId);
      inserted += 1;
      console.log(`  [MASUK] "${content.slice(0, 50)}"`);
    }

    // Migrasi balasan (kalau ada) yang belum masuk.
    const replies = Array.isArray(story.replies) ? story.replies : [];
    if (replies.length > 0) {
      const currentReplies = await admin
        .from("story_replies")
        .select("content, created_at")
        .eq("story_id", storyId);

      const replyKeys = new Set(
        (currentReplies.data ?? []).map((r) => keyOf(r.content, r.created_at)),
      );

      for (const reply of replies) {
        const replyContent = String(reply.content ?? "").trim();
        if (!replyContent) continue;

        const replyKey = keyOf(replyContent, reply.created_at);
        if (replyKeys.has(replyKey)) continue;

        const res = await admin.from("story_replies").insert({
          story_id: storyId,
          author_name: reply.author_name || "Anonim",
          author_handle: reply.author_handle || "@anon",
          content: replyContent,
          avatar_color: reply.avatar_color || "bg-blue-600",
          created_at: reply.created_at || new Date().toISOString(),
        });

        if (res.error) {
          console.error(`  [GAGAL balasan] ${res.error.message}`);
        } else {
          replyKeys.add(replyKey);
          repliesInserted += 1;
        }
      }
    }
  }

  console.log("\n=== SELESAI ===\n");
  console.log(`Cerita baru dimasukkan      : ${inserted}`);
  console.log(`Cerita dilewati (sudah ada) : ${skipped}`);
  console.log(`Balasan dimasukkan          : ${repliesInserted}`);
  console.log("\nBuka /cerita dan refresh — cerita sekarang tersimpan permanen di Supabase.\n");
  return 0;
}

// process.exitCode (bukan process.exit) agar koneksi HTTP selesai dengan rapi.
process.exitCode = await main();
