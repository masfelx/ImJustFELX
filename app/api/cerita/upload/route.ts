import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import fs from "node:fs";
import path from "node:path";

const uploadsDir = path.join(process.cwd(), "public", "uploads");

/**
 * POST /api/cerita/upload — Upload foto untuk cerita
 * Prioritas 1: Supabase Storage Cloud (bucket: 'cerita-photos')
 * Prioritas 2 (Fallback): Folder lokal public/uploads
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "File gambar tidak ditemukan." },
        { status: 400 }
      );
    }

    // Validasi tipe file
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: "Format file tidak didukung. Gunakan JPG, PNG, atau WebP." },
        { status: 400 }
      );
    }

    // Batas ukuran 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "Ukuran gambar maksimal 5MB." },
        { status: 400 }
      );
    }

    const originalName = file.name || "photo.jpg";
    const ext = path.extname(originalName).toLowerCase() || ".jpg";
    const randomSuffix = Math.random().toString(36).slice(2, 8);
    const fileName = `cerita-${Date.now()}-${randomSuffix}${ext}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Coba upload ke Supabase Storage (Bucket: cerita-photos)
    if (supabaseAdmin) {
      try {
        const { error: uploadError } = await supabaseAdmin.storage
          .from("cerita-photos")
          .upload(fileName, buffer, {
            contentType: file.type,
            upsert: false,
          });

        if (!uploadError) {
          const { data: publicUrlData } = supabaseAdmin.storage
            .from("cerita-photos")
            .getPublicUrl(fileName);

          if (publicUrlData?.publicUrl) {
            return NextResponse.json({
              url: publicUrlData.publicUrl,
              storage: "supabase",
            });
          }
        } else {
          console.warn("[Supabase Storage Upload Warning]:", uploadError.message);
        }
      } catch (err) {
        console.warn("[Supabase Storage Catch]:", err);
      }
    }

    // 2. Fallback: Simpan ke folder lokal public/uploads
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const localFilePath = path.join(uploadsDir, fileName);
    fs.writeFileSync(localFilePath, buffer);

    const localUrl = `/uploads/${fileName}`;
    return NextResponse.json({
      url: localUrl,
      storage: "local",
    });
  } catch (err) {
    console.error("[POST /api/cerita/upload]:", err);
    return NextResponse.json(
      { error: "Gagal memproses upload gambar." },
      { status: 500 }
    );
  }
}
