/**
 * POST /api/cerita/reply — Kirim balasan ke sebuah cerita (publik)
 */
import { NextRequest, NextResponse } from "next/server";
import { createReply, CeritaStorageError } from "@/lib/cerita";

const replyRateLimit = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const storyId = typeof body.story_id === "string" ? body.story_id.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!storyId) {
      return NextResponse.json(
        { error: "ID cerita tujuan wajib diisi." },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "Balasan tidak boleh kosong." },
        { status: 400 }
      );
    }

    if (content.length > 300) {
      return NextResponse.json(
        { error: "Balasan maksimal 300 karakter." },
        { status: 400 }
      );
    }

    // Rate limiting sederhana
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const lastReply = replyRateLimit.get(ip) || 0;
    const now = Date.now();
    const cooldown = process.env.NODE_ENV === "development" ? 3_000 : 10_000;

    if (now - lastReply < cooldown) {
      const wait = Math.ceil((cooldown - (now - lastReply)) / 1000);
      return NextResponse.json(
        { error: `Tunggu ${wait} detik sebelum membalas lagi.` },
        { status: 429 }
      );
    }

    replyRateLimit.set(ip, now);

    const reply = await createReply({
      story_id: storyId,
      author_name: typeof body.author_name === "string" ? body.author_name : undefined,
      content,
    });

    if (!reply) {
      return NextResponse.json(
        { error: "Cerita tidak ditemukan." },
        { status: 404 }
      );
    }

    return NextResponse.json(reply, { status: 201 });
  } catch (err) {
    console.error("[POST /api/cerita/reply]:", err);
    if (err instanceof CeritaStorageError) {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Gagal mengirim balasan." },
      { status: 500 }
    );
  }
}
