// Нэвтрэх нэрийг Supabase-ийн email/password нэвтрэлтэд техникийн имэйл болгон хөрвүүлнэ.
export const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
const DOMAIN = "login.sankhuu.mn";

export function normalizeUsername(input: string): string | null {
  const u = input.trim().toLowerCase();
  return USERNAME_RE.test(u) ? u : null;
}

export function usernameToEmail(username: string) {
  return `${username}@${DOMAIN}`;
}

export function emailToUsername(email: string | undefined | null): string | null {
  if (!email) return null;
  const [local, domain] = email.split("@");
  return domain === DOMAIN && USERNAME_RE.test(local) ? local : null;
}
