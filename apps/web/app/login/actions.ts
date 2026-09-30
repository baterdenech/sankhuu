"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { prisma } from "@sankhuu/db";
import { createClient } from "@/lib/supabase/server";
import { ensureUser } from "@/lib/auth";
import { normalizeMongolianPhone } from "@/lib/phone";
import { normalizeUsername, usernameToEmail } from "@/lib/username";

export type FormState = { error?: string; values?: Record<string, string> };

function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "otp_expired":
      return "Код буруу эсвэл хугацаа нь дууссан байна.";
    case "over_sms_send_rate_limit":
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Хэт олон удаа оролдлоо. Түр хүлээгээд дахин оролдоно уу.";
    case "sms_send_failed":
      return "SMS илгээж чадсангүй. Дугаараа шалгаад дахин оролдоно уу.";
    case "phone_provider_disabled":
      return "Утсаар нэвтрэх тохиргоо идэвхгүй байна. Админд хандана уу.";
    case "email_provider_disabled":
    case "signup_disabled":
      return "Нэвтрэх нэрээр бүртгүүлэх тохиргоо идэвхгүй байна. Админд хандана уу.";
    case "invalid_credentials":
      return "Нэвтрэх нэр эсвэл нууц үг буруу байна.";
    case "user_already_exists":
    case "email_exists":
      return "Энэ нэвтрэх нэр бүртгэлтэй байна.";
    case "email_not_confirmed":
      return "Бүртгэл баталгаажаагүй байна. Админд хандана уу.";
    case "weak_password":
      return "Нууц үг хэт энгийн байна. 8-аас дээш тэмдэгттэй байлгана уу.";
    default:
      return "Алдаа гарлаа. Дахин оролдоно уу.";
  }
}

// Зөвхөн апп доторх зам руу буцаана (open redirect-ээс сэргийлнэ)
function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  return /^\/(?![/\\])/.test(value) && !value.includes("\\") ? value : "/";
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

// ── Утас + SMS код ──

export async function sendCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const typed = str(formData, "phone");
  const phone = normalizeMongolianPhone(typed);
  if (!phone) return { error: "Утасны дугаараа зөв оруулна уу (8 оронтой).", values: { phone: typed } };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) return { error: authErrorMessage(error), values: { phone: typed } };

  const params = new URLSearchParams({ phone, next: safeNext(formData.get("next")) });
  redirect(`/login/verify?${params}`);
}

export async function verifyCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const phone = normalizeMongolianPhone(str(formData, "phone"));
  const token = str(formData, "code").replace(/\D/g, "");
  if (!phone) return { error: "Утасны дугаар буруу байна. Эхнээс нь дахин оролдоно уу." };
  if (token.length < 6) return { error: "SMS-ээр ирсэн кодыг оруулна уу." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error || !data.user) return { error: error ? authErrorMessage(error) : "Алдаа гарлаа." };

  await ensureUser(data.user.id, { phone });
  redirect(safeNext(formData.get("next")));
}

// ── Нэвтрэх нэр + нууц үг ──

export async function signInWithPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const typed = str(formData, "username");
  const username = normalizeUsername(typed);
  const password = String(formData.get("password") ?? "");
  const values = { username: typed };
  if (!username) return { error: "Нэвтрэх нэр буруу байна.", values };
  if (!password) return { error: "Нууц үгээ оруулна уу.", values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password });
  if (error || !data.user) return { error: error ? authErrorMessage(error) : "Алдаа гарлаа.", values };

  await ensureUser(data.user.id, { username });
  redirect(safeNext(formData.get("next")));
}

export async function registerWithPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const typedUser = str(formData, "username");
  const typedPhone = str(formData, "phone");
  const name = str(formData, "name");
  const password = String(formData.get("password") ?? "");
  const values = { username: typedUser, phone: typedPhone, name };
  const fail = (error: string): FormState => ({ error, values });

  const username = normalizeUsername(typedUser);
  if (!username) return fail("Нэвтрэх нэр 3-20 тэмдэгт: жижиг латин үсэг, тоо, доогуур зураас.");
  if (password.length < 8) return fail("Нууц үг 8-аас дээш тэмдэгттэй байна.");
  if (password !== String(formData.get("password2") ?? "")) return fail("Нууц үг давталт таарахгүй байна.");
  const phone = typedPhone ? normalizeMongolianPhone(typedPhone) : null;
  if (typedPhone && !phone) return fail("Утасны дугаараа зөв оруулна уу (8 оронтой).");

  const taken = await prisma.user.findFirst({ where: { OR: [{ username }, ...(phone ? [{ phone }] : [])] }, select: { username: true } });
  if (taken) return fail(taken.username === username ? "Энэ нэвтрэх нэр бүртгэлтэй байна." : "Энэ утасны дугаар өөр бүртгэлд холбогдсон байна.");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: usernameToEmail(username),
    password,
    options: { data: { username } },
  });
  if (error || !data.user) return fail(error ? authErrorMessage(error) : "Алдаа гарлаа.");
  // Supabase дээр "Confirm email" асаалттай бол session ирэхгүй
  if (!data.session) return fail("Бүртгэл үүссэн ч баталгаажуулалт шаардаж байна. Админд хандана уу.");

  const user = await ensureUser(data.user.id, { username, phone });
  if (name && !user.name) await prisma.user.update({ where: { id: user.id }, data: { name } });
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
