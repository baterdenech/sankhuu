"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@sankhuu/db";
import { requireShop } from "@/lib/shop";
import { normalizeMongolianPhone } from "@/lib/phone";
import { DISTRICTS } from "@/lib/districts";
import { uploadImage } from "@/lib/storage";
import { parseLatLng } from "@/lib/geo";

export type SettingsState = { error?: string; ok?: string; values?: Record<string, string> };
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// Дэлгүүрийн тохиргоо: нэр, утас, холбоос, лого, барааг авах хаяг. Slug (холбоос) өөрчлөгдөхгүй.
export async function updateShop(_prev: SettingsState, fd: FormData): Promise<SettingsState> {
  const { shop } = await requireShop();
  const values = { name: str(fd, "name"), phone: str(fd, "phone"), facebookPageUrl: str(fd, "facebookPageUrl"), district: str(fd, "district"), khoroo: str(fd, "khoroo"), details: str(fd, "details") };
  const fail = (error: string): SettingsState => ({ error, values });

  const phone = normalizeMongolianPhone(values.phone);
  if (values.name.length < 2) return fail("Дэлгүүрийн нэрээ оруулна уу.");
  if (!phone) return fail("Утасны дугаараа зөв оруулна уу (8 оронтой).");
  if (values.facebookPageUrl && !/^https?:\/\/[^\s/]+\.[^\s/]+/i.test(values.facebookPageUrl)) return fail("Холбоос https://-ээр эхэлсэн байх ёстой.");
  if (!(DISTRICTS as readonly string[]).includes(values.district)) return fail("Дүүргээ сонгоно уу.");
  if (values.details.length < 5) return fail("Барааг авах хаягаа дэлгэрэнгүй бичнэ үү.");

  const geo = parseLatLng(fd.get("lat"), fd.get("lng"));
  let logoUrl: string | null | undefined = undefined;
  const logo = fd.get("logo");
  if (logo instanceof File && logo.size > 0) {
    try {
      logoUrl = await uploadImage(logo, `logos/${shop.id}`);
    } catch (e) {
      return fail(e instanceof Error ? e.message : "Лого хадгалж чадсангүй.");
    }
  } else if (str(fd, "removeLogo") === "1") {
    logoUrl = null;
  }

  await prisma.shop.update({
    where: { id: shop.id },
    data: {
      name: values.name,
      phone,
      facebookPageUrl: values.facebookPageUrl || null,
      ...(logoUrl !== undefined ? { logoUrl } : {}),
      pickupAddress: shop.pickupAddressId
        ? { update: { district: values.district, khoroo: values.khoroo || null, details: values.details, lat: geo?.lat ?? null, lng: geo?.lng ?? null } }
        : { create: { district: values.district, khoroo: values.khoroo || null, details: values.details, lat: geo?.lat ?? null, lng: geo?.lng ?? null } },
    },
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath(`/s/${shop.slug}`);
  return { ok: "Хадгалагдлаа.", values };
}
