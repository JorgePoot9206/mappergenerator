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
//
//  Providers:
//    anthropic        — user explicitly chose Claude  (1/hr)
//    gemini           — Gemini Flash analysis          (6/hr)
//    gemini-fallback  — Claude called after Gemini failed (2/hr)
// ─────────────────────────────────────────────────────────────

export type Provider = "anthropic" | "gemini" | "gemini-fallback";

export const RATE_COOKIE = "zm_rl_v1";

const SECRET = process.env.RATE_LIMIT_SECRET ?? "zm-change-this-secret-in-production";

export const LIMITS: Record<Provider, { max: number; windowMs: number }> = {
  anthropic:         { max: 1, windowMs: 60 * 60 * 1000 }, // 1 per hour
  gemini:            { max: 6, windowMs: 60 * 60 * 1000 }, // 6 per hour
  "gemini-fallback": { max: 2, windowMs: 60 * 60 * 1000 }, // 2 per hour (Claude backup when Gemini is down)
};

// ── Cookie key per provider ───────────────────────────────────
type CookieKey = "a" | "g" | "gf";

function providerKey(provider: Provider): CookieKey {
  if (provider === "anthropic") return "a";
  if (provider === "gemini")    return "g";
  return "gf";
}

// ── In-memory IP store (best-effort, resets on cold start) ───

interface IPEntry { a: number[]; g: number[]; gf: number[] }
const ipStore = new Map<string, IPEntry>();

function cleanupIPStore() {
  const now = Date.now();
  const maxWindow = Math.max(...Object.values(LIMITS).map((l) => l.windowMs));
  Array.from(ipStore.entries()).forEach(([ip, entry]) => {
    entry.a  = entry.a.filter((t) => now - t < maxWindow);
    entry.g  = entry.g.filter((t) => now - t < maxWindow);
    entry.gf = entry.gf.filter((t) => now - t < maxWindow);
    if (entry.a.length === 0 && entry.g.length === 0 && entry.gf.length === 0) ipStore.delete(ip);
  });
}

// ── Cookie helpers ───────────────────────────────────────────

interface CookieData { ip: string; a: number[]; g: number[]; gf: number[] }

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
  if (sign(payload) !== sig) return null;
  try {
    const d = JSON.parse(Buffer.from(payload, "base64url").toString());
    // Ensure gf exists for old cookies that predate this field
    if (!d.gf) d.gf = [];
    return d;
  } catch {
    return null;
  }
}

// ── IP extraction ─────────────────────────────────────────────

export function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

// ── Main check ───────────────────────────────────────────────

export interface RateLimitResult {
  allowed:     boolean;
  remaining:   number;
  resetMs:     number;
  cookieValue: string; // write this on success
  cookieUndo:  string; // write this if model errors — reverts the recorded usage
}

export function checkRateLimit(req: NextRequest, provider: Provider): RateLimitResult {
  if (process.env.RATE_LIMIT_ENABLED === "false") {
    return { allowed: true, remaining: 999, resetMs: 0, cookieValue: "", cookieUndo: "" };
  }

  const now = Date.now();
  const { max, windowMs } = LIMITS[provider];
  const ip  = getIP(req);
  const key = providerKey(provider);

  if (Math.random() < 0.1) cleanupIPStore();

  // ── Cookie layer ─────────────────────────────────────────
  const rawCookie = req.cookies.get(RATE_COOKIE)?.value ?? "";
  let cookie = decodeCookie(rawCookie);
  if (!cookie || cookie.ip !== ip) {
    cookie = { ip, a: [], g: [], gf: [] };
  }

  cookie.a  = cookie.a.filter((t) => now - t < windowMs);
  cookie.g  = cookie.g.filter((t) => now - t < windowMs);
  cookie.gf = cookie.gf.filter((t) => now - t < windowMs);

  // ── IP layer ─────────────────────────────────────────────
  let ipEntry = ipStore.get(ip) ?? { a: [], g: [], gf: [] };
  ipEntry.a  = ipEntry.a.filter((t) => now - t < windowMs);
  ipEntry.g  = ipEntry.g.filter((t) => now - t < windowMs);
  ipEntry.gf = ipEntry.gf.filter((t) => now - t < windowMs);

  const count = Math.max(cookie[key].length, ipEntry[key].length);

  if (count >= max) {
    const allTs  = [...cookie[key], ...ipEntry[key]];
    const oldest = Math.min(...allTs);
    return {
      allowed:     false,
      remaining:   0,
      resetMs:     Math.max(oldest + windowMs - now, 0),
      cookieValue: encodeCookie(cookie),
      cookieUndo:  encodeCookie(cookie),
    };
  }

  // ── Allowed — record timestamp ────────────────────────────
  const cookieUndo = encodeCookie(cookie);

  cookie[key].push(now);
  ipEntry[key].push(now);
  ipStore.set(ip, ipEntry);

  return {
    allowed:     true,
    remaining:   max - cookie[key].length,
    resetMs:     windowMs,
    cookieValue: encodeCookie(cookie),
    cookieUndo,
  };
}

/**
 * Remove the most recently recorded timestamp for a provider from the in-memory
 * IP store. Call this (along with sending cookieUndo) when a model error means
 * the usage should not count against the rate limit.
 */
export function undoRateLimit(req: NextRequest, provider: Provider): void {
  const ip  = getIP(req);
  const key = providerKey(provider);
  const entry = ipStore.get(ip);
  if (!entry || entry[key].length === 0) return;
  entry[key].pop();
  ipStore.set(ip, entry);
}

/**
 * Read remaining uses without recording anything.
 * Used by the /api/rate-limit/status endpoint.
 */
export function getRateLimitStatus(
  req: NextRequest,
  provider: Provider,
): { remaining: number; max: number } {
  if (process.env.RATE_LIMIT_ENABLED === "false") {
    return { remaining: 999, max: 999 };
  }

  const now = Date.now();
  const { max, windowMs } = LIMITS[provider];
  const ip  = getIP(req);
  const key = providerKey(provider);

  const rawCookie = req.cookies.get(RATE_COOKIE)?.value ?? "";
  const cookie = decodeCookie(rawCookie);

  const cookieCount = cookie && cookie.ip === ip
    ? (cookie[key] ?? []).filter((t: number) => now - t < windowMs).length
    : 0;

  const ipCount = (ipStore.get(ip)?.[key] ?? []).filter((t: number) => now - t < windowMs).length;

  return { remaining: Math.max(0, max - Math.max(cookieCount, ipCount)), max };
}

/** Helper: format milliseconds → human string ("42 min", "1 h 3 min") */
export function formatReset(ms: number): string {
  const totalMin = Math.ceil(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h} h ${m} min` : `${h} h`;
}

/** Apply rate limit cookie to a response Headers object */
export function applyRateCookie(headers: Headers, cookieValue: string) {
  headers.append(
    "Set-Cookie",
    `${RATE_COOKIE}=${cookieValue}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${60 * 60 * 24}`
  );
}
