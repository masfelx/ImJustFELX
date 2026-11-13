/**
 * GET  /api/admin/site — Ambil konfigurasi situs
 * POST /api/admin/site — Simpan/update konfigurasi situs
 */
import { NextRequest, NextResponse } from "next/server";
import { getSiteConfigAsync, saveSiteConfig } from "@/lib/admin-data";

export async function GET() {
  try {
    const data = await getSiteConfigAsync();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ error: "Gagal membaca konfigurasi." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validasi field wajib
    const required = ["name", "tagline", "description", "url", "author"];
    for (const field of required) {
      if (!body[field] || typeof body[field] !== "string") {
        return NextResponse.json({ error: `Field '${field}' diperlukan.` }, { status: 400 });
      }
    }

    const data = {
      name: body.name.trim(),
      tagline: body.tagline.trim(),
      description: body.description.trim(),
      url: body.url.trim(),
      author: body.author.trim(),
    };

    await saveSiteConfig(data);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("[POST /api/admin/site]:", err);
    const message =
      err instanceof Error && err.name !== "SyntaxError"
        ? err.message
        : "Request tidak valid.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
