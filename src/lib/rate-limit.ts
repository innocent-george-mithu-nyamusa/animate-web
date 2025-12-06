/**
 * Rate Limiting Utility
 * Prevents abuse and brute force attacks on API endpoints
 * Uses in-memory storage with automatic cleanup
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.requests.entries()) {
        if (now > record.resetTime) {
          this.requests.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request should be rate limited
   * @param identifier - Unique identifier (e.g., IP address, user ID)
   * @param maxRequests - Maximum requests allowed in the window
   * @param windowMs - Time window in milliseconds
   * @returns Object with allowed status and retry info
   */
  checkLimit(
    identifier: string,
    maxRequests: number,
    windowMs: number
  ): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    retryAfter?: number;
  } {
    const now = Date.now();
    const record = this.requests.get(identifier);

    // If no record exists or window has expired, create new record
    if (!record || now > record.resetTime) {
      const resetTime = now + windowMs;
      this.requests.set(identifier, {
        count: 1,
        resetTime,
      });

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetTime,
      };
    }

    // If within window, check if limit exceeded
    if (record.count >= maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        retryAfter,
      };
    }

    // Increment count and allow request
    record.count++;
    this.requests.set(identifier, record);

    return {
      allowed: true,
      remaining: maxRequests - record.count,
      resetTime: record.resetTime,
    };
  }

  /**
   * Clear all rate limit records (useful for testing)
   */
  clear() {
    this.requests.clear();
  }

  /**
   * Clean up resources
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // Authentication endpoints - stricter limits to prevent brute force
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Payment endpoints - moderate limits
  PAYMENT: {
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  },
  // Image processing - stricter to prevent abuse
  IMAGE_PROCESSING: {
    maxRequests: 20,
    windowMs: 60 * 1000, // 1 minute
  },
  // General API - lenient limits
  GENERAL: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
};

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(
  req: Request,
  userId?: string
): string {
  // Prefer user ID if authenticated
  if (userId) {
    return `user:${userId}`;
  }

  // Try to get real IP from headers (for proxied requests)
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const cfConnectingIp = req.headers.get("cf-connecting-ip"); // Cloudflare

  const ip =
    cfConnectingIp ||
    realIp ||
    (forwarded ? forwarded.split(",")[0].trim() : null) ||
    "unknown";

  return `ip:${ip}`;
}

/**
 * Apply rate limiting to an API endpoint
 */
export function rateLimit(
  identifier: string,
  config: { maxRequests: number; windowMs: number }
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
} {
  return rateLimiter.checkLimit(identifier, config.maxRequests, config.windowMs);
}

export default rateLimiter;
