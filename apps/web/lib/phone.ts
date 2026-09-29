// Монголын гар утасны дугаарыг Supabase-д хэрэгтэй E.164 (+976XXXXXXXX) хэлбэрт оруулна.
// Буруу дугаар бол null буцаана.
export function normalizeMongolianPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("976")) digits = digits.slice(3);
  if (!/^[5-9]\d{7}$/.test(digits)) return null;
  return `+976${digits}`;
}

// +97699112233 → 9911 2233
export function formatPhone(e164: string): string {
  const local = e164.replace(/^\+?976/, "");
  return local.length === 8 ? `${local.slice(0, 4)} ${local.slice(4)}` : e164;
}
