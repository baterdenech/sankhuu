import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { createClient } from "@/lib/supabase/server";
import { normalizeMongolianPhone } from "@/lib/phone";
import { emailToUsername } from "@/lib/username";

type Identity = { phone?: string | null; username?: string | null };

// Supabase-ийн хэрэглэгчид харгалзах User мөрийг үүсгэнэ (байвал буцаана)
export async function ensureUser(authUserId: string, identity: Identity) {
  const phone = identity.phone ? normalizeMongolianPhone(identity.phone) : null;
  const username = identity.username ?? null;
  return prisma.user.upsert({
    where: { id: authUserId },
    update: {},
    create: { id: authUserId, phone, username },
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

  // Нэвтэрсэн ч User мөр үүсээгүй байж болно (жишээ нь бүртгэлийн дараа алдаа гарсан)
  return ensureUser(claims.sub, {
    phone: typeof claims.phone === "string" ? claims.phone : null,
    username: emailToUsername(typeof claims.email === "string" ? claims.email : null),
  });
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.isActive) redirect("/login?error=inactive");
  return user;
}

// Самбар дээр харуулах нэр
export function displayName(user: { name: string | null; username: string | null; phone: string | null }, formatPhone: (p: string) => string) {
  return user.name ?? user.username ?? (user.phone ? formatPhone(user.phone) : "Хэрэглэгч");
}
