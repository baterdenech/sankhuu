import { requireShop } from "@/lib/shop";
import { sellerStats, STATS_PRESETS } from "@/lib/stats";
import { StatsView } from "./view";

export const metadata = { title: "Статистик · Sankhuu" };

// Худалдагчийн статистик: ?days=7|30|90 (анхдагч 30)
export default async function StatsPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { shop } = await requireShop();
  const sp = await searchParams;
  const days = STATS_PRESETS.find((d) => String(d) === sp.days) ?? 30;
  const s = await sellerStats(shop.id, days);
  return <StatsView s={s} days={days} />;
}
