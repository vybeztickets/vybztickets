const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidEmail(email: unknown): email is string {
  return typeof email === "string" && EMAIL_RE.test(email.trim());
}

export function isValidUUID(id: unknown): id is string {
  return typeof id === "string" && UUID_RE.test(id);
}

export function isPositiveInt(n: unknown, max = 10): n is number {
  const num = Number(n);
  return Number.isInteger(num) && num >= 1 && num <= max;
}

export function isNonEmptyString(s: unknown): s is string {
  return typeof s === "string" && s.trim().length > 0;
}
