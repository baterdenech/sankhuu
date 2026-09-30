"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Худалдан авагч гарахад нүүр рүү буцна (худалдагчийн "Гарах" /login руу очдог)
export async function signOutBuyer() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
