import { NextRequest, NextResponse } from "next/server";
import { getRateLimitStatus } from "@/lib/rateLimiter";

export interface RateLimitStatusResponse {
  gemini:    { remaining: number; max: number };
  anthropic: { remaining: number; max: number };
  fallback:  { remaining: number; max: number };
}

export async function GET(req: NextRequest) {
  const status: RateLimitStatusResponse = {
    gemini:    getRateLimitStatus(req, "gemini"),
    anthropic: getRateLimitStatus(req, "anthropic"),
    fallback:  getRateLimitStatus(req, "gemini-fallback"),
  };
  return NextResponse.json(status);
}
