/**
 * ============================================================
 *  ADMIN DATA UTILITIES — Hybrid (Local Files + Supabase Cloud)
 * ============================================================
 *  Sistem Dual-Sync:
 *  - Vercel (Production): Supabase = penyimpanan utama (filesystem read-only)
 *  - Local Development: Dual-sync ke local file + Supabase
 *  - Menjamin ketersediaan 100% di semua environment.
 * ============================================================
 */
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { supabaseAdmin, supabasePublic } from "./supabase";

const dataDir = path.join(process.cwd(), "content", "data");
const postsDir = path.join(process.cwd(), "content", "posts");

/** Deteksi apakah di Vercel (filesystem read-only) */
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

/**
 * In-memory cache untuk akselerasi navigasi website publik.
 * Memangkas waktu respons dari ~2.5 detik menjadi < 1 milidetik.
 * Saat Admin melakukan update/save, cache otomatis di-clear (invalidated).
 */
const MEMORY_CACHE = new Map<string, { value: any; expiresAt: number }>();
const DEFAULT_TTL_MS = 60_000; // 60 detik cache TTL

export function clearDataCache(prefix?: string) {
  if (!prefix) {
    MEMORY_CACHE.clear();
    return;
  }
  for (const key of Array.from(MEMORY_CACHE.keys())) {
    if (key.startsWith(prefix)) {
      MEMORY_CACHE.delete(key);
    }
  }
}

async function withCache<T>(key: string, fetcher: () => Promise<T>, ttlMs = DEFAULT_TTL_MS): Promise<T> {
  const cached = MEMORY_CACHE.get(key);
  const now = typeof performance !== "undefined" ? performance.now() : 0;
  if (cached && cached.expiresAt > now) {
    return cached.value as T;
  }

  const result = await fetcher();
  MEMORY_CACHE.set(key, { value: result, expiresAt: now + ttlMs });
  return result;
}

/* ── Generic JSON helpers ───────────────────────────────── */
function readJSON<T>(filename: string): T {
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Data file not found: ${filename}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

/** Write JSON ke local file — skip jika filesystem read-only (Vercel) */
function writeJSON<T>(filename: string, data: T): void {
  if (isVercel) return; // Skip di Vercel, data disimpan ke Supabase
  try {
    const filePath = path.join(dataDir, filename);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.warn(`[writeJSON] Gagal menulis ${filename} (read-only fs):`, err);
  }
}

/* ── Donasi CRUD ────────────────────────────────────────── */
export type DonasiItem = {
  name: string;
  url: string;
  description?: string;
  icon?: string;
};

export function getDonasi(): DonasiItem[] {
  return readJSON<DonasiItem[]>("donasi.json");
}

/** Ambil semua metode donasi — Supabase Cloud utama, fallback local donasi.json */
export async function getDonasiAsync(): Promise<DonasiItem[]> {
  return withCache("donasi", async () => {
    const client = supabaseAdmin || supabasePublic;
    if (client) {
      try {
        const { data, error } = await client
          .from("donations")
          .select("*")
          .order("sort_order", { ascending: true });

        if (!error && data) {
          return data.map((row: any) => ({
            name: row.name,
            url: row.url,
            description: row.description || undefined,
            icon: row.icon || "coffee",
          }));
        }
      } catch (err) {
        console.warn("[getDonasiAsync] Supabase read failed:", err);
      }
    }

    return getDonasi();
  });
}

export async function saveDonasi(items: DonasiItem[]): Promise<void> {
  clearDataCache("donasi");
  // 1. Simpan ke Supabase Cloud (utama di Vercel)
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from("donations").delete().neq("id", 0);
      if (items.length > 0) {
        const rows = items.map((item, index) => ({
          name: item.name,
          url: item.url,
          description: item.description || null,
          icon: item.icon || "coffee",
          sort_order: index + 1,
        }));
        const { error } = await supabaseAdmin.from("donations").insert(rows);
        if (error) throw error;
      }
    } catch (err) {
      console.error("[Supabase Sync Error - Donations]:", err);
      if (isVercel) throw new Error("Gagal menyimpan donasi ke database.");
    }
  }

  // 2. Simpan ke local file (skip otomatis di Vercel)
  writeJSON("donasi.json", items);
}

/* ── Terhubung CRUD ─────────────────────────────────────── */
export type TerhubungItem = {
  name: string;
  url: string;
  description?: string;
  icon?: string;
  handle?: string;
  expires_at?: string;
  duration_plan?: string;
};

export type TerhubungData = {
  socials: TerhubungItem[];
  otherLinks: TerhubungItem[];
};

type LinkRow = {
  name: string;
  url: string;
  handle: string | null;
  description: string | null;
  icon: string;
  type: "social" | "other";
  sort_order: number;
  expires_at?: string | null;
  duration_plan?: string | null;
};

export function getTerhubung(): TerhubungData {
  return readJSON<TerhubungData>("terhubung.json");
}

/** Ambil data Terhubung — di Vercel baca dari Supabase, lokal dari file */
export async function getTerhubungAsync(): Promise<TerhubungData> {
  return withCache("terhubung", async () => {
    // Coba baca dari Supabase dulu (utama di Vercel)
    const client = supabaseAdmin || supabasePublic;
    if (client) {
      try {
        const { data: rows, error } = await client
          .from("links")
          .select("*")
          .order("sort_order", { ascending: true });

        if (!error && rows) {
          const socials: TerhubungItem[] = [];
          const otherLinks: TerhubungItem[] = [];

          for (const row of rows) {
            let expires_at = row.expires_at || undefined;
            let duration_plan = row.duration_plan || undefined;

            // Ekstrak metadata masa aktif dari handle jika tersimpan dengan format meta: atau JSON
            if (row.type === "other" && row.handle && typeof row.handle === "string") {
              try {
                let jsonStr = row.handle;
                if (jsonStr.startsWith("meta:")) jsonStr = jsonStr.slice(5);
                const meta = JSON.parse(jsonStr);
                if (!expires_at && meta.expires_at) expires_at = meta.expires_at;
                if (!duration_plan && meta.duration_plan) duration_plan = meta.duration_plan;
              } catch {}
            }

            const item: TerhubungItem = {
              name: row.name,
              url: row.url,
              description: row.description || undefined,
              icon: row.icon || undefined,
              handle: row.type === "social" ? (row.handle || undefined) : undefined,
              expires_at,
              duration_plan,
            };

            if (row.type === "social") {
              socials.push(item);
            } else {
              otherLinks.push(item);
            }
          }
          return { socials, otherLinks };
        }
      } catch (err) {
        console.warn("[getTerhubungAsync] Supabase read failed:", err);
      }
    }

    // Fallback ke local file
    return readJSON<TerhubungData>("terhubung.json");
  });
}

export async function saveTerhubung(data: TerhubungData): Promise<void> {
  clearDataCache("terhubung");
  // 1. Simpan ke Supabase Cloud (utama di Vercel)
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from("links").delete().neq("id", 0);
      const rows: Record<string, any>[] = [];

      data.socials.forEach((item, index) => {
        rows.push({
          name: item.name,
          url: item.url,
          handle: item.handle || null,
          description: item.description || null,
          icon: item.icon || "link",
          type: "social",
          sort_order: index + 1,
        });
      });

      data.otherLinks.forEach((item, index) => {
        // Simpan metadata masa aktif di handle agar 100% kompatibel tanpa perlu alter schema tabel
        const metaPayload = (item.expires_at || item.duration_plan)
          ? `meta:${JSON.stringify({ expires_at: item.expires_at, duration_plan: item.duration_plan })}`
          : null;

        rows.push({
          name: item.name,
          url: item.url,
          handle: metaPayload,
          description: item.description || null,
          icon: item.icon || "link",
          type: "other",
          sort_order: index + 1,
        });
      });

      if (rows.length > 0) {
        const { error } = await supabaseAdmin.from("links").insert(rows);
        if (error) throw error;
      }
    } catch (err) {
      console.error("[Supabase Sync Error - Links]:", err);
      // Jika Supabase gagal DAN di Vercel, throw error agar user tahu
      if (isVercel) throw new Error("Gagal menyimpan ke database Supabase.");
    }
  }

  // 2. Simpan ke local file (skip otomatis jika di Vercel)
  writeJSON("terhubung.json", data);
}

/* ── Site Config CRUD ───────────────────────────────────── */
export type SiteConfigData = {
  name: string;
  tagline: string;
  description: string;
  url: string;
  author: string;
};

export function getSiteConfig(): SiteConfigData {
  return readJSON<SiteConfigData>("site-config.json");
}

/** Ambil konfigurasi situs — Supabase Cloud utama, fallback local site-config.json */
export async function getSiteConfigAsync(): Promise<SiteConfigData> {
  return withCache("site_config", async () => {
    const client = supabaseAdmin || supabasePublic;
    if (client) {
      try {
        const { data, error } = await client
          .from("site_config")
          .select("*")
          .eq("id", "current")
          .maybeSingle();

        if (!error && data) {
          return {
            name: data.name || "LUX0RIA",
            tagline: data.tagline || "",
            description: data.description || "",
            url: data.url || "https://lux0ria.example.com",
            author: data.author || "LUX0RIA",
          };
        }
      } catch (err) {
        console.warn("[getSiteConfigAsync] Supabase read failed:", err);
      }
    }

    return getSiteConfig();
  });
}

export async function saveSiteConfig(data: SiteConfigData): Promise<void> {
  clearDataCache("site_config");
  // 1. Simpan ke Supabase Cloud (utama di Vercel)
  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from("site_config").upsert({
        id: "current",
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        url: data.url,
        author: data.author,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    } catch (err) {
      console.error("[Supabase Sync Error - SiteConfig]:", err);
      if (isVercel) throw new Error("Gagal menyimpan config ke database.");
    }
  }

  // 2. Simpan ke local file (skip otomatis di Vercel)
  writeJSON("site-config.json", data);
}

/* ── Blog Posts CRUD ────────────────────────────────────── */
export type BlogPostData = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  cover?: string;
  content: string; // raw markdown body
};

export function getAllBlogPosts(): BlogPostData[] {
  if (!fs.existsSync(postsDir)) return [];

  return fs
    .readdirSync(postsDir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".markdown"))
    .map((filename) => {
      const slug = filename.replace(/\.md$|\.markdown$/, "");
      const raw = fs.readFileSync(path.join(postsDir, filename), "utf-8");
      const { data, content } = matter(raw);
      return {
        slug,
        title: typeof data.title === "string" ? data.title : slug,
        date: typeof data.date === "string" ? data.date : "1970-01-01",
        excerpt: typeof data.excerpt === "string" ? data.excerpt : "",
        cover: typeof data.cover === "string" ? data.cover : undefined,
        content,
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Ambil semua blog post — Supabase Cloud dulu, fallback local file */
export async function getAllBlogPostsAsync(): Promise<BlogPostData[]> {
  return withCache("posts:all", async () => {
    const client = supabaseAdmin || supabasePublic;
    if (client) {
      try {
        const { data, error } = await client
          .from("posts")
          .select("*")
          .neq("slug", "tentang")
          .neq("slug", "beranda")
          .neq("slug", "cerita-feed")
          .neq("slug", "vip-settings")
          .order("date", { ascending: false });

        if (!error && data) {
          return data.map((row: any) => ({
            slug: row.slug,
            title: row.title || row.slug,
            date: row.date || "1970-01-01",
            excerpt: row.excerpt || "",
            cover: row.cover || undefined,
            content: row.content || "",
          }));
        }
      } catch (err) {
        console.warn("[getAllBlogPostsAsync] Supabase query failed:", err);
      }
    }

    return getAllBlogPosts();
  });
}

export function getBlogPost(slug: string): BlogPostData | null {
  if (!/^[a-z0-9-]+$/.test(slug)) return null;

  const filePath = path.join(postsDir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: typeof data.title === "string" ? data.title : slug,
    date: typeof data.date === "string" ? data.date : "1970-01-01",
    excerpt: typeof data.excerpt === "string" ? data.excerpt : "",
    cover: typeof data.cover === "string" ? data.cover : undefined,
    content,
  };
}

/** Ambil satu blog post — Supabase Cloud dulu, fallback local file */
export async function getBlogPostAsync(slug: string): Promise<BlogPostData | null> {
  const RESERVED_SLUGS = ["tentang", "beranda", "cerita-feed", "vip-settings"];
  if (RESERVED_SLUGS.includes(slug)) return null;

  return withCache(`posts:item:${slug}`, async () => {
    const client = supabaseAdmin || supabasePublic;
    if (client) {
      try {
        const { data, error } = await client
          .from("posts")
          .select("*")
          .eq("slug", slug)
          .maybeSingle();

        if (!error) {
          if (!data) return null;
          return {
            slug: data.slug,
            title: data.title || data.slug,
            date: data.date || "1970-01-01",
            excerpt: data.excerpt || "",
            cover: data.cover || undefined,
            content: data.content || "",
          };
        }
      } catch (err) {
        console.warn("[getBlogPostAsync] Supabase query failed:", err);
      }
    }

    return getBlogPost(slug);
  });
}

export async function saveBlogPost(post: BlogPostData): Promise<void> {
  clearDataCache("posts");
  // 1. Simpan ke Supabase Cloud (utama di Vercel)
  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from("posts").upsert(
        {
          slug: post.slug,
          title: post.title,
          excerpt: post.excerpt,
          content: post.content,
          cover: post.cover || null,
          date: post.date,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" }
      );
      if (error) throw error;
    } catch (err) {
      console.error("[Supabase Sync Error - Posts]:", err);
      if (isVercel) throw new Error("Gagal menyimpan post ke database.");
    }
  }

  // 2. Simpan ke local markdown file (skip jika Vercel)
  if (!isVercel) {
    if (!fs.existsSync(postsDir)) {
      fs.mkdirSync(postsDir, { recursive: true });
    }
    const frontmatter: Record<string, string> = {
      title: post.title,
      date: post.date,
      excerpt: post.excerpt,
    };
    if (post.cover) frontmatter.cover = post.cover;
    const fileContent = matter.stringify(post.content, frontmatter);
    fs.writeFileSync(path.join(postsDir, `${post.slug}.md`), fileContent, "utf-8");
  }
}

export async function deleteBlogPost(slug: string): Promise<boolean> {
  clearDataCache("posts");
  if (!/^[a-z0-9-]+$/.test(slug)) return false;

  // 1. Hapus dari Supabase Cloud
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from("posts").delete().eq("slug", slug);
    } catch (err) {
      console.error("[Supabase Sync Error - Delete Post]:", err);
    }
  }

  // 2. Hapus dari local filesystem (skip jika Vercel)
  if (!isVercel) {
    const filePath = path.join(postsDir, `${slug}.md`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  return true;
}

/* ── Halaman Beranda CRUD ───────────────────────────────── */
export type BerandaCard = {
  name: string;
  description: string;
  href: string;
  icon: string;
};

export type BerandaData = {
  hero_badge: string;
  hero_title: string;
  hero_subtitle: string;
  cta_primary_text: string;
  cta_primary_url: string;
  cta_secondary_text: string;
  cta_secondary_url: string;
  cta_tertiary_text: string;
  cta_tertiary_url: string;
  posts_heading: string;
  explore_heading: string;
  explore_items: BerandaCard[];
};

export const DEFAULT_BERANDA: BerandaData = {
  hero_badge: "Blog pribadi · LUX0RIA",
  hero_title: "Cerita, catatan,\ndan karya.",
  hero_subtitle: "Blog pribadi LUX0RIA — cerita, catatan, dan karya.",
  cta_primary_text: "Baca Blog",
  cta_primary_url: "/blog",
  cta_secondary_text: "Cerita",
  cta_secondary_url: "/cerita",
  cta_tertiary_text: "Donasi",
  cta_tertiary_url: "/donasi",
  posts_heading: "Tulisan terbaru.",
  explore_heading: "Jelajahi.",
  explore_items: [
    {
      href: "/cerita",
      name: "Cerita",
      description: "Ruang berbagi unek-unek, pesan, dan kisah anonim interaktif.",
      icon: "heart",
    },
    {
      href: "/donasi",
      name: "Donasi",
      description: "Traktir kopi lewat Saweria, Sociabuzz, atau Sibagi — sekecil apa pun berarti.",
      icon: "coffee",
    },
    {
      href: "/terhubung",
      name: "Terhubung",
      description: "Semua akun sosial media dan website lainnya, di satu halaman.",
      icon: "instagram",
    },
    {
      href: "/tentang",
      name: "Tentang",
      description: "Kenalan dengan orang di balik tulisan-tulisan ini.",
      icon: "user",
    },
  ],
};

export async function getBerandaAsync(): Promise<BerandaData> {
  return withCache("beranda", async () => {
    // 1. Coba baca dari Supabase Cloud (posts table, slug = 'beranda')
    const client = supabaseAdmin || supabasePublic;
    if (client) {
      try {
        const { data, error } = await client
          .from("posts")
          .select("content")
          .eq("slug", "beranda")
          .maybeSingle();

        if (!error && data && data.content) {
          try {
            const parsed = JSON.parse(data.content);
            return {
              ...DEFAULT_BERANDA,
              ...parsed,
              explore_items: Array.isArray(parsed.explore_items) && parsed.explore_items.length > 0
                ? parsed.explore_items
                : DEFAULT_BERANDA.explore_items,
            };
          } catch {}
        }
      } catch (err) {
        console.warn("[getBerandaAsync] Supabase read failed:", err);
      }
    }

    // 2. Fallback baca local file content/data/beranda.json
    try {
      const filePath = path.join(dataDir, "beranda.json");
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw);
        return {
          ...DEFAULT_BERANDA,
          ...parsed,
          explore_items: Array.isArray(parsed.explore_items) && parsed.explore_items.length > 0
            ? parsed.explore_items
            : DEFAULT_BERANDA.explore_items,
        };
      }
    } catch {}

    return DEFAULT_BERANDA;
  });
}

export async function saveBeranda(data: BerandaData): Promise<void> {
  clearDataCache("beranda");
  const merged: BerandaData = {
    ...DEFAULT_BERANDA,
    ...data,
    explore_items: Array.isArray(data.explore_items) ? data.explore_items : DEFAULT_BERANDA.explore_items,
  };

  // 1. Simpan ke Supabase Cloud
  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from("posts").upsert(
        {
          slug: "beranda",
          title: "Pengaturan Beranda",
          excerpt: merged.hero_subtitle?.slice(0, 150) || "Beranda",
          content: JSON.stringify(merged),
          date: new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" }
      );
      if (error) throw error;
    } catch (err) {
      console.error("[saveBeranda] Supabase error:", err);
      if (isVercel) throw new Error("Gagal menyimpan pengaturan Beranda ke database.");
    }
  }

  // 2. Simpan ke local file jika bukan Vercel
  writeJSON("beranda.json", merged);
}

/* ── Halaman Tentang CRUD ───────────────────────────────── */
export type TentangData = {
  title: string;
  excerpt?: string;
  content: string;
};

export async function getTentangAsync(): Promise<TentangData> {
  return withCache("tentang", async () => {
    // 1. Coba baca dari Supabase Cloud
    const client = supabaseAdmin || supabasePublic;
    if (client) {
      try {
        const { data, error } = await client
          .from("posts")
          .select("title, excerpt, content")
          .eq("slug", "tentang")
          .maybeSingle();

        if (!error && data) {
          return {
            title: data.title || "Tentang",
            excerpt: data.excerpt || "",
            content: data.content || "",
          };
        }
      } catch (err) {
        console.warn("[getTentangAsync] Supabase read failed:", err);
      }
    }

    // 2. Fallback baca file lokal content/pages/tentang.md
    try {
      const pagesDir = path.join(process.cwd(), "content", "pages");
      const filePath = path.join(pagesDir, "tentang.md");
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const { data, content } = matter(raw);
        return {
          title: typeof data.title === "string" ? data.title : "Tentang",
          excerpt: typeof data.excerpt === "string" ? data.excerpt : "",
          content,
        };
      }
    } catch (err) {
      console.warn("[getTentangAsync] Local file read failed:", err);
    }

    return {
      title: "Tentang",
      excerpt: "Kenalan dengan orang di balik LUX0RIA — cerita, motivasi, dan hal-hal di balik layar.",
      content: "# Tentang LUX0RIA\n\nSelamat datang di website kami.",
    };
  });
}

export async function saveTentang(data: TentangData): Promise<void> {
  clearDataCache("tentang");
  // 1. Simpan ke Supabase Cloud (utama di Vercel)
  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin.from("posts").upsert(
        {
          slug: "tentang",
          title: data.title.trim() || "Tentang",
          excerpt: data.excerpt?.trim() || null,
          content: data.content,
          date: new Date().toISOString().slice(0, 10),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "slug" }
      );
      if (error) throw error;
    } catch (err) {
      console.error("[saveTentang] Supabase error:", err);
      if (isVercel) throw new Error("Gagal menyimpan ke database Supabase.");
    }
  }

  // 2. Simpan ke local file jika bukan Vercel
  if (!isVercel) {
    try {
      const pagesDir = path.join(process.cwd(), "content", "pages");
      if (!fs.existsSync(pagesDir)) {
        fs.mkdirSync(pagesDir, { recursive: true });
      }
      const frontmatter: Record<string, string> = { title: data.title.trim() || "Tentang" };
      if (data.excerpt?.trim()) frontmatter.excerpt = data.excerpt.trim();
      const fileContent = matter.stringify(data.content, frontmatter);
      fs.writeFileSync(path.join(pagesDir, "tentang.md"), fileContent, "utf-8");
    } catch (err) {
      console.warn("[saveTentang] Local write failed:", err);
    }
  }
}

export function getDashboardStats() {
  const donasi = getDonasi();
  const terhubung = getTerhubung();
  const posts = getAllBlogPosts();
  const config = getSiteConfig();

  return {
    totalPosts: posts.length,
    totalDonasi: donasi.length,
    totalSocials: terhubung.socials.length,
    totalOtherLinks: terhubung.otherLinks.length,
    siteName: config.name,
    latestPost: posts[0] ?? null,
  };
}

export async function getDashboardStatsAsync() {
  const donasi = getDonasi();
  const terhubung = await getTerhubungAsync();
  const posts = await getAllBlogPostsAsync();
  const config = getSiteConfig();

  return {
    totalPosts: posts.length,
    totalDonasi: donasi.length,
    totalSocials: terhubung.socials.length,
    totalOtherLinks: terhubung.otherLinks.length,
    siteName: config.name,
    latestPost: posts[0] ?? null,
  };
}
