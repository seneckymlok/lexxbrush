import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";

// The Vercel/Upstash integration sets KV_REST_API_URL/TOKEN. The Upstash SDK
// reads UPSTASH_REDIS_REST_URL/TOKEN, so we pass the values explicitly rather
// than relying on Redis.fromEnv().
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

function makeLimiter(tokens: number, window: Parameters<typeof Ratelimit.slidingWindow>[1], prefix: string) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: true,
    prefix: `lexxbrush:${prefix}`,
  });
}

// 5 messages per 10 minutes per IP - generous for legit users, kills spam loops.
export const contactLimiter = makeLimiter(5, "10 m", "contact");

// 3 newsletter signups per hour per IP - prevents bot floods on the list.
export const newsletterLimiter = makeLimiter(3, "1 h", "newsletter");

// 3 custom-order requests per hour per IP - these are bespoke quote inquiries,
// so legit volume is low and we want to throttle abuse aggressively.
export const customOrderLimiter = makeLimiter(3, "1 h", "custom-order");

// Extracts the caller's IP, preferring Vercel's forwarded headers.
export function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

// Wraps limiter.limit() so callers don't have to null-check. If Upstash isn't
// configured (local dev without env vars), we fail open rather than blocking
// every request.
export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string
): Promise<RateLimitResult> {
  if (!limiter) {
    return { success: true, limit: 0, remaining: 0, reset: 0 };
  }
  return limiter.limit(identifier);
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const retryAfter = Math.max(0, Math.ceil((result.reset - Date.now()) / 1000));
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
    ...(result.success ? {} : { "Retry-After": String(retryAfter) }),
  };
}
