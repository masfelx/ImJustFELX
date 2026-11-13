/**
 * GET  /api/admin/blog      — Daftar semua post
 * POST /api/admin/blog      — Buat post baru
 */
import { NextRequest, NextResponse } from "next/server";
import { getAllBlogPostsAsync, saveBlogPost, getBlogPostAsync } from "@/lib/admin-data";

export async function GET() {
  try {
    const posts = await getAllBlogPostsAsync();
    return NextResponse.json(posts, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ error: "Gagal membaca blog posts." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validasi
    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json({ error: "Title diperlukan." }, { status: 400 });
    }
    if (!body.slug || typeof body.slug !== "string") {
      return NextResponse.json({ error: "Slug diperlukan." }, { status: 400 });
    }
    if (!/^[a-z0-9-]+$/.test(body.slug)) {
      return NextResponse.json({ error: "Slug hanya boleh huruf kecil, angka, dan strip." }, { status: 400 });
    }

    // Cek apakah slug sudah ada
    const existing = await getBlogPostAsync(body.slug);
    if (existing) {
      return NextResponse.json({ error: "Slug sudah dipakai oleh post lain." }, { status: 409 });
    }

    const post = {
      slug: body.slug.trim(),
      title: body.title.trim(),
      date: body.date?.trim() || new Date().toISOString().split("T")[0],
      excerpt: body.excerpt?.trim() || "",
      cover: body.cover?.trim() || undefined,
      content: body.content || "",
    };

    await saveBlogPost(post);
    return NextResponse.json({ success: true, data: post }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/blog]:", err);
    const message =
      err instanceof Error && err.name !== "SyntaxError"
        ? err.message
        : "Request tidak valid.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
