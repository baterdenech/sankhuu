import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { requireUser } from "@/lib/auth";
import { roleHome } from "@/lib/roles";

// Нэвтэрсэн хэрэглэгчийн дэлгүүрийг буцаана. Дэлгүүргүй бол: админ → /admin, жолооч → /driver, бусад → бүртгэл.
export const requireShop = cache(async () => {
  const user = await requireUser();
  const membership = await prisma.shopMember.findFirst({
    where: { userId: user.id, shop: { isActive: true } },
    include: { shop: { include: { pickupAddress: true } } },
    orderBy: { shop: { createdAt: "asc" } },
  });
  if (!membership) {
    const home = await roleHome(user);
    redirect(home === "/dashboard" ? "/onboarding" : home);
  }
  return { user, shop: membership.shop, role: membership.role };
});
