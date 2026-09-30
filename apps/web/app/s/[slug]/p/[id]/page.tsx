import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { formatMNT } from "@/lib/labels";
import { AddToCart } from "./add-to-cart";

export default async function ProductPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const product = await prisma.product.findFirst({ where: { id, isActive: true, shop: { slug, isActive: true } } });
  if (!product) notFound();

  return (
    <article className="sf-detail">
      <Link href={`/s/${slug}`} className="sf-back">
        ← Бүх бараа
      </Link>
      <div className="sf-detail-media">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0]} alt={product.name} />
        ) : (
          <span className="no-image">Зураггүй</span>
        )}
      </div>
      <div className="sf-detail-body">
        {product.category && <div className="muted small-text">{product.category}</div>}
        <h1>{product.name}</h1>
        <div className="sf-detail-price">{formatMNT(product.price)}</div>
        {product.description && <p className="sf-desc">{product.description}</p>}
        <AddToCart
          slug={slug}
          item={{ productId: product.id, name: product.name, price: product.price, image: product.images[0] ?? null, maxQty: product.stock }}
        />
      </div>
    </article>
  );
}
