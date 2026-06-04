type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

function getIP(req: Request): string {
  const h = (req as any).headers;
  return (
    h.get?.("x-forwarded-for")?.split(",")[0].trim() ??
    h.get?.("x-real-ip") ??
    "unknown"
  );
}

/**
 * Returns true if the request is allowed, false if rate-limited.
 * key     — unique bucket name (e.g. "purchase")
 * ip      — client IP
 * limit   — max requests in the window
 * windowMs — window duration in milliseconds
 */
export function checkRateLimit(
  key: string,
  ip: string,
  limit: number,
  windowMs: number
): boolean {
  const bucketKey = `${key}:${ip}`;
  const now = Date.now();
  const entry = store.get(bucketKey);

  if (!entry || now > entry.resetAt) {
    store.set(bucketKey, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}

export function rateLimitedResponse() {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": "60",
      },
    }
  );
}

export { getIP };
