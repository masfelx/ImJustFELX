import { NextRequest, NextResponse } from "next/server";
import { editCerita } from "@/lib/cerita";

/**
 * PATCH /api/cerita/[id] — Edit cerita (hanya berlaku dalam batas 10 menit sejak pembuatan)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "ID cerita tidak valid." }, { status: 400 });
    }

    const body = await request.json();
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!content) {
      return NextResponse.json({ error: "Konten cerita tidak boleh kosong." }, { status: 400 });
    }

    if (content.length > 500) {
      return NextResponse.json({ error: "Maksimal 500 karakter." }, { status: 400 });
    }

    const updated = await editCerita(id, content);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Gagal mengedit cerita.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
