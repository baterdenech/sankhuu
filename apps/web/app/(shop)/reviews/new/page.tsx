import { notFound } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { TopBar } from "../../_components/top-bar";
import { ProductImage } from "../../_components/product-card";
import { ReviewForm } from "./review-form";

export const metadata = { title: "Үнэлгээ өгөх · Sankhuu" };

export default async function NewReviewPage({ searchParams }: { searchParams: Promise<{ n?: string; phone?: string; product?: string }> }) {
  const { n, phone, product: productId } = await searchParams;
  const number = Number(n);
  if (!number || !phone || !productId) notFound();
  const order = await prisma.order.findFirst({
    where: { number, customer: { phone }, items: { some: { productId } } },
    include: { items: { where: { productId }, include: { product: true } }, shop: { select: { name: true } } },
  });
  const item = order?.items[0];
  if (!order || !item) notFound();
  const existing = await prisma.review.findUnique({ where: { orderId_productId: { orderId: order.id, productId } } });

  return (
    <>
      <TopBar title="Үнэлгээ өгөх" backHref="/me" />
      <div className="review-product">
        <div className="cart-line-media">
          <ProductImage src={item.product?.images[0]} alt="" category={item.product?.category} />
        </div>
        <div>
          <div className="cart-line-name">{item.name}</div>
          <div className="muted small-text">
            {order.shop.name} · #{order.number}
          </div>
        </div>
      </div>
      {order.status !== "DELIVERED" ? (
        <div className="empty">Захиалга хүргэгдсэний дараа үнэлгээ өгөх боломжтой.</div>
      ) : existing ? (
        <div className="empty">Та энэ бараанд {existing.rating} од өгсөн байна. Баярлалаа!</div>
      ) : (
        <ReviewForm n={number} phone={phone} productId={productId} />
      )}
    </>
  );
}
