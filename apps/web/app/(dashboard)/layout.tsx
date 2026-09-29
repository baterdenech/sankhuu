import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { formatPhone } from "@/lib/phone";
import { signOut } from "../login/actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Sankhuu</div>
        <nav>
          <Link href="/">Хянах самбар</Link>
          <Link href="/orders">Захиалга</Link>
          <Link href="/products">Бараа</Link>
          <Link href="/deliveries">Хүргэлт</Link>
        </nav>
        <div className="account">
          <div>{user.name ?? formatPhone(user.phone)}</div>
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
