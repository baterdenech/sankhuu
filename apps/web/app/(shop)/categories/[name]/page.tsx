import { notFound } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { TopBar } from "../../_components/top-bar";
import { ProductCard } from "../../_components/product-card";
import { ALL_CATEGORIES, publicProductWhere, soldCounts } from "../../_components/catalog";

export default async function CategoryPage({ params }: { params: Promise<{ name: string }> }) {
  const name = decodeURIComponent((await params).name);
  if (!(ALL_CATEGORIES as readonly string[]).includes(name)) notFound();
  const products = await prisma.product.findMany({
    where: { ...publicProductWhere, category: name },
    include: { shop: { select: { slug: true, name: true } } },
    orderBy: [{ stock: "desc" }, { createdAt: "desc" }],
    take: 100,
  });
  const sold = await soldCounts(products.map((p) => p.id));
  return (
    <>
      <TopBar title={name} backHref="/categories" />
      {products.length === 0 ? (
        <div className="empty">Энэ ангилалд бараа алга.</div>
      ) : (
        <div className="pgrid pad">
          {products.map((p) => (
            <ProductCard key={p.id} p={{ ...p, sold: sold.get(p.id) }} />
          ))}
        </div>
      )}
    </>
  );
}
