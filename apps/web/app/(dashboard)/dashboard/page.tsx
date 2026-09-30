import Link from "next/link";
import { prisma } from "@sankhuu/db";
import { requireShop } from "@/lib/shop";
import { formatMNT, LOW_STOCK } from "@/lib/labels";
import { aiEnabled } from "@/lib/ai/product";
import { Insights } from "./insights";

export default async function DashboardPage() {
  const { shop } = await requireShop();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [productCount, lowStock, todayOrders, todaySales, inDelivery] = await Promise.all([
    prisma.product.count({ where: { shopId: shop.id, isActive: true } }),
    prisma.product.count({ where: { shopId: shop.id, isActive: true, stock: { lte: LOW_STOCK } } }),
    prisma.order.count({ where: { shopId: shop.id, createdAt: { gte: startOfDay }, status: { not: "CANCELLED" } } }),
    prisma.order.aggregate({
      _sum: { subtotal: true },
      where: { shopId: shop.id, createdAt: { gte: startOfDay }, status: { not: "CANCELLED" } },
    }),
    prisma.order.count({ where: { shopId: shop.id, status: "IN_DELIVERY" } }),
  ]);

  const stats = [
    { label: "Өнөөдрийн захиалга", value: String(todayOrders), href: "/orders" },
    { label: "Өнөөдрийн борлуулалт", value: formatMNT(todaySales._sum.subtotal ?? 0), href: "/orders" },
    { label: "Хүргэлтэд гарсан", value: String(inDelivery), href: "/deliveries" },
    { label: "Идэвхтэй бараа", value: String(productCount), href: "/products" },
    { label: "Дуусч буй бараа", value: String(lowStock), href: "/products?filter=low", warn: lowStock > 0 },
  ];

  return (
    <>
      <div className="page-head">
        <h1>Хянах самбар</h1>
        <div className="actions">
          <Link href={`/s/${shop.slug}`} target="_blank" className="btn">
            Дэлгүүрээ үзэх ↗
          </Link>
          <Link href="/orders/new" className="btn">
            + Захиалга бүртгэх
          </Link>
          <Link href="/products/new" className="btn primary">
            + Бараа нэмэх
          </Link>
        </div>
      </div>
      <p className="share-link">
        Худалдан авагчдад өгөх холбоос: <code>erp.flexlink.mn/s/{shop.slug}</code>
      </p>
      <div className="cards">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`card${s.warn ? " warn" : ""}`}>
            <div className="label">{s.label}</div>
            <div className="value">{s.value}</div>
          </Link>
        ))}
      </div>
      {aiEnabled() && productCount > 0 && <Insights />}
      {productCount === 0 && (
        <div className="empty" style={{ marginTop: 16 }}>
          <p>Эхний бараагаа нэмээрэй. Зургийг нь оруулахад нэр, тайлбарыг AI бөглөж өгнө.</p>
          <Link href="/products/new" className="btn primary">
            Эхний бараагаа нэмэх
          </Link>
        </div>
      )}
    </>
  );
}
