"use server";

import { redirect } from "next/navigation";
import { prisma, type Prisma } from "@sankhuu/db";
import { requireUser } from "@/lib/auth";
import { normalizeMongolianPhone } from "@/lib/phone";
import { slugify } from "@/lib/slug";
import { DISTRICTS } from "@/lib/districts";

export type FormValues = Record<string, string>;
export type FormState = { error?: string; values?: FormValues };

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

export async function createShop(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();

  const name = str(formData, "name");
  const phone = normalizeMongolianPhone(str(formData, "phone"));
  const facebookPageUrl = str(formData, "facebookPageUrl");
  const district = str(formData, "district");
  const khoroo = str(formData, "khoroo");
  const details = str(formData, "details");
  // Алдаа буцаахад талбарууд хоосрохгүйн тулд оруулсан утгуудыг хамт буцаана
  const values: FormValues = { name, phone: str(formData, "phone"), facebookPageUrl, district, khoroo, details };
  const fail = (error: string): FormState => ({ error, values });

  if (name.length < 2) return fail("Дэлгүүрийн нэрээ оруулна уу.");
  if (!phone) return fail("Утасны дугаараа зөв оруулна уу (8 оронтой).");
  if (facebookPageUrl && !/^https?:\/\/(www\.|m\.)?(facebook\.com|fb\.com|instagram\.com)\//i.test(facebookPageUrl)) {
    return fail("Facebook page-ийн холбоос facebook.com-оор эхэлсэн байх ёстой.");
  }
  if (!(DISTRICTS as readonly string[]).includes(district)) return fail("Дүүргээ сонгоно уу.");
  if (details.length < 5) return fail("Барааг авах хаягаа дэлгэрэнгүй бичнэ үү (байр, орц, тоот).");

  const existing = await prisma.shopMember.findFirst({ where: { userId: user.id } });
  if (existing) redirect("/dashboard");

  const base = slugify(name);
  const taken = await prisma.shop.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } });
  const slugs = new Set(taken.map((s) => s.slug));
  let slug = base;
  for (let i = 2; slugs.has(slug); i++) slug = `${base}-${i}`;

  const data: Prisma.ShopCreateInput = {
    name,
    slug,
    phone,
    facebookPageUrl: facebookPageUrl || null,
    pickupAddress: { create: { district, khoroo: khoroo || null, details } },
    members: { create: { userId: user.id, role: "OWNER" } },
  };
  await prisma.$transaction([
    prisma.shop.create({ data }),
    prisma.user.update({ where: { id: user.id }, data: { role: "SELLER" } }),
  ]);

  redirect("/dashboard");
}
