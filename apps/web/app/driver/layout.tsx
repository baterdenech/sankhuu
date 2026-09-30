import "../(shop)/shop.css";
import "./driver.css";
import { prisma } from "@sankhuu/db";
import { requireDriver } from "@/lib/roles";
import { displayName } from "@/lib/auth";
import { formatPhone } from "@/lib/phone";
import { signOut } from "../login/actions";
import { DriverNav } from "./nav";
import { OnlineToggle } from "./online-toggle";
import { InstallPrompt } from "../_components/pwa";

export const metadata = { title: "Жолооч · Sankhuu", manifest: "/driver/manifest.webmanifest", appleWebApp: { capable: true, title: "Sankhuu Жолооч" } };

// Жолоочийн мобайл апп (вэб): худалдан авагчийн аппын дизайны системийг дахин ашиглана
export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const { user, driver } = await requireDriver();
  const activeCount = await prisma.delivery.count({ where: { driverId: driver.id, status: { in: ["ASSIGNED", "PICKED_UP"] } } });
  return (
    <div className="app driver">
      <div className="app-page">
        <header className="topbar plain driver-top">
          <h1 className="topbar-title">{displayName(user, formatPhone)}</h1>
          <OnlineToggle online={driver.isOnline} />
          <form action={signOut}>
            <button type="submit" className="link-button small-text">
              Гарах
            </button>
          </form>
        </header>
        {children}
      </div>
      <InstallPrompt appName="Sankhuu Жолооч" />
      <DriverNav activeCount={activeCount} />
    </div>
  );
}
