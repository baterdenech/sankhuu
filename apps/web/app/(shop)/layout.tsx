import "./shop.css";
import { prisma } from "@sankhuu/db";
import { getCurrentUser, displayName } from "@/lib/auth";
import { formatPhone } from "@/lib/phone";
import { BottomNav } from "./_components/bottom-nav";
import { Assistant } from "./_components/assistant";
import { FavoritesProvider } from "./_components/favorites";
import { InstallPrompt } from "../_components/pwa";
import { DesktopHeader } from "./_components/desktop-header";
import { PageFrame } from "./_components/page-frame";
import { DesktopFooter } from "./_components/desktop-footer";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // Нэвтэрсэн бол дуртай барааны id-уудыг нэг удаа ачаална (зүрхэн товчнууд үүнээс уншина)
  const user = await getCurrentUser();
  const favorites = user ? await prisma.favorite.findMany({ where: { userId: user.id }, select: { productId: true } }) : [];
  return (
    <div className="app">
      <FavoritesProvider initial={favorites.map((f) => f.productId)} loggedIn={Boolean(user)}>
        <DesktopHeader userName={user ? displayName(user, formatPhone) : null} />
        <PageFrame>{children}</PageFrame>
        <DesktopFooter />
        <InstallPrompt />
        <Assistant />
        <BottomNav />
      </FavoritesProvider>
    </div>
  );
}
