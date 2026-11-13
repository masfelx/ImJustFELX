/**
 * ============================================================
 *  MIDDLEWARE — Proteksi route admin (Edge Runtime Compatible)
 * ============================================================
 *  - /admin/dashboard/* → cek JWT cookie, redirect ke /admin jika tidak valid
 *  - /api/admin/* (kecuali /api/admin/login) → return 401 jika tidak valid
 * ============================================================
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyAdminToken } from "@/lib/token";

const COOKIE_NAME = "lux0ria_admin_token";

function getJwtSecret(): string {
  return process.env.JWT_SECRET || "default_lux0ria_jwt_secret_fallback_key_2026";
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const isValid = token ? await verifyAdminToken(token, getJwtSecret()) : false;

  // Halaman admin dashboard — redirect ke login jika tidak terautentikasi
  if (pathname.startsWith("/admin/dashboard")) {
    if (!isValid) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.next();
  }

  // API admin (kecuali login) — return 401
  if (pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/login")) {
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Halaman login admin — redirect ke dashboard jika sudah login
  if (pathname === "/admin") {
    if (isValid) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/api/admin/:path*"],
};
