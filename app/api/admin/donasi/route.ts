/**
 * GET  /api/admin/donasi — Ambil semua metode donasi
 * POST /api/admin/donasi — Simpan/update semua metode donasi
 */
import { NextRequest, NextResponse } from "next/server";
import { getDonasiAsync, saveDonasi, type DonasiItem } from "@/lib/admin-data";

export async function GET() {
  try {
    const data = await getDonasiAsync();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ error: "Gagal membaca data donasi." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validasi: harus array
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: "Data harus berupa array." }, { status: 400 });
    }

    // Validasi setiap item
    for (const item of body) {
      if (!item.name || typeof item.name !== "string") {
        return NextResponse.json({ error: "Setiap item harus punya 'name'." }, { status: 400 });
      }
      if (!item.url || typeof item.url !== "string") {
        return NextResponse.json({ error: "Setiap item harus punya 'url'." }, { status: 400 });
      }
    }

    const items: DonasiItem[] = body.map((item: DonasiItem) => ({
      name: item.name.trim(),
      url: item.url.trim(),
      description: item.description?.trim() || undefined,
      icon: item.icon?.trim() || undefined,
    }));

    await saveDonasi(items);
    return NextResponse.json({ success: true, data: items });
  } catch (err) {
    console.error("[POST /api/admin/donasi]:", err);
    const message =
      err instanceof Error && err.name !== "SyntaxError"
        ? err.message
        : "Request tidak valid.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
