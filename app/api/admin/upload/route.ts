import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase";
import fs from "node:fs";
import path from "node:path";

const uploadsDir = path.join(process.cwd(), "public", "uploads");
const isVercel = process.env.VERCEL === "1" || process.env.VERCEL === "true";

export async function POST(request: NextRequest) {
  // Verifikasi auth
  const authed = await isAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File gambar tidak ditemukan." }, { status: 400 });
    }

    // Validasi tipe file
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan JPG, PNG, WebP, atau GIF." },
        { status: 400 }
      );
    }

    // Batas ukuran 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran gambar terlalu besar. Maksimal 5MB." },
        { status: 400 }
      );
    }

    // Buat nama file unik yang bersih
    const originalName = file.name || "image.jpg";
    const ext = path.extname(originalName).toLowerCase() || ".jpg";
    const baseName = path
      .basename(originalName, ext)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 30);

    const fileName = `${baseName}-${Date.now()}${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Prioritas: upload ke Supabase Storage
    if (supabaseAdmin) {
      try {
        const { error: uploadError } = await supabaseAdmin.storage
          .from("cerita-photos")
          .upload(`blog/${fileName}`, buffer, {
            contentType: file.type,
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage
            .from("cerita-photos")
            .getPublicUrl(`blog/${fileName}`);
          if (urlData?.publicUrl) {
            return NextResponse.json({
              success: true,
              url: urlData.publicUrl,
              fileName,
            });
          }
        }
      } catch (err) {
        console.warn("[Admin Upload Supabase]:", err);
      }
    }

    // 2. Fallback: simpan ke lokal jika bukan Vercel read-only
    if (!isVercel) {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      const filePath = path.join(uploadsDir, fileName);
      fs.writeFileSync(filePath, buffer);

      return NextResponse.json({
        success: true,
        url: `/uploads/${fileName}`,
        fileName,
      });
    }

    // Jika di Vercel tapi Supabase Storage belum ada bucket, return base64 data url
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
    return NextResponse.json({
      success: true,
      url: base64,
      fileName,
    });
  } catch (err: any) {
    console.error("[Upload Error]:", err);
    return NextResponse.json(
      { error: "Gagal mengunggah gambar. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
