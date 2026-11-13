/**
 * GET /api/admin/stats — Dashboard statistics
 */
import { NextResponse } from "next/server";
import { getDashboardStatsAsync } from "@/lib/admin-data";
import { getAllCerita } from "@/lib/cerita";

export async function GET() {
  try {
    const stats = await getDashboardStatsAsync();
    let totalCerita = 0;
    try {
      const cerita = await getAllCerita();
      totalCerita = cerita.length;
    } catch {
      // fallback 0
    }
    return NextResponse.json({ ...stats, totalCerita }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil statistik." }, { status: 500 });
  }
}
