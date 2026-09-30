"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatMNT, orderStatusLabel } from "@/lib/labels";
import { readSavedOrders } from "../_components/cart-store";
import { getMyOrders } from "../cart/actions";

type Row = Awaited<ReturnType<typeof getMyOrders>>[number];

export function MyOrders() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    const saved = readSavedOrders();
    if (saved.length === 0) return setRows([]);
    getMyOrders(saved.map((s) => ({ number: s.number, phone: s.phone }))).then(setRows);
  }, []);

  if (rows === null) return <div className="empty">Уншиж байна…</div>;
  if (rows.length === 0)
    return (
      <div className="empty tall">
        <p>Энэ төхөөрөмжөөс өгсөн захиалга алга.</p>
        <p className="muted small-text">Захиалга өгөхөд энд түүх нь хадгалагдана.</p>
        <Link href="/" className="btn primary">
          Бараа үзэх
        </Link>
      </div>
    );

  return (
    <ul className="my-orders">
      {rows.map((o) => (
        <li key={o.number} className="cart-group">
          <div className="my-order-head">
            <Link href={`/s/${o.shop.slug}`}>{o.shop.name} ›</Link>
            <span className={`status s-${o.status}`}>{orderStatusLabel[o.status]}</span>
          </div>
          <div className="my-order-body">
            <span className="muted small-text">
              #{o.number} · {new Date(o.createdAt).toLocaleDateString("mn-MN")}
            </span>
            <div>{o.items.map((i) => `${i.name} × ${i.quantity}`).join(", ")}</div>
            <strong>{formatMNT(o.total)}</strong>
          </div>
        </li>
      ))}
      <li className="muted small-text pad">Хүргэлтийн явцыг дэлгүүр болон жолооч утсаар мэдэгдэнэ.</li>
    </ul>
  );
}
