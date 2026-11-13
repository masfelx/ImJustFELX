/**
 * POST /api/admin/login — Autentikasi admin
 */
import { NextRequest, NextResponse } from "next/server";
import {
  verifyPassword,
  createToken,
  setAuthCookie,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      { error: "Terlalu banyak percobaan salah. Coba lagi nanti.", retryAfter },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { password } = body;

    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password diperlukan." }, { status: 400 });
    }

    const valid = await verifyPassword(password);
    if (!valid) {
      recordFailedAttempt(ip);
      return NextResponse.json(
        { error: "Password salah.", remaining: rateLimit.remaining - 1 },
        { status: 401 }
      );
    }

    // Berhasil login: reset rate limit & set cookie
    resetRateLimit(ip);
    const token = await createToken();
    await setAuthCookie(token);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Request tidak valid." }, { status: 400 });
  }
}
