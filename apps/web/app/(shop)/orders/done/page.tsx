import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { formatMNT } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { CheckIcon } from "../../_components/icons";
import { AfterOrder } from "./after-order";

export default async function OrdersDonePage({ searchParams }: { searchParams: Promise<{ n?: string; phone?: string }> }) {
  const { n, phone } = await searchParams;
  const numbers = (n ?? "").split(",").map(Number).filter((x) => Number.isInteger(x) && x > 0);
  if (numbers.length === 0 || !phone) notFound();
  const orders = await prisma.order.findMany({
    where: { number: { in: numbers }, customer: { phone } },
    include: { items: true, shop: { select: { name: true } } },
    orderBy: { number: "asc" },
  });
  if (orders.length === 0) notFound();
  const total = orders.reduce((s, o) => s + o.total, 0);

  return (
    <div className="done">
      <AfterOrder orders={orders.map((o) => ({ number: o.number, phone }))} />
      <div className="done-check">
        <CheckIcon size={32} />
      </div>
      <h1>Захиалга хүлээн авлаа</h1>
      <p className="muted">
        {orders.length > 1 ? `${orders.length} дэлгүүрээс ${orders.length} захиалга үүслээ.` : "Дэлгүүр"} {formatPhone(phone)} дугаар руу удахгүй холбогдоно.
      </p>
      {orders.map((o) => (
        <section key={o.id} className="cart-group">
          <div className="cart-group-head static">
            #{o.number} · {o.shop.name}
          </div>
          <ul className="done-items">
            {o.items.map((i) => (
              <li key={i.id}>
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>{formatMNT(i.unitPrice * i.quantity)}</span>
              </li>
            ))}
            <li>
              <span>Хүргэлт</span>
              <span>{formatMNT(o.deliveryFee)}</span>
            </li>
            <li className="total">
              <span>Нийт</span>
              <span>{formatMNT(o.total)}</span>
            </li>
          </ul>
        </section>
      ))}
      {orders.length > 1 && (
        <p className="done-total">
          Бүгд: <strong>{formatMNT(total)}</strong> (хүргэлтээр төлнө)
        </p>
      )}
      <div className="done-actions">
        <Link href="/me" className="btn">
          Захиалгаа хянах
        </Link>
        <Link href="/" className="btn primary">
          Үргэлжлүүлэн үзэх
        </Link>
      </div>
    </div>
  );
}
