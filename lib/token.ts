/**
 * ============================================================
 *  EDGE-COMPATIBLE JWT / HMAC TOKENS
 * ============================================================
 *  Menggunakan Web Crypto API (crypto.subtle) standar W3C
 *  yang didukung 100% di Node.js, Vercel, dan Next.js Edge Runtime.
 * ============================================================
 */

function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getHmacKey(secret: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createAdminToken(secret: string): Promise<string> {
  const enc = new TextEncoder();
  const header = base64UrlEncode(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const payload = base64UrlEncode(
    enc.encode(
      JSON.stringify({
        role: "admin",
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 jam
      })
    )
  );

  const key = await getHmacKey(secret);
  const dataToSign = enc.encode(`${header}.${payload}`);
  const signature = await crypto.subtle.sign("HMAC", key, dataToSign);

  return `${header}.${payload}.${base64UrlEncode(signature)}`;
}

export async function verifyAdminToken(token: string, secret: string): Promise<boolean> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const [header, payload, signature] = parts;
    const enc = new TextEncoder();

    // Verifikasi expiry
    const payloadJson = JSON.parse(new TextDecoder().decode(base64UrlDecode(payload)));
    if (!payloadJson.exp || Date.now() / 1000 > payloadJson.exp) {
      return false;
    }
    if (payloadJson.role !== "admin") {
      return false;
    }

    // Verifikasi signature
    const key = await getHmacKey(secret);
    const dataToVerify = enc.encode(`${header}.${payload}`);
    const sigBytes = base64UrlDecode(signature);

    return await crypto.subtle.verify("HMAC", key, sigBytes as unknown as ArrayBuffer, dataToVerify);
  } catch {
    return false;
  }
}
