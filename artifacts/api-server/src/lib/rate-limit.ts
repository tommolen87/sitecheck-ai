import type { Request, Response, NextFunction } from "express";

type RateLimitOptions = {
  windowMs: number;
  max: number;
  message: string;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}, 10 * 60 * 1000);

cleanupTimer.unref();

function getClientKey(req: Request): string {
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function rateLimit(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = getClientKey(req);
    const now = Date.now();
    const existing = buckets.get(key);

    const bucket =
      existing && existing.resetAt > now
        ? existing
        : { count: 0, resetAt: now + options.windowMs };

    bucket.count += 1;
    buckets.set(key, bucket);

    const remaining = Math.max(0, options.max - bucket.count);
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((bucket.resetAt - now) / 1000),
    );

    res.setHeader("X-RateLimit-Limit", String(options.max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));

    if (bucket.count > options.max) {
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({ error: options.message });
      return;
    }

    next();
  };
}

export const scanRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Te veel scans aangevraagd. Probeer het later opnieuw.",
});

export const visitorAlertRateLimit = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: "Te veel bezoekmeldingen. Probeer het later opnieuw.",
});

export const checkoutRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: "Te veel betaalpogingen. Probeer het later opnieuw.",
});
