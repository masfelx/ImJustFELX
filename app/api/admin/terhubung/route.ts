/**
 * GET  /api/admin/terhubung — Ambil data sosial & link lain
 * POST /api/admin/terhubung — Simpan/update data sosial & link lain
 */
import { NextRequest, NextResponse } from "next/server";
import { getTerhubungAsync, saveTerhubung, type TerhubungData, type TerhubungItem } from "@/lib/admin-data";

export async function GET() {
  try {
    const data = await getTerhubungAsync();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ error: "Gagal membaca data terhubung." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validasi struktur — terima array atau default ke []
    const socials: TerhubungItem[] = Array.isArray(body.socials) ? body.socials : [];
    const otherLinks: TerhubungItem[] = Array.isArray(body.otherLinks) ? body.otherLinks : [];

    // Validasi setiap item
    for (const arr of [socials, otherLinks]) {
      for (const item of arr) {
        if (!item.name || typeof item.name !== "string") {
          return NextResponse.json({ error: "Setiap item harus punya 'name'." }, { status: 400 });
        }
        if (!item.url || typeof item.url !== "string") {
          return NextResponse.json({ error: "Setiap item harus punya 'url'." }, { status: 400 });
        }
      }
    }

    // Helper: safely trim string or return undefined
    const safeTrim = (val: unknown): string | undefined => {
      if (typeof val === "string" && val.trim() !== "") return val.trim();
      return undefined;
    };

    const data: TerhubungData = {
      socials: socials.map((item: TerhubungItem) => ({
        name: String(item.name).trim(),
        url: String(item.url).trim(),
        description: safeTrim(item.description),
        icon: safeTrim(item.icon),
        handle: safeTrim(item.handle),
      })),
      otherLinks: otherLinks.map((item: TerhubungItem) => ({
        name: String(item.name).trim(),
        url: String(item.url).trim(),
        description: safeTrim(item.description),
        icon: safeTrim(item.icon),
        handle: safeTrim(item.handle),
        expires_at: safeTrim(item.expires_at),
        duration_plan: safeTrim(item.duration_plan),
      })),
    };

    await saveTerhubung(data);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error("POST /api/admin/terhubung error:", err);
    const message = err instanceof Error ? err.message : "Request tidak valid.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
