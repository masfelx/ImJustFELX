/**
 * ============================================================
 *  CERITA DATA UTILITIES — Supabase Cloud First
 * ============================================================
 *  Halaman Cerita: Feed anonim ala X/Twitter.
 *
 *  Storage strategy (auto-detect):
 *    1. Jika tabel `stories` ada di Supabase → pakai itu (best)
 *    2. Jika belum → pakai tabel `posts` yang sudah ada,
 *       dengan slug `cerita-feed`, data di-serialize sebagai JSON
 *       di kolom `content`. Ini 100% compatible tanpa ALTER schema.
 *    3. Fallback terakhir: local JSON file (hanya dev lokal).
 * ============================================================
 */
import fs from "node:fs";
import path from "node:path";
import { supabaseAdmin, supabasePublic } from "./supabase";
import { deductVipQuotaAsync } from "./vip";

const dataDir = path.join(process.cwd(), "content", "data");
const ceritaFile = path.join(dataDir, "cerita.json");
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

/** Slug khusus di tabel `posts` untuk menyimpan cerita feed jika tabel `stories` belum ada */
const CERITA_FEED_SLUG = "cerita-feed";

/* ── Types ─────────────────────────────────────────────────── */
export type CeritaReply = {
  id: string;
  story_id: string;
  author_name: string;
  author_handle: string;
  content: string;
  avatar_color: string;
  created_at: string;
};

export type VipTheme = "gold" | "neon" | "fire" | "midnight";

export type CeritaItem = {
  id: string;
  author_name: string;
  author_handle: string;
  content: string;
  avatar_color: string;
  likes: number;
  created_at: string;
  replies?: CeritaReply[];
  is_vip?: boolean;
  vip_theme?: VipTheme;
  pinned_until?: string;
  image_url?: string;
  proof_image_url?: string;
  is_edited?: boolean;
  edited_at?: string;
};

/* ── Avatar Colors ─────────────────────────────────────────── */
const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-purple-600",
  "bg-pink-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-red-600",
  "bg-cyan-600",
  "bg-indigo-600",
  "bg-teal-600",
  "bg-rose-600",
];

export function randomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

/* ── Local File Helpers ────────────────────────────────────── */
function readLocalCerita(): CeritaItem[] {
  try {
    if (!fs.existsSync(ceritaFile)) return [];
    return JSON.parse(fs.readFileSync(ceritaFile, "utf-8"));
  } catch {
    return [];
  }
}

function writeLocalCerita(items: CeritaItem[]): void {
  if (isVercel) return;
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(ceritaFile, JSON.stringify(items, null, 2), "utf-8");
  } catch (err) {
    console.warn("[writeLocalCerita] Skip local file write (read-only):", err);
  }
}

/* ── Error penyimpanan (pesan aman untuk ditampilkan ke pengguna) ── */
export class CeritaStorageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CeritaStorageError";
  }
}

/* ── Supabase Storage Detection ────────────────────────────── */
/**
 * Cek apakah tabel `stories` ada di Supabase.
 * Hasilnya di-cache sebentar (30 detik) agar:
 *  - tidak query berulang di setiap request
 *  - tabel yang baru dibuat langsung terdeteksi tanpa restart server
 */
let _storiesTableExists: { value: boolean; checkedAt: number } | null = null;
const STORIES_CHECK_TTL_MS = 30_000;

async function storiesTableExists(): Promise<boolean> {
  const now = Date.now();
  if (
    _storiesTableExists &&
    now - _storiesTableExists.checkedAt < STORIES_CHECK_TTL_MS
  ) {
    return _storiesTableExists.value;
  }

  const client = supabaseAdmin || supabasePublic;
  if (!client) {
    _storiesTableExists = { value: false, checkedAt: now };
    return false;
  }

  try {
    const { error } = await client.from("stories").select("id").limit(1);
    _storiesTableExists = { value: !error, checkedAt: now };
  } catch {
    _storiesTableExists = { value: false, checkedAt: now };
  }
  return _storiesTableExists.value;
}

/* ── Posts-table fallback helpers (slug = cerita-feed) ─────── */
let ceritaPostsCache: { items: CeritaItem[]; timestamp: number } | null = null;

/** null = gagal membaca (DB error), [] = berhasil dibaca tapi kosong */
async function readCeritaFromPosts(): Promise<CeritaItem[] | null> {
  const now = typeof performance !== "undefined" ? performance.now() : 0;
  if (ceritaPostsCache && now - ceritaPostsCache.timestamp < 15_000) {
    return ceritaPostsCache.items;
  }

  const client = supabaseAdmin || supabasePublic;
  if (!client) return null;
  try {
    const { data, error } = await client
      .from("posts")
      .select("content")
      .eq("slug", CERITA_FEED_SLUG)
      .maybeSingle();

    if (error) {
      console.error("[readCeritaFromPosts] Supabase error:", error.message);
      return null;
    }

    if (!data || !data.content) {
      ceritaPostsCache = { items: [], timestamp: now };
      return [];
    }

    try {
      const parsed = JSON.parse(data.content);
      if (Array.isArray(parsed)) {
        ceritaPostsCache = { items: parsed, timestamp: now };
        return parsed;
      }
    } catch (err) {
      console.error("[readCeritaFromPosts] JSON parse error:", err);
    }
    return [];
  } catch (err) {
    console.warn("[readCeritaFromPosts] error:", err);
    return null;
  }
}

/** true = tersimpan, false = gagal / client admin belum siap */
async function writeCeritaToPosts(items: CeritaItem[]): Promise<boolean> {
  ceritaPostsCache = null;
  const client = supabaseAdmin;
  if (!client) return false;
  try {
    const { error } = await client.from("posts").upsert(
      {
        slug: CERITA_FEED_SLUG,
        title: "Cerita Feed Data",
        excerpt: "Internal storage for cerita feed",
        content: JSON.stringify(items),
        date: new Date().toISOString().slice(0, 10),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );
    if (error) {
      console.error("[writeCeritaToPosts] Supabase error:", error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[writeCeritaToPosts] error:", err);
    return false;
  }
}

/* ── GET: Ambil semua cerita (terbaru dulu) ────────────────── */
function sortCerita(items: CeritaItem[]): CeritaItem[] {
  return [...items].sort((a, b) => {
    if (b.is_vip && !a.is_vip) return 1;
    if (!b.is_vip && a.is_vip) return -1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

export async function getAllCerita(): Promise<CeritaItem[]> {
  const client = supabaseAdmin || supabasePublic;
  let remote: CeritaItem[] | null = null;

  // Strategy 1: Tabel `stories` (jika sudah dibuat)
  if (client && (await storiesTableExists())) {
    try {
      const { data, error } = await client
        .from("stories")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && data) {
        remote = [];
        if (data.length > 0) {
          // Ambil balasan dari tabel story_replies (kalau tabelnya sudah ada)
          const repliesByStory = new Map<string, CeritaReply[]>();
          try {
            const { data: replyRows, error: replyError } = await client
              .from("story_replies")
              .select("*")
              .order("created_at", { ascending: true });
            if (!replyError && Array.isArray(replyRows)) {
              for (const r of replyRows) {
                const key = String(r.story_id);
                const list = repliesByStory.get(key) ?? [];
                list.push({
                  id: String(r.id),
                  story_id: String(r.story_id),
                  author_name: r.author_name || "Anonim",
                  author_handle: r.author_handle || "@anon",
                  content: r.content,
                  avatar_color: r.avatar_color || "bg-blue-600",
                  created_at: r.created_at,
                });
                repliesByStory.set(key, list);
              }
            }
          } catch {
            // Tabel story_replies belum ada — biarkan replies kosong.
          }

          remote = data.map((row) => ({
            id: String(row.id),
            author_name: row.author_name || "Anonim",
            author_handle: row.author_handle || "@anon",
            content: row.content,
            avatar_color: row.avatar_color || "bg-blue-600",
            likes: row.likes || 0,
            created_at: row.created_at,
            replies: repliesByStory.get(String(row.id)) ?? [],
            is_vip: Boolean(row.is_vip),
            vip_theme: row.vip_theme || undefined,
            pinned_until: row.pinned_until || undefined,
            image_url: row.image_url || undefined,
            proof_image_url: row.proof_image_url || undefined,
            is_edited: Boolean(row.is_edited),
            edited_at: row.edited_at || undefined,
          }));
        }
      } else if (error) {
        console.error("[getAllCerita] stories table error:", error.message);
      }
    } catch (err) {
      console.error("[getAllCerita] stories table exception:", err);
    }
  }

  // Strategy 2: Tabel `posts` dengan slug cerita-feed
  if (remote === null && client) {
    const items = await readCeritaFromPosts();
    if (items !== null) {
      remote = items.map((item) => ({
        ...item,
        replies: Array.isArray(item.replies) ? item.replies : [],
        is_vip: Boolean(item.is_vip),
      }));
    }
  }

  // Strategy 3 (development only): gabungkan cerita lokal yang belum
  // terkirim ke Supabase, supaya tidak "hilang" saat kunci server bermasalah.
  // Di production (Vercel) database adalah satu-satunya sumber kebenaran.
  if (!isVercel) {
    const local = readLocalCerita();
    if (local.length > 0) {
      const seen = new Set((remote ?? []).map((c) => c.id));
      const merged = [
        ...(remote ?? []),
        ...local.filter((c) => !seen.has(c.id)),
      ];
      return sortCerita(merged);
    }
  }

  return sortCerita(remote ?? []);
}

/* ── POST: Buat cerita baru ────────────────────────────────── */
export async function createCerita(data: {
  author_name?: string;
  author_handle?: string;
  content: string;
  is_vip?: boolean;
  vip_theme?: VipTheme;
  image_url?: string;
  proof_image_url?: string;
}): Promise<CeritaItem> {
  const now = new Date().toISOString();
  const color = randomAvatarColor();
  const authorName = (data.author_name || "").trim() || "Anonim";
  const authorHandle =
    (data.author_handle || "").trim() || `@${authorName.toLowerCase().replace(/\s+/g, "")}`;
  const isVip = Boolean(data.is_vip);
  const pinnedUntil = isVip
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : undefined;

  const cerita: CeritaItem = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    author_name: authorName,
    author_handle: authorHandle.startsWith("@") ? authorHandle : `@${authorHandle}`,
    content: data.content.trim(),
    avatar_color: color,
    likes: 0,
    created_at: now,
    replies: [],
    is_vip: isVip,
    vip_theme: isVip ? (data.vip_theme || "gold") : undefined,
    pinned_until: pinnedUntil,
    image_url: data.image_url?.trim() || undefined,
    proof_image_url: data.proof_image_url?.trim() || undefined,
  };

  let persisted = false;

  // Strategy 1: Simpan ke tabel `stories` (jika ada)
  if (supabaseAdmin && (await storiesTableExists())) {
    try {
      const { data: inserted, error } = await supabaseAdmin
        .from("stories")
        .insert({
          author_name: cerita.author_name,
          author_handle: cerita.author_handle,
          content: cerita.content,
          avatar_color: cerita.avatar_color,
          likes: 0,
          image_url: cerita.image_url,
          is_vip: cerita.is_vip,
          vip_theme: cerita.vip_theme,
          pinned_until: cerita.pinned_until,
          proof_image_url: cerita.proof_image_url,
        })
        .select()
        .single();

      if (!error && inserted) {
        cerita.id = String(inserted.id);
        cerita.created_at = inserted.created_at;
        persisted = true;
      } else if (error) {
        console.error("[createCerita] stories insert error:", error.message);
      }
    } catch (err) {
      console.error("[createCerita] stories insert exception:", err);
    }
  }

  // Strategy 2: Simpan ke tabel `posts` (slug cerita-feed) — juga jadi
  // fallback kalau insert ke tabel stories gagal.
  if (!persisted && supabaseAdmin) {
    try {
      const existing = (await readCeritaFromPosts()) ?? [];
      existing.unshift(cerita);
      // Simpan maksimal 500 cerita
      persisted = await writeCeritaToPosts(existing.slice(0, 500));
    } catch (err) {
      console.error("[createCerita] posts fallback error:", err);
    }
  }

  // Di production, JANGAN pernah bilang "berhasil" kalau data tidak tersimpan.
  // Inilah penyebab cerita hilang setelah refresh sebelumnya.
  if (!persisted && isVercel) {
    throw new CeritaStorageError(
      "Cerita gagal disimpan ke database. Server belum bisa menulis ke Supabase " +
        "(periksa SUPABASE_SERVICE_ROLE_KEY dan tabel database).",
    );
  }

  // Strategy 3: Simpan ke local file (backup, skip di Vercel)
  if (!isVercel) {
    const local = readLocalCerita();
    local.unshift(cerita);
    writeLocalCerita(local.slice(0, 500));
  }

  // Jika cerita VIP, potong kuota admin & catat transaksi.
  // Baru dilakukan setelah cerita benar-benar tersimpan.
  if (isVip && (persisted || !isVercel)) {
    try {
      await deductVipQuotaAsync(5000, cerita.id, cerita.author_name, cerita.proof_image_url);
    } catch (err) {
      console.error("[deductVipQuotaAsync error]:", err);
    }
  }

  return cerita;
}

/* ── LIKE: Tambah like ─────────────────────────────────────── */
export async function likeCerita(id: string): Promise<number> {
  let newLikes = 0;

  // Strategy 1: stories table
  if (supabaseAdmin && (await storiesTableExists())) {
    try {
      const { data: current } = await supabaseAdmin
        .from("stories")
        .select("likes")
        .eq("id", Number(id))
        .single();

      if (current) {
        newLikes = (current.likes || 0) + 1;
        const { error } = await supabaseAdmin
          .from("stories")
          .update({ likes: newLikes })
          .eq("id", Number(id));
        if (error) console.error("[likeCerita] update error:", error.message);
      }
    } catch (err) {
      console.error("[likeCerita] stories error:", err);
    }
  }
  // Strategy 2: posts fallback
  else if (supabaseAdmin) {
    try {
      const items = await readCeritaFromPosts();
      const found = items?.find((c) => c.id === id);
      if (found && items) {
        found.likes = (found.likes || 0) + 1;
        newLikes = found.likes;
        await writeCeritaToPosts(items);
      }
    } catch (err) {
      console.error("[likeCerita] posts fallback error:", err);
    }
  }

  // Local file backup
  const local = readLocalCerita();
  const found = local.find((c) => c.id === id);
  if (found) {
    found.likes = Math.max(newLikes, (found.likes || 0) + 1);
    newLikes = found.likes;
    writeLocalCerita(local);
  }

  return newLikes;
}

/* ── EDIT: Edit cerita dalam batas waktu 10 menit ─────────── */
export async function editCerita(id: string, newContent: string): Promise<CeritaItem> {
  const content = newContent.trim();
  if (!content) {
    throw new Error("Konten cerita tidak boleh kosong.");
  }
  if (content.length > 500) {
    throw new Error("Konten cerita maksimal 500 karakter.");
  }

  const now = new Date().toISOString();

  // Strategy 1: stories table
  if (supabaseAdmin && (await storiesTableExists())) {
    try {
      const numId = Number(id);
      const { data: row } = await supabaseAdmin
        .from("stories")
        .select("*")
        .eq("id", numId)
        .single();

      if (row) {
        const age = Date.now() - new Date(row.created_at).getTime();
        if (age > 10 * 60 * 1000) {
          throw new Error("Batas waktu pengeditan 10 menit telah berakhir.");
        }
        const { error: updateError } = await supabaseAdmin
          .from("stories")
          .update({ content, is_edited: true, edited_at: now })
          .eq("id", numId);

        if (updateError) {
          throw new Error(`Gagal menyimpan perubahan: ${updateError.message}`);
        }

        return {
          id: String(row.id),
          author_name: row.author_name,
          author_handle: row.author_handle,
          content,
          avatar_color: row.avatar_color,
          likes: row.likes || 0,
          created_at: row.created_at,
          is_vip: Boolean(row.is_vip),
          is_edited: true,
          edited_at: now,
        };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "";
      // Jangan telan error penting — batas waktu & kegagalan simpan harus
      // sampai ke pengguna, bukan berubah jadi "cerita tidak ditemukan".
      if (
        message.includes("10 menit") ||
        message.startsWith("Gagal menyimpan perubahan")
      ) {
        throw err;
      }
      console.error("[editCerita] stories error:", err);
    }
  }

  // Strategy 2: posts fallback
  if (supabaseAdmin) {
    const items = await readCeritaFromPosts();
    const story = items?.find((c) => c.id === id);
    if (story && items) {
      const age = Date.now() - new Date(story.created_at).getTime();
      if (age > 10 * 60 * 1000) {
        throw new Error("Batas waktu pengeditan 10 menit telah berakhir.");
      }
      story.content = content;
      story.is_edited = true;
      story.edited_at = now;
      const saved = await writeCeritaToPosts(items);
      if (!saved && isVercel) {
        throw new CeritaStorageError(
          "Gagal menyimpan perubahan cerita ke database. Periksa SUPABASE_SERVICE_ROLE_KEY.",
        );
      }
      return story;
    }
  }

  // Strategy 3: local file
  const local = readLocalCerita();
  const story = local.find((c) => c.id === id);
  if (!story) throw new Error("Cerita tidak ditemukan.");

  const age = Date.now() - new Date(story.created_at).getTime();
  if (age > 10 * 60 * 1000) {
    throw new Error("Batas waktu pengeditan 10 menit telah berakhir.");
  }

  story.content = content;
  story.is_edited = true;
  story.edited_at = now;
  writeLocalCerita(local);
  return story;
}

/* ── DELETE: Hapus cerita (admin only) ─────────────────────── */
export async function deleteCerita(id: string): Promise<boolean> {
  let deleted = false;

  // Strategy 1: stories table
  if (supabaseAdmin && (await storiesTableExists())) {
    try {
      const { error } = await supabaseAdmin
        .from("stories")
        .delete()
        .eq("id", Number(id));
      if (error) {
        console.error("[deleteCerita] stories error:", error.message);
        if (isVercel) {
          throw new CeritaStorageError(
            "Gagal menghapus cerita dari database. Periksa SUPABASE_SERVICE_ROLE_KEY.",
          );
        }
      } else {
        deleted = true;
      }
    } catch (err) {
      if (err instanceof CeritaStorageError) throw err;
      console.error("[deleteCerita] stories exception:", err);
    }
  }
  // Strategy 2: posts fallback
  else if (supabaseAdmin) {
    try {
      const items = await readCeritaFromPosts();
      const idx = items?.findIndex((c) => c.id === id) ?? -1;
      if (items && idx !== -1) {
        items.splice(idx, 1);
        deleted = await writeCeritaToPosts(items);
      }
    } catch (err) {
      console.error("[deleteCerita] posts fallback error:", err);
    }
  }

  // Local file cleanup
  const local = readLocalCerita();
  const idx = local.findIndex((c) => c.id === id);
  if (idx !== -1) {
    local.splice(idx, 1);
    writeLocalCerita(local);
    deleted = true;
  }

  return deleted;
}

/* ── REPLY: Buat balasan untuk cerita tertentu ─────────────── */
export async function createReply(data: {
  story_id: string;
  author_name?: string;
  author_handle?: string;
  content: string;
}): Promise<CeritaReply | null> {
  const storyId = String(data.story_id);
  const now = new Date().toISOString();
  const color = randomAvatarColor();
  const authorName = (data.author_name || "").trim() || "Anonim";
  const authorHandle =
    (data.author_handle || "").trim() ||
    `@${authorName.toLowerCase().replace(/\s+/g, "")}`;

  const reply: CeritaReply = {
    id: `reply-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    story_id: storyId,
    author_name: authorName,
    author_handle: authorHandle.startsWith("@") ? authorHandle : `@${authorHandle}`,
    content: data.content.trim(),
    avatar_color: color,
    created_at: now,
  };

  let persisted = false;
  const usingStoriesTable = Boolean(
    supabaseAdmin && (await storiesTableExists()),
  );

  // Strategy 1: story_replies table
  if (usingStoriesTable) {
    try {
      const { data: inserted, error } = await supabaseAdmin!
        .from("story_replies")
        .insert({
          story_id: isNaN(Number(storyId)) ? null : Number(storyId),
          author_name: reply.author_name,
          author_handle: reply.author_handle,
          content: reply.content,
          avatar_color: reply.avatar_color,
        })
        .select()
        .single();

      if (!error && inserted) {
        reply.id = String(inserted.id);
        reply.created_at = inserted.created_at;
        persisted = true;
      } else if (error) {
        console.error("[createReply] story_replies error:", error.message);
      }
    } catch (err) {
      console.error("[createReply] story_replies exception:", err);
    }
  }

  // Strategy 2: posts fallback — embed replies in cerita items
  if (!persisted && !usingStoriesTable && supabaseAdmin) {
    try {
      const items = await readCeritaFromPosts();
      if (items === null) throw new Error("Gagal membaca data cerita.");
      const story = items.find((s) => String(s.id) === storyId);
      if (!story) return null;
      if (!Array.isArray(story.replies)) story.replies = [];
      story.replies.push(reply);
      persisted = await writeCeritaToPosts(items);
    } catch (err) {
      console.error("[createReply] posts fallback error:", err);
    }
  }

  if (!persisted && isVercel) {
    throw new CeritaStorageError(
      "Balasan gagal disimpan ke database. Pastikan tabel stories & story_replies " +
        "sudah dibuat dan SUPABASE_SERVICE_ROLE_KEY valid.",
    );
  }

  // Local file backup
  if (!isVercel) {
    const local = readLocalCerita();
    const story = local.find((s) => String(s.id) === storyId);
    if (story) {
      if (!Array.isArray(story.replies)) story.replies = [];
      story.replies.push(reply);
      writeLocalCerita(local);
    }
  }

  return reply;
}

/* ── DELETE REPLY: Hapus balasan tertentu (admin only) ──────── */
export async function deleteReply(storyId: string, replyId: string): Promise<boolean> {
  let deleted = false;

  // Strategy 1: story_replies table
  if (supabaseAdmin && (await storiesTableExists())) {
    try {
      await supabaseAdmin.from("story_replies").delete().eq("id", Number(replyId));
      deleted = true;
    } catch {}
  }
  // Strategy 2: posts fallback
  else if (supabaseAdmin) {
    try {
      const items = await readCeritaFromPosts();
      const story = items?.find((s) => String(s.id) === String(storyId));
      if (items && story && Array.isArray(story.replies)) {
        const idx = story.replies.findIndex((r) => r.id === replyId);
        if (idx !== -1) {
          story.replies.splice(idx, 1);
          deleted = await writeCeritaToPosts(items);
        }
      }
    } catch (err) {
      console.error("[deleteReply] posts fallback error:", err);
    }
  }

  // Local file cleanup
  const local = readLocalCerita();
  const story = local.find((s) => String(s.id) === String(storyId));
  if (story && Array.isArray(story.replies)) {
    const idx = story.replies.findIndex((r) => r.id === replyId);
    if (idx !== -1) {
      story.replies.splice(idx, 1);
      writeLocalCerita(local);
      deleted = true;
    }
  }

  return deleted;
}
