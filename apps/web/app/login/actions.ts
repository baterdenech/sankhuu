"use server";

import { redirect } from "next/navigation";
import type { AuthError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { ensureUser } from "@/lib/auth";
import { normalizeMongolianPhone } from "@/lib/phone";

export type FormState = { error?: string; phone?: string };

function authErrorMessage(error: AuthError): string {
  switch (error.code) {
    case "otp_expired":
      return "Код буруу эсвэл хугацаа нь дууссан байна.";
    case "over_sms_send_rate_limit":
    case "over_request_rate_limit":
      return "Хэт олон удаа оролдлоо. Түр хүлээгээд дахин оролдоно уу.";
    case "sms_send_failed":
      return "SMS илгээж чадсангүй. Дугаараа шалгаад дахин оролдоно уу.";
    case "phone_provider_disabled":
      return "Утсаар нэвтрэх тохиргоо идэвхгүй байна. Админд хандана уу.";
    default:
      return "Алдаа гарлаа. Дахин оролдоно уу.";
  }
}

// Зөвхөн апп доторх зам руу буцаана (open redirect-ээс сэргийлнэ)
function safeNext(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  return /^\/(?![/\\])/.test(value) && !value.includes("\\") ? value : "/";
}

export async function sendCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const typed = String(formData.get("phone") ?? "");
  const phone = normalizeMongolianPhone(typed);
  if (!phone) return { error: "Утасны дугаараа зөв оруулна уу (8 оронтой).", phone: typed };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ phone });
  if (error) return { error: authErrorMessage(error), phone: typed };

  const params = new URLSearchParams({ phone, next: safeNext(formData.get("next")) });
  redirect(`/login/verify?${params}`);
}

export async function verifyCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const phone = normalizeMongolianPhone(String(formData.get("phone") ?? ""));
  const token = String(formData.get("code") ?? "").replace(/\D/g, "");
  if (!phone) return { error: "Утасны дугаар буруу байна. Эхнээс нь дахин оролдоно уу." };
  if (token.length < 6) return { error: "SMS-ээр ирсэн кодыг оруулна уу." };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({ phone, token, type: "sms" });
  if (error || !data.user) return { error: error ? authErrorMessage(error) : "Алдаа гарлаа." };

  await ensureUser(data.user.id, phone);
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
