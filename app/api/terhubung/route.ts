import { NextResponse } from "next/server";
import { getTerhubungAsync } from "@/lib/admin-data";

export async function GET() {
  try {
    const data = await getTerhubungAsync();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    return NextResponse.json({ error: "Gagal memuat link" }, { status: 500 });
  }
}
