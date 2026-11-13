/**
 * GET    /api/admin/blog/[slug] — Ambil satu post
 * PUT    /api/admin/blog/[slug] — Update post
 * DELETE /api/admin/blog/[slug] — Hapus post
 */
import { NextRequest, NextResponse } from "next/server";
import { getBlogPostAsync, saveBlogPost, deleteBlogPost } from "@/lib/admin-data";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;
  const post = await getBlogPostAsync(slug);

  if (!post) {
    return NextResponse.json({ error: "Post tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json(post, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  // Pastikan post ada
  const existing = await getBlogPostAsync(slug);
  if (!existing) {
    return NextResponse.json({ error: "Post tidak ditemukan." }, { status: 404 });
  }

  try {
    const body = await request.json();

    const updated = {
      slug, // slug tidak berubah
      title: body.title?.trim() || existing.title,
      date: body.date?.trim() || existing.date,
      excerpt: body.excerpt?.trim() ?? existing.excerpt,
      cover: body.cover?.trim() || existing.cover,
      content: body.content ?? existing.content,
    };

    await saveBlogPost(updated);
    return NextResponse.json({ success: true, data: updated });
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { slug } = await context.params;

  const deleted = await deleteBlogPost(slug);
  if (!deleted) {
    return NextResponse.json({ error: "Post tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
