import { Request, Response, NextFunction } from 'express';
import { logger } from './logger.js';

interface RateLimitRecord {
  timestamps: number[];
}

export function createRateLimiter(options: {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
}) {
  const windowMs = options.windowMs || 60 * 1000; // 1 minute
  const maxRequests = options.maxRequests || 120;
  const message = options.message || 'Too many requests. Please wait before retrying.';

  const ipRecords = new Map<string, RateLimitRecord>();

  // Background cleanup every 5 minutes to prevent memory leak
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of ipRecords.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);
      if (record.timestamps.length === 0) {
        ipRecords.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  return (req: Request, res: Response, next: NextFunction) => {
    const clientKey = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'anonymous_ip';
    const userId = req.headers['x-user-id'] as string;
    const key = userId ? `user:${userId}` : `ip:${clientKey}`;

    const now = Date.now();
    let record = ipRecords.get(key);

    if (!record) {
      record = { timestamps: [] };
      ipRecords.set(key, record);
    }

    // Filter out timestamps outside the active sliding window
    record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

    const remaining = Math.max(0, maxRequests - record.timestamps.length);
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', remaining.toString());

    if (record.timestamps.length >= maxRequests) {
      const oldest = record.timestamps[0];
      const retryAfterSeconds = Math.ceil((windowMs - (now - oldest)) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds.toString());

      logger.warn('Rate limit exceeded', {
        requestId: (req as any).id,
        userId,
        metadata: { clientKey, requestCount: record.timestamps.length, maxRequests },
      });

      return res.status(429).json({
        error: message,
        retryAfterSeconds,
      });
    }

    record.timestamps.push(now);
    next();
  };
}
