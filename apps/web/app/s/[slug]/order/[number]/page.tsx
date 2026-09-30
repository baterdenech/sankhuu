import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { formatMNT, orderStatusLabel } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { ClearCart } from "./clear-cart";

// Захиалгын дугаар + утасны дугаар хоёулаа таарвал л харуулна
export default async function OrderConfirmationPage({ params, searchParams }: { params: Promise<{ slug: string; number: string }>; searchParams: Promise<{ phone?: string }> }) {
  const { slug, number } = await params;
  const { phone } = await searchParams;
  const order = await prisma.order.findFirst({
    where: { number: Number(number) || -1, shop: { slug }, customer: { phone: phone ?? "" } },
    include: { items: true, customer: true, shop: true, delivery: { include: { dropoffAddress: true } } },
  });
  if (!order) notFound();

  return (
    <div className="sf-confirm">
      <ClearCart slug={slug} />
      <div className="sf-check">✓</div>
      <h1>Захиалга хүлээн авлаа</h1>
      <p className="muted">
        Захиалгын дугаар <strong>#{order.number}</strong>. {order.shop.name} таны {formatPhone(order.customer.phone)} дугаар руу удахгүй холбогдоно.
      </p>
      <dl className="sf-summary boxed">
        {order.items.map((i) => (
          <div key={i.id}>
            <dt>
              {i.name} × {i.quantity}
            </dt>
            <dd>{formatMNT(i.unitPrice * i.quantity)}</dd>
          </div>
        ))}
        <div>
          <dt>Хүргэлт</dt>
          <dd>{formatMNT(order.deliveryFee)}</dd>
        </div>
        <div className="total">
          <dt>Нийт (хүргэлтээр төлнө)</dt>
          <dd>{formatMNT(order.total)}</dd>
        </div>
      </dl>
      <p className="small-text">
        <strong>Хаяг:</strong> {order.delivery?.dropoffAddress.district}
        {order.delivery?.dropoffAddress.khoroo ? `, ${order.delivery.dropoffAddress.khoroo}-р хороо` : ""}, {order.delivery?.dropoffAddress.details}
        <br />
        <strong>Төлөв:</strong> {orderStatusLabel[order.status]}
      </p>
      <Link href={`/s/${slug}`} className="btn">
        Дэлгүүр рүү буцах
      </Link>
    </div>
  );
}
