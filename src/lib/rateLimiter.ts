import { createHmac } from "crypto";
import type { NextRequest } from "next/server";

// ─────────────────────────────────────────────────────────────
//  Rate Limiter — cookie (HMAC signed) + in-memory IP store
//
//  Two layers:
//    1. Signed cookie  → browser can't forge, tampered = invalid
//    2. In-memory Map  → survives cookie clear (until cold start)
//
//  Both are checked; the higher count wins.
// ─────────────────────────────────────────────────────────────

export type Provider = "anthropic" | "gemini";

export const RATE_COOKIE = "zm_rl_v1";

const SECRET = process.env.RATE_LIMIT_SECRET ?? "zm-change-this-secret-in-production";

export const LIMITS: Record<Provider, { max: number; windowMs: number }> = {
  anthropic: { max: 1,   windowMs: 60 * 60 * 1000 }, // 1 per hour
  gemini:    { max: 4,   windowMs: 60 * 60 * 1000 }, // 4 per hour
};

// ── In-memory IP store (best-effort, resets on cold start) ───

interface IPEntry { a: number[]; g: number[] }
const ipStore = new Map<string, IPEntry>();

function cleanupIPStore(windowMs: number) {
  const now = Date.now();
  Array.from(ipStore.entries()).forEach(([key, entry]) => {
    entry.a = entry.a.filter((t: number) => now - t < windowMs);
    entry.g = entry.g.filter((t: number) => now - t < windowMs);
    if (entry.a.length === 0 && entry.g.length === 0) ipStore.delete(key);
  });
}

// ── Cookie helpers ───────────────────────────────────────────

interface CookieData { ip: string; a: number[]; g: number[] }

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("hex").slice(0, 32);
}

export function encodeCookie(data: CookieData): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeCookie(value: string): CookieData | null {
  const dot = value.lastIndexOf(".");
  if (dot < 0) return null;
  const payload = value.slice(0, dot);
  const sig     = value.slice(dot + 1);
  if (sign(payload) !== sig) return null; // tampered
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString());
  } catch {
    return null;
  }
}

// ── IP extraction ─────────────────────────────────────────────

export function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??   // Cloudflare
    "unknown"
  );
}

// ── Main check ───────────────────────────────────────────────

export interface RateLimitResult {
  allowed:     boolean;
  remaining:   number;
  resetMs:     number;      // ms until oldest call expires
  cookieValue: string;      // always write this back to response
}

export function checkRateLimit(req: NextRequest, provider: Provider): RateLimitResult {
  const now = Date.now();
  const { max, windowMs } = LIMITS[provider];
  const ip  = getIP(req);
  const key = provider === "anthropic" ? "a" : "g";

  // Periodic cleanup
  if (Math.random() < 0.1) cleanupIPStore(windowMs);

  // ── Cookie layer ─────────────────────────────────────────
  const rawCookie = req.cookies.get(RATE_COOKIE)?.value ?? "";
  let cookie = decodeCookie(rawCookie);

  // If missing, corrupted, or IP changed → fresh slate for cookie
  if (!cookie || cookie.ip !== ip) {
    cookie = { ip, a: [], g: [] };
  }

  // Prune old timestamps from cookie
  cookie.a = cookie.a.filter((t) => now - t < windowMs);
  cookie.g = cookie.g.filter((t) => now - t < windowMs);

  // ── IP layer ─────────────────────────────────────────────
  let ipEntry = ipStore.get(ip) ?? { a: [], g: [] };
  ipEntry.a = ipEntry.a.filter((t) => now - t < windowMs);
  ipEntry.g = ipEntry.g.filter((t) => now - t < windowMs);

  // Use the higher count of the two layers
  const cookieCount = cookie[key].length;
  const ipCount     = ipEntry[key].length;
  const count       = Math.max(cookieCount, ipCount);

  if (count >= max) {
    // Find earliest call across both sources
    const allTs = [...cookie[key], ...ipEntry[key]];
    const oldest  = Math.min(...allTs);
    const resetMs = oldest + windowMs - now;

    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(resetMs, 0),
      cookieValue: encodeCookie(cookie),
    };
  }

  // ── Allowed — record timestamp ────────────────────────────
  cookie[key].push(now);
  ipEntry[key].push(now);
  ipStore.set(ip, ipEntry);

  return {
    allowed:     true,
    remaining:   max - cookie[key].length,
    resetMs:     windowMs,
    cookieValue: encodeCookie(cookie),
  };
}

/** Helper: format milliseconds → human string ("42 min", "1 h 3 min") */
export function formatReset(ms: number): string {
  const totalMin = Math.ceil(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

/** Apply rate limit cookie to a NextResponse-like object */
export function applyRateCookie(
  headers: Headers,
  cookieValue: string
) {
  headers.append(
    "Set-Cookie",
    `${RATE_COOKIE}=${cookieValue}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24}`
  );
}
