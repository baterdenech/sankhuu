import Link from "next/link";
import { requireShop } from "@/lib/shop";
import { formatPhone } from "@/lib/phone";
import { displayName } from "@/lib/auth";
import { isAdmin } from "@/lib/roles";
import { signOut } from "../login/actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, shop } = await requireShop();
  const admin = await isAdmin(user);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Sankhuu</div>
        <div className="shop-name" title={shop.name}>
          {shop.name}
        </div>
        <nav>
          <Link href="/dashboard">Хянах самбар</Link>
          <Link href="/orders">Захиалга</Link>
          <Link href="/products">Бараа</Link>
          <Link href="/deliveries">Хүргэлт</Link>
          {admin && <Link href="/admin">Диспетчер →</Link>}
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
