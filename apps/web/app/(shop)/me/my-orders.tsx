"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMNT, orderStatusLabel } from "@/lib/labels";
import { readSavedOrders } from "../_components/cart-store";
import { ProductImage } from "../_components/product-image";
import { BoxIcon, CheckIcon, ChevronIcon, ClockIcon, TruckIcon } from "../_components/icons";
import { getMyOrders } from "../cart/actions";

type Row = Awaited<ReturnType<typeof getMyOrders>>[number];

// Coupang-ийн "마이쿠팡" маягийн захиалгын явцын мөр: Хүлээгдэж буй → Бэлтгэж буй → Хүргэлтэд → Хүргэгдсэн
const STEPS = [
  { key: "new", label: "Хүлээн авсан", Icon: ClockIcon, statuses: ["NEW"] },
  { key: "prep", label: "Бэлтгэж байна", Icon: BoxIcon, statuses: ["CONFIRMED", "READY_FOR_PICKUP"] },
  { key: "ship", label: "Хүргэлтэд", Icon: TruckIcon, statuses: ["IN_DELIVERY"] },
  { key: "done", label: "Хүргэгдсэн", Icon: CheckIcon, statuses: ["DELIVERED"] },
] as const;

export function MyOrders({ loggedIn = false }: { loggedIn?: boolean }) {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    const saved = readSavedOrders();
    if (saved.length === 0 && !loggedIn) return setRows([]);
    getMyOrders(saved.map((s) => ({ number: s.number, phone: s.phone }))).then(setRows);
  }, []);

  if (rows === null)
    return (
      <div className="skeleton-page">
        <div className="sk sk-banner" />
        <div className="sk sk-line" />
        <div className="sk sk-line short" />
      </div>
    );
  if (rows.length === 0)
    return (
      <div className="empty tall">
        <span className="empty-icon">
          <BoxIcon size={30} />
        </span>
        <p>{loggedIn ? "Захиалга алга." : "Энэ төхөөрөмжөөс өгсөн захиалга алга."}</p>
        <p className="muted small-text">{loggedIn ? "Захиалга өгөхөд энд түүх нь хадгалагдана." : "Нэвтэрвэл бүх төхөөрөмжийн захиалга харагдана."}</p>
        <Link href="/" className="btn primary">
          Бараа үзэх
        </Link>
      </div>
    );

  const counts = STEPS.map((s) => rows.filter((o) => (s.statuses as readonly string[]).includes(o.status)).length);

  return (
    <>
      <section className="order-steps" aria-label="Захиалгын явц">
        {STEPS.map((s, idx) => (
          <div key={s.key} className={`order-step${counts[idx] > 0 ? " on" : ""}`}>
            <span className="order-step-icon">
              <s.Icon size={20} />
              {counts[idx] > 0 && <span className="order-step-n">{counts[idx]}</span>}
            </span>
            <span>{s.label}</span>
          </div>
        ))}
      </section>

      <h2 className="section-title">Захиалгууд</h2>
      <ul className="my-orders">
        {rows.map((o) => (
          <li key={o.number} className="cart-group">
            <div className="my-order-head">
              <span className={`order-status s-${o.status}`}>{orderStatusLabel[o.status]}</span>
              <span className="muted small-text">
                #{o.number} · {new Date(o.createdAt).toLocaleDateString("mn-MN")}
              </span>
            </div>
            <Link href={`/s/${o.shop.slug}`} className="my-order-shop">
              {o.shop.name} <ChevronIcon size={14} />
            </Link>
            <ul className="my-items">
              {o.items.map((i, idx) => (
                <li key={idx} className="my-item">
                  <span className="my-item-media">
                    <ProductImage src={i.image ?? undefined} alt="" category={i.category} />
                  </span>
                  <span className="my-item-body">
                    <span className="cart-line-name">{i.name}</span>
                    <span className="muted small-text">
                      {formatMNT(i.unitPrice)} · {i.quantity} ш
                    </span>
                  </span>
                  {o.status === "DELIVERED" && i.productId && (
                    i.rating ? (
                      <span className="rated">★ {i.rating}</span>
                    ) : (
                      <Link href={`/reviews/new?n=${o.number}&phone=${encodeURIComponent(o.phone)}&product=${i.productId}`} className="btn small outline">
                        Үнэлэх
                      </Link>
                    )
                  )}
                </li>
              ))}
            </ul>
            <div className="my-order-foot">
              <span className="muted small-text">Нийт (хүргэлттэй)</span>
              <strong>{formatMNT(o.total)}</strong>
            </div>
          </li>
        ))}
        <li className="muted small-text pad">Хүргэлтийн явцыг дэлгүүр болон жолооч утсаар мэдэгдэнэ.</li>
      </ul>
    </>
  );
}
