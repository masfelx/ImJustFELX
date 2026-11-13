import { NextRequest, NextResponse } from "next/server";
import { getTentangAsync, saveTentang, type TentangData } from "@/lib/admin-data";

export async function GET() {
  try {
    const data = await getTentangAsync();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Gagal memuat konten Tentang." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.title || typeof body.title !== "string") {
      return NextResponse.json({ error: "Judul halaman diperlukan." }, { status: 400 });
    }
    if (body.content === undefined || typeof body.content !== "string") {
      return NextResponse.json({ error: "Isi konten diperlukan." }, { status: 400 });
    }

    const data: TentangData = {
      title: body.title.trim(),
      excerpt: typeof body.excerpt === "string" ? body.excerpt.trim() : "",
      content: body.content,
    };

    await saveTentang(data);
    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("POST /api/admin/tentang error:", err);
    return NextResponse.json({ error: err.message || "Gagal menyimpan konten Tentang." }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
