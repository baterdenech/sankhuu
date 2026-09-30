"use server";

import { requireShop } from "@/lib/shop";
import { shopInsights, type ShopInsights } from "@/lib/ai/insights";

// AI дүгнэлт (1 цаг кэштэй; force=true бол дахин үүсгэнэ)
export async function getInsights(force = false): Promise<ShopInsights | null> {
  const { shop } = await requireShop();
  try {
    return await shopInsights(shop.id, force);
  } catch (e) {
    console.error("insights", e);
    return null;
  }
}
