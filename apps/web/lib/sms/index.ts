import { prisma } from "@sankhuu/db";

// ─── SMS үйлчилгээ үзүүлэгч (солигддог) ─────────────────────────────────────
// SMS_PROVIDER=log (анхдагч): мессежийг DB-д бичээд "илгээсэн" гэж тэмдэглэнэ (туршилт, /admin/sms дээр харагдана)
// SMS_PROVIDER=http: SMS_HTTP_URL руу POST JSON {to, text} (Authorization: Bearer SMS_HTTP_TOKEN); 2xx = илгээгдсэн.
// Жинхэнэ үйлчилгээ (Mobicom, Unitel, messagepro г.м.) нэмэхдээ доор нэг SmsProvider бичээд providerFor()-д нэмнэ.

export type SmsResult = { ok: true; providerId?: string } | { ok: false; error: string };
export interface SmsProvider {
  name: string;
  send(to: string, text: string): Promise<SmsResult>;
}

const logProvider: SmsProvider = {
  name: "log",
  async send(to, text) {
    console.info(`[sms:log] → ${to}: ${text}`);
    return { ok: true, providerId: "log" };
  },
};

const httpProvider: SmsProvider = {
  name: "http",
  async send(to, text) {
    const url = process.env.SMS_HTTP_URL;
    if (!url) return { ok: false, error: "SMS_HTTP_URL тохируулаагүй" };
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(process.env.SMS_HTTP_TOKEN ? { Authorization: `Bearer ${process.env.SMS_HTTP_TOKEN}` } : {}) },
        body: JSON.stringify({ to, text, from: process.env.SMS_SENDER ?? "Sankhuu" }),
        signal: AbortSignal.timeout(10000),
      });
      const body = await res.text().catch(() => "");
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${body.slice(0, 200)}` };
      return { ok: true, providerId: body.slice(0, 100) || undefined };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "Сүлжээний алдаа" };
    }
  },
};

export function providerFor(name = process.env.SMS_PROVIDER ?? "log"): SmsProvider {
  return name === "http" ? httpProvider : logProvider;
}

export function smsMode() {
  return providerFor().name;
}

// Мессежийг DB-д бүртгээд илгээнэ; илгээлт бүтэлгүйтвэл FAILED гэж хадгална (үйлдлийг зогсоохгүй)
export async function sendSms(input: { to: string; text: string; kind: string; orderId?: string | null }) {
  const provider = providerFor();
  const row = await prisma.smsMessage.create({ data: { to: input.to, text: input.text, kind: input.kind, orderId: input.orderId ?? null, provider: provider.name } });
  const r = await provider.send(input.to, input.text);
  await prisma.smsMessage.update({
    where: { id: row.id },
    data: r.ok ? { status: "SENT", sentAt: new Date(), providerId: r.providerId ?? null } : { status: "FAILED", error: r.error },
  });
  return r;
}

// FAILED мессежийг дахин илгээх (админ)
export async function resendSms(id: string) {
  const row = await prisma.smsMessage.findUnique({ where: { id } });
  if (!row) return;
  const provider = providerFor();
  const r = await provider.send(row.to, row.text);
  await prisma.smsMessage.update({
    where: { id },
    data: r.ok ? { status: "SENT", sentAt: new Date(), provider: provider.name, providerId: r.providerId ?? null, error: null } : { status: "FAILED", provider: provider.name, error: r.error },
  });
}
