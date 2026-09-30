import { redirect } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { requireUser } from "@/lib/auth";
import { roleHome } from "@/lib/roles";
import { formatPhone } from "@/lib/phone";
import { ShopForm } from "./shop-form";

export default async function OnboardingPage() {
  const user = await requireUser();
  const existing = await prisma.shopMember.findFirst({ where: { userId: user.id } });
  if (existing) redirect("/dashboard");
  // Жолооч, админ дэлгүүр бүртгэх шаардлагагүй (худалдан авагч дэлгүүр нээж болно)
  const home = await roleHome(user);
  if (home === "/admin" || home === "/driver") redirect(home);

  return (
    <div className="auth-page">
      <div className="auth-card wide">
        <div className="brand">Sankhuu</div>
        <h1>Дэлгүүрээ бүртгэе</h1>
        <p className="muted">
          Нэг минутын дотор дуусна. Дараа нь бараагаа зургаар бүртгээд захиалга авч эхэлнэ.
        </p>
        <ShopForm defaultPhone={user.phone ? formatPhone(user.phone) : ""} />
      </div>
    </div>
  );
}
