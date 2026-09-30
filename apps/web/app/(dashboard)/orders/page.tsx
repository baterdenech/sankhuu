import Link from "next/link";
import { prisma } from "@sankhuu/db";
import { requireShop } from "@/lib/shop";
import { formatMNT, orderStatusLabel, paymentMethodLabel } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import {
  ORDER_TABS,
  PAGE_SIZE,
  RANGES,
  formatUbDateTime,
  orderInclude,
  orderQueryString,
  orderWhere,
  parseOrderQuery,
} from "@/lib/order-query";
import { OrderActions } from "./order-actions";

type SP = {
  tab?: string;
  q?: string;
  range?: string;
  from?: string;
  to?: string;
  page?: string;
};

// Захиалгын жагсаалт: таб · хайлт (дугаар, нэр, утас, бараа) · хугацаа · Excel · хүргэлтийн хуудас хэвлэх · хуудаслалт
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { shop } = await requireShop();
  const oq = parseOrderQuery(await searchParams);
  const where = orderWhere(shop.id, oq);
  const [orders, total, sum] = await Promise.all([
    prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      skip: (oq.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
    prisma.order.aggregate({
      where: { ...where, status: { notIn: ["CANCELLED", "RETURNED"] } },
      _sum: { subtotal: true },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = orderQueryString(oq, { page: 1 });
  const hasFilter = Boolean(oq.q || oq.range !== "all" || oq.from || oq.to);

  return (
    <>
      <div className="page-head">
        <h1>Захиалга</h1>
        <div className="actions">
          <Link href={`/s/${shop.slug}`} target="_blank" className="btn">
            Дэлгүүрээ үзэх ↗
          </Link>
          <Link href="/orders/new" className="btn primary">
            + Захиалга бүртгэх
          </Link>
        </div>
      </div>

      <div className="toolbar">
        {ORDER_TABS.map((t) => (
          <Link
            key={t.key}
            href={`/orders${orderQueryString(oq, { tab: t.key, page: 1 })}`}
            className={`chip${oq.tab === t.key ? " on" : ""}`}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <form className="toolbar order-filters" action="/orders">
        {oq.tab !== "open" && <input type="hidden" name="tab" value={oq.tab} />}
        <input
          type="search"
          name="q"
          defaultValue={oq.q}
          placeholder="Дугаар, нэр, утас, бараагаар хайх…"
          aria-label="Хайх"
        />
        <div className="range-chips">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/orders${orderQueryString(oq, { range: r.key, from: "", to: "", page: 1 })}`}
              className={`chip${oq.range === r.key && !oq.from && !oq.to ? " on" : ""}`}
            >
              {r.label}
            </Link>
          ))}
        </div>
        <label className="date-field">
          <span>Эхлэх</span>
          <input type="date" name="from" defaultValue={oq.from} />
        </label>
        <label className="date-field">
          <span>Дуусах</span>
          <input type="date" name="to" defaultValue={oq.to} />
        </label>
        <button type="submit" className="btn">
          Шүүх
        </button>
        {hasFilter && (
          <Link
            href={`/orders${orderQueryString({ tab: oq.tab })}`}
            className="link-button"
          >
            Цэвэрлэх
          </Link>
        )}
      </form>

      <div className="order-summary-bar">
        <span>
          <strong>{total}</strong> захиалга
          {sum._sum.subtotal ? (
            <>
              {" "}
              · борлуулалт <strong>{formatMNT(sum._sum.subtotal)}</strong>
            </>
          ) : null}
          {oq.q ? <> · «{oq.q}»</> : null}
        </span>
        {total > 0 && (
          <span className="order-tools">
            <a href={`/orders/export${qs}`} className="btn small">
              Excel татах
            </a>
            <a
              href={`/print/orders${qs}`}
              target="_blank"
              className="btn small"
            >
              Хүргэлтийн хуудас хэвлэх ({Math.min(total, 100)})
            </a>
          </span>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="empty">
          <p>
            {hasFilter
              ? "Шүүлтэд тохирох захиалга алга."
              : "Энд захиалга алга."}
          </p>
          {!hasFilter && (
            <p className="small-text">
              Худалдан авагчид <code>{`erp.flexlink.mn/s/${shop.slug}`}</code>{" "}
              холбоосоор орж захиална. Холбоосыг харилцагчиддаа хуваалцаарай.
            </p>
          )}
        </div>
      ) : (
        <ul className="order-list">
          {orders.map((o) => (
            <li key={o.id} className="order-card">
              <div className="order-head">
                <strong>#{o.number}</strong>
                <span className={`status s-${o.status}`}>
                  {orderStatusLabel[o.status]}
                </span>
                <span className="muted small-text">
                  {formatUbDateTime(o.createdAt)}
                </span>
                <span className="muted small-text">
                  {paymentMethodLabel[o.paymentMethod]}
                </span>
                <a
                  href={`/print/orders?id=${o.id}`}
                  target="_blank"
                  className="link-button small-text order-print"
                >
                  Хэвлэх ↗
                </a>
              </div>
              <div className="order-customer">
                {o.customer.name} ·{" "}
                <a href={`tel:${o.customer.phone}`}>
                  {formatPhone(o.customer.phone)}
                </a>
                {o.delivery && (
                  <div className="muted small-text">
                    {o.delivery.dropoffAddress.district}
                    {o.delivery.dropoffAddress.khoroo
                      ? `, ${o.delivery.dropoffAddress.khoroo}-р хороо`
                      : ""}
                    , {o.delivery.dropoffAddress.details}
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
              <OrderActions
                id={o.id}
                status={o.status}
                driverName={
                  o.delivery?.driver
                    ? (o.delivery.driver.user.name ??
                      o.delivery.driver.user.username)
                    : null
                }
              />
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav className="pagination" aria-label="Хуудас">
          {oq.page > 1 ? (
            <Link
              href={`/orders${orderQueryString(oq, { page: oq.page - 1 })}`}
              className="btn small"
            >
              ‹ Өмнөх
            </Link>
          ) : (
            <span />
          )}
          <span className="muted small-text">
            {oq.page} / {pages}
          </span>
          {oq.page < pages ? (
            <Link
              href={`/orders${orderQueryString(oq, { page: oq.page + 1 })}`}
              className="btn small"
            >
              Дараах ›
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}
