import type { Prisma, OrderStatus } from "@sankhuu/db";
import {
  orderStatusLabel,
  paymentMethodLabel,
  paymentStatusLabel,
} from "./labels";
import { formatPhone } from "./phone";

// ─── Худалдагчийн захиалгын жагсаалтын шүүлт: таб · хайлт · хугацаа (жагсаалт, Excel, хэвлэх хуудас нэг дүрмээр) ───

export const ORDER_TABS: {
  key: string;
  label: string;
  statuses: OrderStatus[];
}[] = [
  {
    key: "open",
    label: "Идэвхтэй",
    statuses: ["NEW", "CONFIRMED", "READY_FOR_PICKUP", "IN_DELIVERY"],
  },
  { key: "done", label: "Дууссан", statuses: ["DELIVERED"] },
  { key: "cancelled", label: "Цуцалсан", statuses: ["CANCELLED", "RETURNED"] },
  {
    key: "all",
    label: "Бүгд",
    statuses: [
      "NEW",
      "CONFIRMED",
      "READY_FOR_PICKUP",
      "IN_DELIVERY",
      "DELIVERED",
      "CANCELLED",
      "RETURNED",
    ],
  },
];

export const RANGES = [
  { key: "all", label: "Бүх хугацаа", days: null },
  { key: "today", label: "Өнөөдөр", days: 0 },
  { key: "7", label: "7 хоног", days: 7 },
  { key: "30", label: "30 хоног", days: 30 },
] as const;
export type RangeKey = (typeof RANGES)[number]["key"];

export type OrderQuery = {
  tab: string;
  q: string;
  range: RangeKey;
  from: string;
  to: string;
  page: number;
};
export const PAGE_SIZE = 50;

const UB = "+08:00";
const dayStart = (ymd: string) => new Date(`${ymd}T00:00:00${UB}`);
const isYmd = (s: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  !Number.isNaN(Date.parse(`${s}T00:00:00${UB}`));
const ubToday = () =>
  new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10);

export function parseOrderQuery(
  sp: Record<string, string | undefined>,
): OrderQuery {
  const from = sp.from && isYmd(sp.from) ? sp.from : "";
  const to = sp.to && isYmd(sp.to) ? sp.to : "";
  return {
    tab: ORDER_TABS.some((t) => t.key === sp.tab) ? sp.tab! : "open",
    q: (sp.q ?? "").trim().slice(0, 60),
    range:
      from || to
        ? "all"
        : ((RANGES.find((r) => r.key === sp.range)?.key ?? "all") as RangeKey),
    from,
    to,
    page: Math.max(1, Math.trunc(Number(sp.page)) || 1),
  };
}

export function orderQueryString(
  oq: Partial<OrderQuery>,
  patch: Partial<OrderQuery> = {},
) {
  const v = { ...oq, ...patch };
  const u = new URLSearchParams();
  if (v.tab && v.tab !== "open") u.set("tab", v.tab);
  if (v.q) u.set("q", v.q);
  if (v.range && v.range !== "all") u.set("range", v.range);
  if (v.from) u.set("from", v.from);
  if (v.to) u.set("to", v.to);
  if (v.page && v.page > 1) u.set("page", String(v.page));
  const s = u.toString();
  return s ? `?${s}` : "";
}

// Огнооны интервал (УБ цагаар): бэлэн сонголт эсвэл from/to
export function orderDateRange(oq: OrderQuery): { gte?: Date; lt?: Date } {
  if (oq.from || oq.to) {
    return {
      ...(oq.from ? { gte: dayStart(oq.from) } : {}),
      ...(oq.to
        ? { lt: new Date(dayStart(oq.to).getTime() + 86_400_000) }
        : {}),
    };
  }
  const r = RANGES.find((x) => x.key === oq.range);
  if (!r || r.days === null) return {};
  const today = dayStart(ubToday());
  return { gte: new Date(today.getTime() - r.days * 86_400_000) };
}

export function orderWhere(
  shopId: string,
  oq: OrderQuery,
): Prisma.OrderWhereInput {
  const tab = ORDER_TABS.find((t) => t.key === oq.tab) ?? ORDER_TABS[0];
  const range = orderDateRange(oq);
  const q = oq.q;
  const digits = q.replace(/[^\d]/g, "");
  const search: Prisma.OrderWhereInput[] = q
    ? [
        { customer: { name: { contains: q, mode: "insensitive" } } },
        ...(digits ? [{ customer: { phone: { contains: digits } } }] : []),
        ...(digits && digits.length <= 9 ? [{ number: Number(digits) }] : []),
        { items: { some: { name: { contains: q, mode: "insensitive" } } } },
      ]
    : [];
  return {
    shopId,
    status: { in: tab.statuses },
    ...(range.gte || range.lt ? { createdAt: range } : {}),
    ...(search.length ? { OR: search } : {}),
  };
}

export const orderInclude = {
  customer: true,
  items: true,
  delivery: {
    include: {
      dropoffAddress: true,
      pickupAddress: true,
      driver: {
        include: {
          user: { select: { name: true, username: true, phone: true } },
        },
      },
    },
  },
} satisfies Prisma.OrderInclude;

export function formatUbDateTime(d: Date) {
  return d.toLocaleString("mn-MN", {
    timeZone: "Asia/Ulaanbaatar",
    dateStyle: "short",
    timeStyle: "short",
  });
}

export type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

// CSV (UTF-8 BOM-той тул Excel кириллийг зөв нээнэ)
export function ordersToCsv(orders: OrderRow[]) {
  const head = [
    "Дугаар",
    "Огноо",
    "Статус",
    "Худалдан авагч",
    "Утас",
    "Дүүрэг",
    "Хороо",
    "Хаяг",
    "Бараа",
    "Барааны дүн",
    "Хүргэлт",
    "Нийт",
    "Төлбөрийн төрөл",
    "Төлбөр",
    "Жолооч",
    "Тайлбар",
  ];
  const rows = orders.map((o) => [
    o.number,
    formatUbDateTime(o.createdAt),
    orderStatusLabel[o.status],
    o.customer.name,
    formatPhone(o.customer.phone),
    o.delivery?.dropoffAddress.district ?? "",
    o.delivery?.dropoffAddress.khoroo ?? "",
    o.delivery?.dropoffAddress.details ?? "",
    o.items.map((i) => `${i.name} × ${i.quantity}`).join("; "),
    o.subtotal,
    o.deliveryFee,
    o.total,
    paymentMethodLabel[o.paymentMethod],
    paymentStatusLabel[o.paymentStatus],
    o.delivery?.driver
      ? (o.delivery.driver.user.name ?? o.delivery.driver.user.username ?? "")
      : "",
    o.note ?? "",
  ]);
  const cell = (v: unknown) => {
    const s = String(v ?? "");
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return (
    "\uFEFF" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n")
  );
}
