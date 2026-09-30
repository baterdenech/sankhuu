"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/roles";
import { resendSms } from "@/lib/sms";

export async function resend(id: string) {
  await requireAdmin();
  await resendSms(id);
  revalidatePath("/admin/sms");
}
