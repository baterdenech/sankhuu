"use server";

import { revalidatePath } from "next/cache";
import { prisma, type VehicleType } from "@sankhuu/db";
import { requireAdmin } from "@/lib/roles";
import { assignDelivery, DeliveryError, returnDeliveryToShop, unassignDelivery } from "@/lib/delivery";
import { normalizeMongolianPhone } from "@/lib/phone";
import { normalizeUsername, usernameToEmail } from "@/lib/username";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureUser } from "@/lib/auth";

export type ActionState = { error?: string; ok?: string; values?: Record<string, string> };
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

function refresh() {
  revalidatePath("/admin");
  revalidatePath("/admin/drivers");
  revalidatePath("/admin/cash");
  revalidatePath("/admin/settlements");
  revalidatePath("/driver");
  revalidatePath("/orders");
  revalidatePath("/deliveries");
}

async function run(fn: () => Promise<void>): Promise<ActionState> {
  try {
    await fn();
    refresh();
    return {};
  } catch (e) {
    if (e instanceof DeliveryError) return { error: e.message };
    throw e;
  }
}

// ── Хүргэлт ──
export async function assign(deliveryId: string, driverId: string) {
  const user = await requireAdmin();
  return run(() => assignDelivery(deliveryId, driverId, user.id));
}
export async function unassign(deliveryId: string) {
  const user = await requireAdmin();
  return run(() => unassignDelivery(deliveryId, user.id));
}
export async function returnToShop(deliveryId: string) {
  const user = await requireAdmin();
  return run(() => returnDeliveryToShop(deliveryId, user.id));
}

// ── Жолооч ──
const VEHICLES: VehicleType[] = ["CAR", "MOTORBIKE", "BICYCLE", "ON_FOOT"];

// Нууц үг өгвөл шинэ бүртгэл үүсгэнэ (SUPABASE_SECRET_KEY хэрэгтэй); өгөхгүй бол бүртгэлтэй хэрэглэгчийг жолооч болгоно
export async function addDriver(_prev: ActionState, fd: FormData): Promise<ActionState> {
  await requireAdmin();
  const values = { username: str(fd, "username"), name: str(fd, "name"), phone: str(fd, "phone"), plate: str(fd, "plate"), vehicle: str(fd, "vehicle") };
  const password = String(fd.get("password") ?? "");
  const fail = (error: string): ActionState => ({ error, values });

  const username = normalizeUsername(values.username);
  if (!username) return fail("Нэвтрэх нэр 3-20 тэмдэгт: жижиг латин үсэг, тоо, доогуур зураас.");
  const phone = values.phone ? normalizeMongolianPhone(values.phone) : null;
  if (values.phone && !phone) return fail("Утасны дугаараа зөв оруулна уу (8 оронтой).");
  const vehicleType = (VEHICLES.includes(values.vehicle as VehicleType) ? values.vehicle : "CAR") as VehicleType;

  let user = await prisma.user.findFirst({ where: { OR: [{ username }, ...(phone ? [{ phone }] : [])] } });
  if (user) {
    const existing = await prisma.driver.findUnique({ where: { userId: user.id } });
    if (existing) return fail("Энэ хэрэглэгч аль хэдийн жолооч байна.");
  } else {
    if (password.length < 8) return fail("Хэрэглэгч олдсонгүй. Шинээр үүсгэхийн тулд 8-аас дээш тэмдэгттэй нууц үг өгнө үү.");
    const admin = createAdminClient();
    if (!admin) return fail("SUPABASE_SECRET_KEY тохируулаагүй тул шинэ бүртгэл үүсгэх боломжгүй. Жолооч /login/register дээр өөрөө бүртгүүлээд, та нэрийг нь энд оруулна уу.");
    const { data, error } = await admin.auth.admin.createUser({ email: usernameToEmail(username), password, email_confirm: true, user_metadata: { username } });
    if (error || !data.user) return fail(`Бүртгэл үүсгэж чадсангүй: ${error?.message ?? "алдаа"}`);
    user = await ensureUser(data.user.id, { username, phone });
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { role: "DRIVER", ...(values.name ? { name: values.name } : {}), ...(phone && !user.phone ? { phone } : {}) } }),
    prisma.driver.create({ data: { userId: user.id, vehicleType, plateNumber: values.plate || null } }),
  ]);
  refresh();
  return { ok: `${values.name || username} жолооч боллоо.` };
}

export async function setDriverActive(driverId: string, active: boolean) {
  await requireAdmin();
  const d = await prisma.driver.findUnique({ where: { id: driverId } });
  if (!d) return;
  await prisma.user.update({ where: { id: d.userId }, data: { isActive: active } });
  if (!active) await prisma.driver.update({ where: { id: d.id }, data: { isOnline: false } });
  refresh();
}

export async function makeAdmin(userId: string) {
  await requireAdmin();
  await prisma.user.update({ where: { id: userId }, data: { role: "ADMIN" } });
  refresh();
}

// ── Бэлэн мөнгө: жолоочийн гар дээрх мөнгийг оффис хүлээн авав ──
export async function receiveCash(driverId: string) {
  const admin = await requireAdmin();
  await prisma.$transaction(async (tx) => {
    const list = await tx.delivery.findMany({ where: { driverId, status: "DELIVERED", cashHandoverId: null }, select: { id: true, codCollected: true } });
    const amount = list.reduce((s, d) => s + d.codCollected, 0);
    if (list.length === 0) return;
    const h = await tx.cashHandover.create({ data: { driverId, amount, receivedBy: admin.id } });
    await tx.delivery.updateMany({ where: { id: { in: list.map((d) => d.id) } }, data: { cashHandoverId: h.id } });
  });
  refresh();
}

// ── Худалдагчийн тооцоо: хүргэгдсэн, тооцоонд ороогүй хүргэлтүүдийг нэг тооцоо болгоно ──
export async function createSettlement(shopId: string) {
  await requireAdmin();
  await prisma.$transaction(async (tx) => {
    const list = await tx.delivery.findMany({
      where: { status: "DELIVERED", settlementId: null, order: { shopId } },
      select: { id: true, codCollected: true, fee: true, deliveredAt: true },
    });
    if (list.length === 0) return;
    const codTotal = list.reduce((s, d) => s + d.codCollected, 0);
    const feeTotal = list.reduce((s, d) => s + d.fee, 0);
    const times = list.map((d) => d.deliveredAt?.getTime() ?? Date.now());
    const s = await tx.settlement.create({
      data: { shopId, periodStart: new Date(Math.min(...times)), periodEnd: new Date(Math.max(...times)), codTotal, feeTotal, payout: codTotal - feeTotal },
    });
    await tx.delivery.updateMany({ where: { id: { in: list.map((d) => d.id) } }, data: { settlementId: s.id } });
  });
  refresh();
}

export async function markSettlementPaid(settlementId: string) {
  await requireAdmin();
  await prisma.settlement.update({ where: { id: settlementId, status: "PENDING" }, data: { status: "PAID", paidAt: new Date() } });
  refresh();
}
