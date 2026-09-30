import type { Prisma } from "@sankhuu/db";
import { formatMNT, paymentMethodLabel } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { formatUbDateTime, type orderInclude } from "@/lib/order-query";

export type SlipOrder = Prisma.OrderGetPayload<{
  include: typeof orderInclude;
}>;

// Нэг захиалгын хүргэлтийн хуудас (148×~120мм): дэлгүүр, дугаар, хүлээн авагч, хаяг, бараа, дүн, жолооч авах дүн, гарын үсэг
export function OrderSlip({
  shop,
  order: o,
}: {
  shop: { name: string; phone: string };
  order: SlipOrder;
}) {
  const a = o.delivery?.dropoffAddress;
  const cod =
    o.delivery?.codAmount ??
    (o.paymentMethod === "PREPAID_TRANSFER" ? 0 : o.total);
  return (
    <article className="slip">
      <header className="slip-head">
        <div>
          <strong className="slip-shop">{shop.name}</strong>
          <div className="slip-muted">{formatPhone(shop.phone)}</div>
        </div>
        <div className="slip-no">
          <span>Захиалга</span>
          <strong>#{o.number}</strong>
          <span className="slip-muted">{formatUbDateTime(o.createdAt)}</span>
        </div>
      </header>

      <section className="slip-to">
        <div className="slip-label">Хүлээн авагч</div>
        <div className="slip-name">{o.customer.name}</div>
        <div className="slip-phone">{formatPhone(o.customer.phone)}</div>
        {a && (
          <div className="slip-addr">
            {a.district}
            {a.khoroo ? `, ${a.khoroo}-р хороо` : ""}
            <br />
            {a.details}
          </div>
        )}
        {o.note && <div className="slip-note">Тайлбар: {o.note}</div>}
      </section>

      <table className="slip-items">
        <thead>
          <tr>
            <th>Бараа</th>
            <th className="num">Тоо</th>
            <th className="num">Дүн</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i) => (
            <tr key={i.id}>
              <td>{i.name}</td>
              <td className="num">{i.quantity}</td>
              <td className="num">{formatMNT(i.unitPrice * i.quantity)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2}>Бараа</td>
            <td className="num">{formatMNT(o.subtotal)}</td>
          </tr>
          <tr>
            <td colSpan={2}>Хүргэлт</td>
            <td className="num">{formatMNT(o.deliveryFee)}</td>
          </tr>
          <tr className="slip-total">
            <td colSpan={2}>Нийт</td>
            <td className="num">{formatMNT(o.total)}</td>
          </tr>
        </tfoot>
      </table>

      <section className="slip-pay">
        <div>
          <span className="slip-label">Төлбөр</span>
          <strong>{paymentMethodLabel[o.paymentMethod]}</strong>
        </div>
        <div className={cod > 0 ? "slip-cod" : "slip-paid"}>
          <span className="slip-label">Жолооч авах дүн</span>
          <strong>{cod > 0 ? formatMNT(cod) : "Төлсөн · 0₮"}</strong>
        </div>
      </section>

      <footer className="slip-foot">
        <span>Хүлээлгэн өгсөн: ____________</span>
        <span>Хүлээн авсан: ____________</span>
        <span className="slip-muted">Sankhuu хүргэлт · erp.flexlink.mn</span>
      </footer>
    </article>
  );
}
