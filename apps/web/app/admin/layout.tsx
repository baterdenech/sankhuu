import Link from "next/link";
import { prisma } from "@sankhuu/db";
import { requireAdmin } from "@/lib/roles";
import { displayName } from "@/lib/auth";
import { formatPhone } from "@/lib/phone";
import { signOut } from "../login/actions";

// Диспетчерийн самбар (ADMIN эрх): хүргэлт оноох, жолооч, бэлэн мөнгө, худалдагчийн тооцоо
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const hasShop = Boolean(await prisma.shopMember.findFirst({ where: { userId: user.id }, select: { id: true } }));
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Sankhuu</div>
        <div className="shop-name">Диспетчер</div>
        <nav>
          <Link href="/admin">Хүргэлт</Link>
          <Link href="/admin/map">Газрын зураг</Link>
          <Link href="/admin/drivers">Жолооч</Link>
          <Link href="/admin/cash">Бэлэн мөнгө</Link>
          <Link href="/admin/settlements">Тооцоо</Link>
          <Link href="/admin/sms">SMS</Link>
          {hasShop && <Link href="/dashboard">Миний дэлгүүр →</Link>}
        </nav>
        <div className="account">
          <div>{displayName(user, formatPhone)}</div>
          <form action={signOut}>
            <button type="submit" className="link-button">
              Гарах
            </button>
          </form>
        </div>
      </aside>
      <main>{children}</main>
    </div>
  );
}
