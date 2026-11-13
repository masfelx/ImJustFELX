/**
 * POST /api/cerita/like — Tambah like pada cerita (publik)
 */
import { NextRequest, NextResponse } from "next/server";
import { likeCerita } from "@/lib/cerita";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : String(body.id || "");

    if (!id) {
      return NextResponse.json({ error: "ID cerita wajib." }, { status: 400 });
    }

    const newLikes = await likeCerita(id);
    return NextResponse.json({ likes: newLikes });
  } catch (err) {
    console.error("[POST /api/cerita/like]:", err);
    return NextResponse.json(
      { error: "Gagal menambah like." },
      { status: 500 }
    );
  }
}
