/**
 * ============================================================
 *  AUTH UTILITIES — Admin Panel LUX0RIA
 * ============================================================
 *  - bcrypt password verification
 *  - Edge-compatible Web Crypto HMAC token creation & validation
 *  - Rate limiting (in-memory, per-process)
 * ============================================================
 */
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { createAdminToken, verifyAdminToken } from "./token";
import { getJwtSecret } from "./jwt-secret";

const COOKIE_NAME = "lux0ria_admin_token";

function getAdminPasswordHash(): string {
  return process.env.ADMIN_PASSWORD_HASH || "";
}

/* ── Rate limiting (in-memory) ──────────────────────────── */
const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 15;
const WINDOW_MS = 15 * 60 * 1000; // 15 menit

export function checkRateLimit(ip: string): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
} {
  // Bypass hanya untuk development lokal — jangan pernah bypass di production,
  // termasuk saat IP tidak terdeteksi (itu justru celah untuk brute force).
  if (process.env.NODE_ENV !== "production") {
    return { allowed: true, remaining: 99, resetAt: Date.now() + WINDOW_MS };
  }

  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    return { allowed: true, remaining: MAX_ATTEMPTS, resetAt: now + WINDOW_MS };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  return {
    allowed: true,
    remaining: MAX_ATTEMPTS - entry.count,
    resetAt: entry.resetAt,
  };
}

export function recordFailedAttempt(ip: string): void {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    loginAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count++;
  }
}

export function resetRateLimit(ip: string): void {
  loginAttempts.delete(ip);
}

/* ── Password ───────────────────────────────────────────── */
export async function verifyPassword(password: string): Promise<boolean> {
  const hash = getAdminPasswordHash();
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

/* ── JWT (Web Crypto) ───────────────────────────────────── */
export async function createToken(): Promise<string> {
  const secret = getJwtSecret();
  if (!secret) {
    throw new Error("Admin belum dikonfigurasi: JWT_SECRET kosong.");
  }
  return createAdminToken(secret);
}

export async function verifyToken(token: string): Promise<boolean> {
  const secret = getJwtSecret();
  if (!secret) return false;
  return verifyAdminToken(token, secret);
}

/* ── Cookie helpers ─────────────────────────────────────── */
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 jam
  });
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/* ── Auth check (untuk API routes) ──────────────────────── */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthCookie();
  if (!token) return false;
  return verifyToken(token);
}
