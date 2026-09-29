import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sankhuu",
  description: "Facebook худалдагчдад зориулсан захиалга, хүргэлтийн систем",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn">
      <body>
        <div className="shell">
          <aside className="sidebar">
            <div className="brand">Sankhuu</div>
            <nav>
              <Link href="/">Хянах самбар</Link>
              <Link href="/orders">Захиалга</Link>
              <Link href="/products">Бараа</Link>
              <Link href="/deliveries">Хүргэлт</Link>
            </nav>
          </aside>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
