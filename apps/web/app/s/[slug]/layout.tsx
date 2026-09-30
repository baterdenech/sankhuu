import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@sankhuu/db";
import { formatPhone } from "@/lib/phone";
import { CartButton } from "./cart-button";

async function getShop(slug: string) {
  return prisma.shop.findFirst({ where: { slug, isActive: true } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const shop = await getShop((await params).slug);
  return { title: shop ? `${shop.name} · Sankhuu` : "Дэлгүүр олдсонгүй" };
}

export default async function StorefrontLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const shop = await getShop(slug);
  if (!shop) notFound();

  return (
    <div className="sf">
      <header className="sf-header">
        <Link href={`/s/${slug}`} className="sf-brand">
          {shop.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={shop.logoUrl} alt="" />
          ) : (
            <span className="sf-avatar">{shop.name.slice(0, 1)}</span>
          )}
          <span>{shop.name}</span>
        </Link>
        <div className="sf-header-actions">
          <a href={`tel:${shop.phone}`} className="sf-icon-link" aria-label="Залгах">
            {formatPhone(shop.phone)}
          </a>
          <CartButton slug={slug} />
        </div>
      </header>
      <main className="sf-main">{children}</main>
      <footer className="sf-footer">
        {shop.facebookPageUrl && (
          <a href={shop.facebookPageUrl} target="_blank" rel="noopener">
            Дэлгүүрийн бусад суваг
          </a>
        )}
        <span>
          Захиалга, хүргэлтийг <strong>Sankhuu</strong> хариуцна
        </span>
      </footer>
    </div>
  );
}
