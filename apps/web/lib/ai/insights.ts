import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { prisma } from "@sankhuu/db";
import { aiEnabled } from "./product";

// ─── Худалдагчийн AI дүгнэлт: сүүлийн 30 хоногийн борлуулалтаас зөвлөгөө ───

const Insights = z.object({
  summary: z.string().describe("2-3 өгүүлбэр: энэ сарын гол дүр зураг (монголоор, тоотой)"),
  insights: z.array(z.object({ title: z.string().describe("Богино гарчиг"), detail: z.string().describe("1-2 өгүүлбэр, тоо баримттай") })).min(2).max(5),
  actions: z
    .array(z.object({ label: z.string().describe("Хийх зүйл, товч (жишээ: 'Саарал свитерийг 10% хямдруул')"), detail: z.string().describe("Яагаад, 1 өгүүлбэр"), productId: z.string().nullable().describe("Холбогдох барааны id, байхгүй бол null") }))
    .min(2)
    .max(5),
});
export type ShopInsights = z.infer<typeof Insights> & { generatedAt: string; stats: ShopStats };

export type ShopStats = {
  days: number;
  orders: number;
  delivered: number;
  cancelled: number;
  revenue: number;
  avgOrder: number;
  top: { id: string; name: string; qty: number; revenue: number; stock: number; price: number }[];
  slow: { id: string; name: string; stock: number; price: number; ageDays: number }[];
  lowStock: { id: string; name: string; stock: number }[];
  rating: { count: number; avg: number | null };
  byWeekday: number[]; // Ня..Бя захиалгын тоо
};

export async function collectStats(shopId: string, days = 30): Promise<ShopStats> {
  const since = new Date(Date.now() - days * 86400000);
  const [orders, products] = await Promise.all([
    prisma.order.findMany({ where: { shopId, createdAt: { gte: since } }, select: { status: true, subtotal: true, createdAt: true, items: { select: { productId: true, name: true, quantity: true, unitPrice: true } } } }),
    prisma.product.findMany({ where: { shopId, isActive: true }, select: { id: true, name: true, stock: true, price: true, createdAt: true, ratingCount: true, ratingSum: true } }),
  ]);
  const live = orders.filter((o) => o.status !== "CANCELLED" && o.status !== "RETURNED");
  const byProduct = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const o of live)
    for (const it of o.items) {
      if (!it.productId) continue;
      const g = byProduct.get(it.productId) ?? { name: it.name, qty: 0, revenue: 0 };
      g.qty += it.quantity;
      g.revenue += it.quantity * it.unitPrice;
      byProduct.set(it.productId, g);
    }
  const pById = new Map(products.map((p) => [p.id, p]));
  const top = [...byProduct.entries()]
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 5)
    .map(([id, g]) => ({ id, name: g.name, qty: g.qty, revenue: g.revenue, stock: pById.get(id)?.stock ?? 0, price: pById.get(id)?.price ?? 0 }));
  const slow = products
    .filter((p) => !byProduct.has(p.id) && p.stock > 0)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .slice(0, 5)
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock, price: p.price, ageDays: Math.floor((Date.now() - p.createdAt.getTime()) / 86400000) }));
  const lowStock = products.filter((p) => p.stock <= 3).slice(0, 5).map((p) => ({ id: p.id, name: p.name, stock: p.stock }));
  const rc = products.reduce((s, p) => s + p.ratingCount, 0);
  const rs = products.reduce((s, p) => s + p.ratingSum, 0);
  const byWeekday = [0, 0, 0, 0, 0, 0, 0];
  for (const o of live) byWeekday[o.createdAt.getDay()]++;
  const revenue = live.reduce((s, o) => s + o.subtotal, 0);
  return {
    days,
    orders: orders.length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
    cancelled: orders.filter((o) => o.status === "CANCELLED" || o.status === "RETURNED").length,
    revenue,
    avgOrder: live.length ? Math.round(revenue / live.length) : 0,
    top,
    slow,
    lowStock,
    rating: { count: rc, avg: rc ? Math.round((rs / rc) * 10) / 10 : null },
    byWeekday,
  };
}

const SYSTEM = `Чи Монголын жижиг онлайн дэлгүүрийн борлуулалтын зөвлөх. Худалдагчийн сүүлийн 30 хоногийн тоон мэдээллийг уншаад
монголоор (кирилл) товч, тодорхой, хэрэгжүүлэхэд бэлэн дүгнэлт, зөвлөгөө өг. Тоо баримтыг заавал дурд (₮, ширхэг, %).
Өгөгдөл багатай бол шударгаар хэл, зохиож болохгүй; тэр үед барааны тоо, зураг, тайлбар, хямдрал, хуваалцах гэх мэт эхлэлийн зөвлөгөө өг.
Магтаал, ерөнхий үг хэрэглэхгүй. Барааны id-г зөвхөн өгөгдөлд байгаагаар нь буцаана.`;

// Дэлгүүр бүрт 1 цаг кэшлэнэ (нэг серверийн санах ойд): давтан дарахад зардал гарахгүй
const cache = new Map<string, ShopInsights>();

export async function shopInsights(shopId: string, force = false): Promise<ShopInsights | null> {
  if (!aiEnabled()) return null;
  const hit = cache.get(shopId);
  if (hit && !force && Date.now() - new Date(hit.generatedAt).getTime() < 3600_000) return hit;
  const stats = await collectStats(shopId);
  const client = new Anthropic();
  const res = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 2048,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    output_config: { effort: "low", format: betaZodOutputFormat(Insights) },
    messages: [{ role: "user", content: `Сүүлийн ${stats.days} хоногийн мэдээлэл (JSON):\n${JSON.stringify(stats)}` }],
  });
  if (res.stop_reason === "refusal" || !res.parsed_output) return null;
  const out: ShopInsights = { ...res.parsed_output, generatedAt: new Date().toISOString(), stats };
  cache.set(shopId, out);
  return out;
}
