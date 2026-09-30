import Link from "next/link";
import { prisma, type OrderStatus } from "@sankhuu/db";
import { requireShop } from "@/lib/shop";
import { formatMNT, orderStatusLabel } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { OrderActions } from "./order-actions";

const TABS: { key: string; label: string; statuses: OrderStatus[] }[] = [
  { key: "open", label: "Идэвхтэй", statuses: ["NEW", "CONFIRMED", "READY_FOR_PICKUP", "IN_DELIVERY"] },
  { key: "done", label: "Дууссан", statuses: ["DELIVERED"] },
  { key: "cancelled", label: "Цуцалсан", statuses: ["CANCELLED", "RETURNED"] },
];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { shop } = await requireShop();
  const { tab } = await searchParams;
  const current = TABS.find((t) => t.key === tab) ?? TABS[0];

  const orders = await prisma.order.findMany({
    where: { shopId: shop.id, status: { in: current.statuses } },
    include: { customer: true, items: true, delivery: { include: { dropoffAddress: true, driver: { include: { user: { select: { name: true, username: true } } } } } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <div className="page-head">
        <h1>Захиалга</h1>
        <Link href={`/s/${shop.slug}`} target="_blank" className="btn">
          Дэлгүүрээ үзэх ↗
        </Link>
      </div>
      <div className="toolbar">
        {TABS.map((t) => (
          <Link key={t.key} href={`/orders?tab=${t.key}`} className={`chip${current.key === t.key ? " on" : ""}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {orders.length === 0 ? (
        <div className="empty">
          <p>Энд захиалга алга.</p>
          <p className="small-text">
            Худалдан авагчид <code>{`erp.flexlink.mn/s/${shop.slug}`}</code> холбоосоор орж захиална. Холбоосыг харилцагчиддаа хуваалцаарай.
          </p>
        </div>
      ) : (
        <ul className="order-list">
          {orders.map((o) => (
            <li key={o.id} className="order-card">
              <div className="order-head">
                <strong>#{o.number}</strong>
                <span className={`status s-${o.status}`}>{orderStatusLabel[o.status]}</span>
                <span className="muted small-text">{o.createdAt.toLocaleString("mn-MN", { dateStyle: "short", timeStyle: "short" })}</span>
              </div>
              <div className="order-customer">
                {o.customer.name} · <a href={`tel:${o.customer.phone}`}>{formatPhone(o.customer.phone)}</a>
                {o.delivery && (
                  <div className="muted small-text">
                    {o.delivery.dropoffAddress.district}
                    {o.delivery.dropoffAddress.khoroo ? `, ${o.delivery.dropoffAddress.khoroo}-р хороо` : ""}, {o.delivery.dropoffAddress.details}
                  </div>
                )}
                {o.note && <div className="small-text">Тайлбар: {o.note}</div>}
              </div>
              <ul className="order-items">
                {o.items.map((i) => (
                  <li key={i.id}>
                    <span>
                      {i.name} × {i.quantity}
                    </span>
                    <span>{formatMNT(i.unitPrice * i.quantity)}</span>
                  </li>
                ))}
                <li className="total">
                  <span>Нийт (хүргэлт {formatMNT(o.deliveryFee)})</span>
                  <span>{formatMNT(o.total)}</span>
                </li>
              </ul>
              <OrderActions id={o.id} status={o.status} driverName={o.delivery?.driver ? (o.delivery.driver.user.name ?? o.delivery.driver.user.username) : null} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
