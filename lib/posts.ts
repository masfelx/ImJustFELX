import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";
import { supabaseAdmin, supabasePublic } from "./supabase";
import { getAllBlogPostsAsync, getBlogPostAsync } from "./admin-data";

const postsDirectory = path.join(process.cwd(), "content", "posts");

export type PostSummary = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  /** Menit baca, mis. "3 mnt baca" */
  readingTime: string;
  cover?: string;
};

export type Post = PostSummary & {
  contentHtml: string;
};

/** Ambil semua slug (nama file .md) — dipakai generateStaticParams */
export function getAllSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) return [];
  return fs
    .readdirSync(postsDirectory)
    .filter((file) => file.endsWith(".md") || file.endsWith(".markdown"))
    .map((file) => file.replace(/\.md$|\.markdown$/, ""));
}

type RawPost = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  cover?: string;
  minutes: number;
};

function readRawPosts(): RawPost[] {
  return getAllSlugs().map((slug) => {
    const fullPath = path.join(postsDirectory, `${slug}.md`);
    const fileContents = fs.existsSync(fullPath)
      ? fs.readFileSync(fullPath, "utf8")
      : fs.readFileSync(
          path.join(postsDirectory, `${slug}.markdown`),
          "utf8",
        );
    const { data, content } = matter(fileContents);

    const title =
      typeof data.title === "string" && data.title.trim() !== ""
        ? data.title
        : slug;
    const date =
      typeof data.date === "string" && data.date.trim() !== ""
        ? data.date
        : "1970-01-01";
    const excerpt =
      typeof data.excerpt === "string" ? data.excerpt : "";
    const cover = typeof data.cover === "string" ? data.cover : undefined;

    // Hitung waktu baca: ±200 kata/menit
    const words = content
      .replace(/[#>*`~\-[\]()]/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 200));

    return { slug, title, date, excerpt, cover, minutes };
  });
}

/** Daftar ringkas semua post, terbaru dulu (Memanfaatkan in-memory cache dari getAllBlogPostsAsync) */
export async function getPostSummaries(): Promise<PostSummary[]> {
  try {
    const posts = await getAllBlogPostsAsync();
    return posts.map((post) => {
      const content = post.content || "";
      const words = content
        .replace(/[#>*`~\-[\]()]/g, " ")
        .split(/\s+/)
        .filter(Boolean).length;
      const minutes = Math.max(1, Math.round(words / 200));

      return {
        slug: post.slug,
        title: post.title,
        date: post.date,
        excerpt: post.excerpt,
        cover: post.cover,
        readingTime: `${minutes} mnt baca`,
      };
    });
  } catch (err) {
    console.warn("[getPostSummaries] Failed:", err);
  }

  // Fallback lokal (hanya jika Supabase tidak terhubung atau error jaringan)
  return readRawPosts()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map(({ slug, title, date, excerpt, cover, minutes }) => ({
      slug,
      title,
      date,
      excerpt,
      cover,
      readingTime: `${minutes} mnt baca`,
    }));
}

/** Satu post lengkap berdasarkan slug, sudah dirender jadi HTML */
export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    const post = await getBlogPostAsync(slug);
    if (!post) return null;

    const content = post.content || "";
    const words = content
      .replace(/[#>*`~\-[\]()]/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;
    const minutes = Math.max(1, Math.round(words / 200));

    const processed = await remark()
      .use(remarkGfm)
      .use(remarkHtml)
      .process(content);

    return {
      slug: post.slug,
      title: post.title,
      date: post.date,
      excerpt: post.excerpt,
      cover: post.cover,
      readingTime: `${minutes} mnt baca`,
      contentHtml: processed.toString(),
    };
  } catch (err) {
    console.warn("[getPostBySlug] Failed:", err);
  }

  // Fallback lokal
  const raw = readRawPosts().find((post) => post.slug === slug);
  if (!raw) return null;

  const fullPath = path.join(postsDirectory, `${raw.slug}.md`);
  const fileContents = fs.existsSync(fullPath)
    ? fs.readFileSync(fullPath, "utf8")
    : fs.readFileSync(path.join(postsDirectory, `${raw.slug}.markdown`), "utf8");
  const { content } = matter(fileContents);

  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHtml)
    .process(content);

  return {
    ...raw,
    readingTime: `${raw.minutes} mnt baca`,
    contentHtml: processed.toString(),
  };
}

/** Format tanggal Indonesia: "11 November 2026" */
export function formatDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return isoDate;
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Halaman markdown statis (di luar blog) — mis. Tentang.
 * Prioritas baca dari Supabase Cloud (slug = name), fallback ke content/pages/{name}.md.
 * Mengembalikan null kalau tidak ada.
 */
export async function getMarkdownPage(
  name: string,
): Promise<{ title?: string; excerpt?: string; contentHtml: string } | null> {
  const allowed = /^[a-z0-9-]+$/;
  if (!allowed.test(name)) return null;

  // 1. Coba baca dari Supabase Cloud
  const client = supabaseAdmin || supabasePublic;
  if (client) {
    try {
      const { data, error } = await client
        .from("posts")
        .select("title, excerpt, content")
        .eq("slug", name)
        .maybeSingle();

      if (!error && data && data.content) {
        const processed = await remark()
          .use(remarkGfm)
          .use(remarkHtml)
          .process(data.content);

        return {
          title: data.title || undefined,
          excerpt: data.excerpt || undefined,
          contentHtml: processed.toString(),
        };
      }
    } catch (err) {
      console.warn(`[getMarkdownPage] Supabase read failed for ${name}:`, err);
    }
  }

  // 2. Fallback baca file lokal content/pages/{name}.md
  const filePath = path.join(process.cwd(), "content", "pages", `${name}.md`);
  if (!fs.existsSync(filePath)) return null;

  const { data, content } = matter(fs.readFileSync(filePath, "utf8"));
  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHtml)
    .process(content);

  return {
    title: typeof data.title === "string" ? data.title : undefined,
    excerpt: typeof data.excerpt === "string" ? data.excerpt : undefined,
    contentHtml: processed.toString(),
  };
}
