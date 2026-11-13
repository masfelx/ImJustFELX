/**
 * DELETE /api/admin/cerita/[id] — Hapus cerita (admin only, protected by middleware)
 */
import { NextRequest, NextResponse } from "next/server";
import { deleteCerita } from "@/lib/cerita";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "ID wajib." }, { status: 400 });
    }

    const success = await deleteCerita(id);

    if (!success) {
      return NextResponse.json(
        { error: "Cerita tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/admin/cerita]:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Gagal menghapus cerita.",
      },
      { status: 500 }
    );
  }
}
