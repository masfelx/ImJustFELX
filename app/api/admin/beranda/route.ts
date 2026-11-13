import { NextRequest, NextResponse } from "next/server";
import { getBerandaAsync, saveBeranda, type BerandaData } from "@/lib/admin-data";

export async function GET() {
  try {
    const data = await getBerandaAsync();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Gagal memuat pengaturan Beranda." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BerandaData;

    if (!body.hero_title || typeof body.hero_title !== "string") {
      return NextResponse.json({ error: "Judul utama hero diperlukan." }, { status: 400 });
    }

    await saveBeranda(body);
    return NextResponse.json({ success: true, data: body });
  } catch (err: any) {
    console.error("POST /api/admin/beranda error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal menyimpan pengaturan Beranda." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
