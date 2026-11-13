import { NextResponse } from "next/server";
import { getVipSettingsAsync } from "@/lib/vip";

/**
 * GET /api/vip/settings
 * Endpoint publik: Hanya mengembalikan info yang aman untuk pengunjung
 * (QRIS image & harga). Sisa kuota admin TIDAK disertakan agar rahasia.
 */
export async function GET() {
  try {
    const settings = await getVipSettingsAsync();
    return NextResponse.json(
      {
        price_per_vip: settings.price_per_vip || 5000,
        qris_image_url: settings.qris_image_url || "/qris-default.svg",
      },
      {
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  } catch (err) {
    console.error("[GET /api/vip/settings]:", err);
    return NextResponse.json(
      { price_per_vip: 5000, qris_image_url: "/qris-default.svg" },
      {
        status: 200,
        headers: { "Cache-Control": "no-store, max-age=0" },
      }
    );
  }
}
