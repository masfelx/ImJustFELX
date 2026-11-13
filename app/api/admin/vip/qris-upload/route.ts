import { NextRequest, NextResponse } from "next/server";
import { getVipSettingsAsync, saveVipSettingsAsync } from "@/lib/vip";
import { supabaseAdmin } from "@/lib/supabase";
import fs from "node:fs";
import path from "node:path";

const uploadsDir = path.join(process.cwd(), "public", "uploads");
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

/**
 * POST /api/admin/vip/qris-upload
 * Upload gambar QRIS admin kustom (Admin only).
 * Otomatis memperbarui qris_image_url di pengaturan VIP.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File QRIS tidak ditemukan." }, { status: 400 });
    }

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/svg+xml"];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Format tidak didukung. Gunakan PNG, JPG, WebP, atau SVG." },
        { status: 400 }
      );
    }

    const originalName = file.name || "qris.png";
    const ext = path.extname(originalName).toLowerCase() || ".png";
    const fileName = `qris-admin-${Date.now()}${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let publicUrl = `/uploads/${fileName}`;

    // 1. Coba upload ke Supabase Storage jika ada
    if (supabaseAdmin) {
      try {
        const { error: uploadError } = await supabaseAdmin.storage
          .from("cerita-photos")
          .upload(`qris/${fileName}`, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage
            .from("cerita-photos")
            .getPublicUrl(`qris/${fileName}`);
          if (urlData?.publicUrl) {
            publicUrl = urlData.publicUrl;
          }
        }
      } catch (err) {
        console.warn("[QRIS Supabase upload fallback to local]:", err);
      }
    }

    // 2. Simpan ke local uploads juga sebagai fallback (jika bukan di Vercel)
    if (!isVercel) {
      try {
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const localFilePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(localFilePath, buffer);
      } catch (err) {
        console.warn("[Local uploads write error]:", err);
      }
    }

    // 3. Simpan URL baru ke pengaturan VIP di Supabase Cloud
    const settings = await getVipSettingsAsync();
    settings.qris_image_url = publicUrl;
    await saveVipSettingsAsync(settings);

    return NextResponse.json({
      success: true,
      qris_image_url: publicUrl,
      message: "Gambar QRIS berhasil diperbarui.",
    }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    console.error("[POST /api/admin/vip/qris-upload]:", err);
    return NextResponse.json({ error: "Gagal mengunggah QRIS." }, { status: 500 });
  }
}
