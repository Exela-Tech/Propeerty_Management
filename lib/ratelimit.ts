import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Initialize Redis client
// If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set,
// rate limiting will fall back to in-memory storage (not recommended for production)
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

// In-memory cache for rate limiting when Redis is not available
// WARNING: This is only suitable for single-instance deployments
// For production with multiple instances, Redis is required
const ephemeralCache = new Map<string, number>()

// Rate limiter for authentication endpoints (sign-up, login)
// 5 attempts per 15 minutes per identifier (IP or email)
export const authRateLimiter = new Ratelimit({
  redis: redis ?? (undefined as any),
  limiter: Ratelimit.slidingWindow(5, "15 m"),
  analytics: true,
  prefix: "@ratelimit/auth",
  ephemeralCache: redis ? undefined : ephemeralCache,
})

// Rate limiter for payment endpoints
// 10 attempts per minute per identifier (user ID)
export const paymentRateLimiter = new Ratelimit({
  redis: redis ?? (undefined as any),
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "@ratelimit/payment",
  ephemeralCache: redis ? undefined : ephemeralCache,
})

// Rate limiter for auth callback (email verification)
// 10 attempts per hour per identifier (IP)
export const authCallbackRateLimiter = new Ratelimit({
  redis: redis ?? (undefined as any),
  limiter: Ratelimit.slidingWindow(10, "1 h"),
  analytics: true,
  prefix: "@ratelimit/auth-callback",
  ephemeralCache: redis ? undefined : ephemeralCache,
})

/**
 * Get identifier for rate limiting
 * For authenticated requests, use user ID
 * For unauthenticated requests, use IP address
 */
export function getRateLimitIdentifier(
  userId?: string | null,
  ipAddress?: string | null
): string {
  if (userId) {
    return `user:${userId}`
  }
  if (ipAddress) {
    return `ip:${ipAddress}`
  }
  // Fallback to a default identifier if neither is available
  return "anonymous"
}

/**
 * Get IP address from request headers
 */
export function getIpAddress(headers: Headers): string | null {
  // Check various headers for IP address (common in proxy/load balancer setups)
  const forwardedFor = headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  const realIp = headers.get("x-real-ip")
  if (realIp) {
    return realIp
  }

  const cfConnectingIp = headers.get("cf-connecting-ip")
  if (cfConnectingIp) {
    return cfConnectingIp
  }

  return null
}
