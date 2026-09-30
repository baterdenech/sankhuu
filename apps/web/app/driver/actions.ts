"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@sankhuu/db";
import { requireDriver } from "@/lib/roles";
import { completeDelivery, DeliveryError, failDelivery, pickUpDelivery, type Geo } from "@/lib/delivery";

export type DriverActionState = { error?: string };

function refresh() {
  revalidatePath("/driver");
  revalidatePath("/driver/history");
  revalidatePath("/driver/cash");
  revalidatePath("/admin");
  revalidatePath("/orders");
  revalidatePath("/deliveries");
}

async function run(fn: () => Promise<void>): Promise<DriverActionState> {
  try {
    await fn();
    refresh();
    return {};
  } catch (e) {
    if (e instanceof DeliveryError) return { error: e.message };
    throw e;
  }
}

function cleanGeo(geo?: Geo): Geo {
  if (!geo || typeof geo.lat !== "number" || typeof geo.lng !== "number" || !Number.isFinite(geo.lat) || !Number.isFinite(geo.lng)) return null;
  return { lat: geo.lat, lng: geo.lng };
}

export async function pickUp(deliveryId: string, geo?: Geo) {
  const { user, driver } = await requireDriver();
  return run(() => pickUpDelivery(deliveryId, driver.id, user.id, cleanGeo(geo)));
}

export async function deliver(deliveryId: string, collected: number, geo?: Geo) {
  const { user, driver } = await requireDriver();
  return run(() => completeDelivery(deliveryId, driver.id, user.id, Math.round(Number(collected)), cleanGeo(geo)));
}

export async function fail(deliveryId: string, reason: string, geo?: Geo) {
  const { user, driver } = await requireDriver();
  const r = String(reason ?? "").trim().slice(0, 200) || "Шалтгаан заагаагүй";
  return run(() => failDelivery(deliveryId, driver.id, user.id, r, cleanGeo(geo)));
}

export async function setOnline(online: boolean, geo?: Geo) {
  const { driver } = await requireDriver();
  const g = cleanGeo(geo);
  await prisma.driver.update({
    where: { id: driver.id },
    data: { isOnline: online, lastSeenAt: new Date(), ...(g ? { lastLat: g.lat, lastLng: g.lng } : {}) },
  });
  refresh();
  revalidatePath("/admin/drivers");
}
