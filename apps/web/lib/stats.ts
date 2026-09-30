import { prisma } from "@sankhuu/db";
import type { OrderStatus } from "@sankhuu/db";

// ─── Худалдагчийн статистик: сонгосон хугацааны борлуулалтыг график, хүснэгтэд бэлтгэнэ ───

export const STATS_PRESETS = [7, 30, 90] as const;
export type StatsDays = (typeof STATS_PRESETS)[number];

const UB_OFFSET_MS = 8 * 3600_000; // Улаанбаатар UTC+8, зуны цаг байхгүй
const DAY_MS = 86_400_000;

// Огноог УБ цагаар "YYYY-MM-DD" болгоно
export function ubDayKey(d: Date) {
  return new Date(d.getTime() + UB_OFFSET_MS).toISOString().slice(0, 10);
}

export type DayPoint = {
  key: string;
  label: string;
  revenue: number;
  orders: number;
};
export type Kpi = { value: number; prev: number; delta: number | null }; // delta: өмнөх үетэй харьцуулсан %, өмнөх 0 бол null
export type TopProduct = {
  id: string | null;
  name: string;
  qty: number;
  revenue: number;
};
export type StatusGroup = {
  key: "done" | "active" | "cancelled";
  label: string;
  count: number;
  statuses: { status: OrderStatus; count: number }[];
};

export type SellerStats = {
  days: number;
  from: string; // УБ огноо
  to: string;
  revenue: Kpi;
  orders: Kpi;
  avgOrder: Kpi;
  deliveredRate: Kpi; // %
  daily: DayPoint[];
  weekday: { label: string; orders: number; revenue: number }[]; // Даваагаас эхэлнэ
  top: TopProduct[];
  status: StatusGroup[];
  rating: { count: number; avg: number | null };
};

const WEEKDAYS = ["Ня", "Да", "Мя", "Лх", "Пү", "Ба", "Бя"]; // getDay() дараалал

function kpi(value: number, prev: number): Kpi {
  return {
    value,
    prev,
    delta: prev > 0 ? Math.round(((value - prev) / prev) * 100) : null,
  };
}

const LIVE = (s: OrderStatus) => s !== "CANCELLED" && s !== "RETURNED";

export async function sellerStats(
  shopId: string,
  days: number,
): Promise<SellerStats> {
  const todayKey = ubDayKey(new Date());
  const todayStart = Date.parse(`${todayKey}T00:00:00+08:00`);
  const since = todayStart - (days - 1) * DAY_MS;
  const prevSince = since - days * DAY_MS;

  const [orders, products] = await Promise.all([
    prisma.order.findMany({
      where: { shopId, createdAt: { gte: new Date(prevSince) } },
      select: {
        status: true,
        subtotal: true,
        createdAt: true,
        items: {
          select: {
            productId: true,
            name: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { shopId, isActive: true },
      select: { ratingCount: true, ratingSum: true },
    }),
  ]);

  const current = orders.filter((o) => o.createdAt.getTime() >= since);
  const previous = orders.filter((o) => o.createdAt.getTime() < since);
  const sum = (list: typeof orders) =>
    list.filter((o) => LIVE(o.status)).reduce((s, o) => s + o.subtotal, 0);
  const liveCount = (list: typeof orders) =>
    list.filter((o) => LIVE(o.status)).length;
  const deliveredPct = (list: typeof orders) =>
    list.length
      ? Math.round(
          (list.filter((o) => o.status === "DELIVERED").length / list.length) *
            100,
        )
      : 0;

  // Өдөр бүрийн цуврал: захиалгагүй өдрийг 0-ээр дүүргэнэ
  const byDay = new Map<string, DayPoint>();
  for (let i = 0; i < days; i++) {
    const key = ubDayKey(new Date(since + i * DAY_MS));
    byDay.set(key, {
      key,
      label: `${key.slice(5, 7)}.${key.slice(8, 10)}`,
      revenue: 0,
      orders: 0,
    });
  }
  const weekday = WEEKDAYS.map((label) => ({ label, orders: 0, revenue: 0 }));
  const byProduct = new Map<string, TopProduct>();
  const byStatus = new Map<OrderStatus, number>();

  for (const o of current) {
    byStatus.set(o.status, (byStatus.get(o.status) ?? 0) + 1);
    if (!LIVE(o.status)) continue;
    const p = byDay.get(ubDayKey(o.createdAt));
    if (p) {
      p.orders++;
      p.revenue += o.subtotal;
    }
    const w =
      weekday[new Date(o.createdAt.getTime() + UB_OFFSET_MS).getUTCDay()];
    w.orders++;
    w.revenue += o.subtotal;
    for (const it of o.items) {
      const id = it.productId ?? `name:${it.name}`;
      const g = byProduct.get(id) ?? {
        id: it.productId,
        name: it.name,
        qty: 0,
        revenue: 0,
      };
      g.qty += it.quantity;
      g.revenue += it.quantity * it.unitPrice;
      byProduct.set(id, g);
    }
  }

  const group = (
    key: StatusGroup["key"],
    label: string,
    statuses: OrderStatus[],
  ): StatusGroup => {
    const rows = statuses
      .map((status) => ({ status, count: byStatus.get(status) ?? 0 }))
      .filter((r) => r.count > 0);
    return {
      key,
      label,
      count: rows.reduce((s, r) => s + r.count, 0),
      statuses: rows,
    };
  };

  const rc = products.reduce((s, p) => s + p.ratingCount, 0);
  const rs = products.reduce((s, p) => s + p.ratingSum, 0);

  return {
    days,
    from: ubDayKey(new Date(since)),
    to: todayKey,
    revenue: kpi(sum(current), sum(previous)),
    orders: kpi(current.length, previous.length),
    avgOrder: kpi(
      liveCount(current) ? Math.round(sum(current) / liveCount(current)) : 0,
      liveCount(previous) ? Math.round(sum(previous) / liveCount(previous)) : 0,
    ),
    deliveredRate: kpi(deliveredPct(current), deliveredPct(previous)),
    daily: [...byDay.values()],
    weekday: [...weekday.slice(1), weekday[0]], // Даваагаас эхлүүлнэ
    top: [...byProduct.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8),
    status: [
      group("done", "Хүргэгдсэн", ["DELIVERED"]),
      group("active", "Явагдаж буй", [
        "NEW",
        "CONFIRMED",
        "READY_FOR_PICKUP",
        "IN_DELIVERY",
      ]),
      group("cancelled", "Цуцлагдсан", ["CANCELLED", "RETURNED"]),
    ],
    rating: { count: rc, avg: rc ? Math.round((rs / rc) * 10) / 10 : null },
  };
}

// Тэнхлэгийн дээд утгыг 1·2·5 × 10ⁿ хэлбэрээр "цэвэр" тоо болгоно
export function niceMax(max: number) {
  if (max <= 0) return 1;
  const pow = 10 ** Math.floor(Math.log10(max));
  for (const m of [1, 2, 2.5, 5, 10]) if (max <= m * pow) return m * pow;
  return 10 * pow;
}

// Тэнхлэгийн товч тоо: 1 200 000 → "1.2 сая", 350 000 → "350 мянга"
export function compactNumber(n: number) {
  if (n >= 1_000_000) return `${trim(n / 1_000_000)} сая`;
  if (n >= 1_000) return `${trim(n / 1_000)} мянга`;
  return String(n);
}
function trim(x: number) {
  return (Math.round(x * 10) / 10).toString();
}
