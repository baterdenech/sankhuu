import { requireShop } from "@/lib/shop";
import { formatPhone } from "@/lib/phone";
import { siteUrl } from "@/lib/og";
import { SettingsForm } from "./settings-form";
import { CopyLink } from "./copy-link";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { shop } = await requireShop();
  const link = `${siteUrl()}/s/${shop.slug}`;
  return (
    <>
      <h1>Тохиргоо</h1>
      <div className="two-col">
        <section className="card narrow">
          <SettingsForm
            initial={{
              name: shop.name,
              phone: formatPhone(shop.phone).replace(/^\+976\s?/, ""),
              facebookPageUrl: shop.facebookPageUrl ?? "",
              district: shop.pickupAddress?.district ?? "",
              khoroo: shop.pickupAddress?.khoroo ?? "",
              details: shop.pickupAddress?.details ?? "",
              logoUrl: shop.logoUrl,
            }}
          />
        </section>
        <section className="card">
          <h2 style={{ marginTop: 0 }}>Дэлгүүрийн холбоос</h2>
          <p className="muted small-text">Холбоосоо чат, сошиалаар хуваалцахад лого, нэр, барааны зурагтай карт харагдана. Бараа бүрийн холбоос ч мөн зураг, үнэтэй харагдана.</p>
          <CopyLink url={link} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/api/og/shop/${shop.slug}?v=${shop.updatedAt.getTime()}`} alt="Хуваалцах картын урьдчилсан харагдац" className="og-preview" />
        </section>
      </div>
    </>
  );
}
