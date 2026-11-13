/**
 * POST /api/admin/logout — Hapus session admin
 */
import { NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST() {
  await clearAuthCookie();
  return NextResponse.json({ success: true });
}
