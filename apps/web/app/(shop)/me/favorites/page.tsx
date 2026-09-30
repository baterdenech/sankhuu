import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { getCurrentUser } from "@/lib/auth";
import { TopBar } from "../../_components/top-bar";
import { ProductCard } from "../../_components/product-card";
import { soldCounts } from "../../_components/catalog";
import { HeartIcon } from "../../_components/catalog-icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Дуртай бараа · Sankhuu" };

export default async function FavoritesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?mode=password&next=/me/favorites");
  const favs = await prisma.favorite.findMany({
    where: { userId: user.id, product: { isActive: true, shop: { isActive: true } } },
    include: { product: { include: { shop: { select: { slug: true, name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  const products = favs.map((f) => f.product);
  const sold = await soldCounts(products.map((p) => p.id));
  return (
    <>
      <TopBar title="Дуртай бараа" backHref="/me" />
      {products.length === 0 ? (
        <div className="empty tall">
          <span className="empty-icon">
            <HeartIcon size={30} />
          </span>
          <p>Дуртай бараа алга.</p>
          <p className="muted small-text">Барааны зурган дээрх зүрхийг дарж хадгална.</p>
          <Link href="/" className="btn primary">
            Бараа үзэх
          </Link>
        </div>
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
