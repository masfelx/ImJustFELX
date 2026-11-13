/**
 * GET /api/cerita — Ambil semua cerita (publik)
 * POST /api/cerita — Buat cerita baru (publik, rate-limited)
 */
import { NextRequest, NextResponse } from "next/server";
import { getAllCerita, createCerita, CeritaStorageError } from "@/lib/cerita";

// Rate limit sederhana: 1 post per 30 detik per IP
const rateLimitMap = new Map<string, number>();

export async function GET() {
  try {
    const cerita = await getAllCerita();
    return NextResponse.json(cerita, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    console.error("[GET /api/cerita]:", err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";

    // Validasi
    if (!content) {
      return NextResponse.json(
        { error: "Cerita tidak boleh kosong." },
        { status: 400 }
      );
    }
    if (content.length > 500) {
      return NextResponse.json(
        { error: "Cerita maksimal 500 karakter." },
        { status: 400 }
      );
    }

    // Rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const lastPost = rateLimitMap.get(ip) || 0;
    const now = Date.now();

    // Dalam development, relax ke 5 detik
    const cooldown = process.env.NODE_ENV === "development" ? 5_000 : 30_000;

    if (now - lastPost < cooldown) {
      const wait = Math.ceil((cooldown - (now - lastPost)) / 1000);
      return NextResponse.json(
        { error: `Tunggu ${wait} detik lagi sebelum posting.` },
        { status: 429 }
      );
    }

    rateLimitMap.set(ip, now);

    const isVip = Boolean(body.is_vip);
    const proofImageUrl = typeof body.proof_image_url === "string" ? body.proof_image_url.trim() : "";

    // Validasi VIP: Wajib melampirkan bukti transfer pembayaran QRIS
    if (isVip) {
      if (!proofImageUrl) {
        return NextResponse.json(
          { error: "Bukti transfer screenshot QRIS wajib diunggah untuk mengaktifkan Cerita VIP." },
          { status: 400 }
        );
      }

      // Periksa kuota VIP admin & anti-duplikasi bukti transfer
      const { getVipSettingsAsync, isProofAlreadyUsedAsync } = await import("@/lib/vip");
      if (await isProofAlreadyUsedAsync(proofImageUrl)) {
        return NextResponse.json(
          { error: "Bukti transfer ini sudah pernah digunakan untuk postingan VIP lain. Harap unggah bukti transfer terbaru Anda." },
          { status: 400 }
        );
      }

      const vipSettings = await getVipSettingsAsync();
      if (vipSettings.quota < vipSettings.price_per_vip) {
        return NextResponse.json(
          { error: "Kuota VIP saat ini sedang penuh. Silakan coba lagi nanti." },
          { status: 400 }
        );
      }
    }

    const cerita = await createCerita({
      author_name: typeof body.author_name === "string" ? body.author_name : undefined,
      author_handle: typeof body.author_handle === "string" ? body.author_handle : undefined,
      content,
      is_vip: isVip,
      vip_theme: typeof body.vip_theme === "string" ? body.vip_theme : undefined,
      image_url: typeof body.image_url === "string" ? body.image_url : undefined,
      proof_image_url: isVip ? proofImageUrl : undefined,
    });

    return NextResponse.json(cerita, { status: 201 });
  } catch (err) {
    console.error("[POST /api/cerita]:", err);
    if (err instanceof CeritaStorageError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Gagal menyimpan cerita." },
      { status: 500 }
    );
  }
}
