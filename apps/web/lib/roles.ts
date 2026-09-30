import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma, type User } from "@sankhuu/db";
import { requireUser } from "@/lib/auth";

// ─── Эрх (SELLER / DRIVER / ADMIN) ───────────────────────────────────────────
// Анхны админыг ADMIN_USERS орчны хувьсагчаар тодорхойлно: таслалаар тусгаарласан нэвтрэх нэр эсвэл утас
// (жишээ: ADMIN_USERS="bat,+97699112233"). Тэр хэрэглэгч нэвтрэхэд role нь ADMIN болно.
// Дараа нь админ /admin/drivers дээрээс бусдыг жолооч, админ болгоно.

function adminList() {
  return (process.env.ADMIN_USERS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminIdentity(user: Pick<User, "username" | "phone">) {
  const list = adminList();
  return list.length > 0 && ((user.username && list.includes(user.username.toLowerCase())) || (user.phone && list.includes(user.phone)));
}

export async function isAdmin(user: User) {
  if (user.role === "ADMIN") return true;
  if (!isAdminIdentity(user)) return false;
  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  return true;
}

// Хэрэглэгчийн үндсэн хуудас (нэвтэрсний дараа, эсвэл буруу хэсэгт орсон үед)
export async function roleHome(user: User) {
  if (await isAdmin(user)) return "/admin";
  if (user.role === "DRIVER") return "/driver";
  if (user.role === "BUYER") return "/me";
  return "/dashboard";
}

export const requireAdmin = cache(async () => {
  const user = await requireUser();
  if (!(await isAdmin(user))) redirect(await roleHome(user));
  return user;
});

export const requireDriver = cache(async () => {
  const user = await requireUser();
  const driver = await prisma.driver.findUnique({ where: { userId: user.id } });
  if (!driver) redirect(await roleHome(user));
  return { user, driver };
});
