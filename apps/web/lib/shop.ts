import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { requireUser } from "@/lib/auth";

// Нэвтэрсэн хэрэглэгчийн дэлгүүрийг буцаана. Дэлгүүргүй бол бүртгэл рүү шилжүүлнэ.
export const requireShop = cache(async () => {
  const user = await requireUser();
  const membership = await prisma.shopMember.findFirst({
    where: { userId: user.id, shop: { isActive: true } },
    include: { shop: { include: { pickupAddress: true } } },
    orderBy: { shop: { createdAt: "asc" } },
  });
  if (!membership) redirect("/onboarding");
  return { user, shop: membership.shop, role: membership.role };
});
