import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { createClient } from "@/lib/supabase/server";
import { normalizeMongolianPhone } from "@/lib/phone";

// Supabase-ийн хэрэглэгчид харгалзах User мөрийг үүсгэнэ (байвал буцаана)
export async function ensureUser(authUserId: string, phone: string) {
  return prisma.user.upsert({
    where: { id: authUserId },
    update: {},
    create: { id: authUserId, phone },
  });
}

// Нэг render дотор олон дуудлагыг нэг query болгоно
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const user = await prisma.user.findUnique({ where: { id: claims.sub } });
  if (user) return user;

  // Нэвтэрсэн ч User мөр үүсээгүй байж болно (жишээ нь verify-ийн дараа алдаа гарсан)
  const phone = normalizeMongolianPhone(String(claims.phone ?? ""));
  return phone ? ensureUser(claims.sub, phone) : null;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isActive) redirect("/login?error=inactive");
  return user;
}
