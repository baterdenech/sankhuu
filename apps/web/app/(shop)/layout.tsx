import "./shop.css";
import { prisma } from "@sankhuu/db";
import { getCurrentUser } from "@/lib/auth";
import { BottomNav } from "./_components/bottom-nav";
import { Assistant } from "./_components/assistant";
import { FavoritesProvider } from "./_components/favorites";
import { InstallPrompt } from "../_components/pwa";
import { DesktopHeader } from "./_components/desktop-header";
import { PageFrame } from "./_components/page-frame";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  // Нэвтэрсэн бол дуртай барааны id-уудыг нэг удаа ачаална (зүрхэн товчнууд үүнээс уншина)
  const user = await getCurrentUser();
  const favorites = user ? await prisma.favorite.findMany({ where: { userId: user.id }, select: { productId: true } }) : [];
  return (
    <div className="app">
      <FavoritesProvider initial={favorites.map((f) => f.productId)} loggedIn={Boolean(user)}>
        <DesktopHeader />
        <PageFrame>{children}</PageFrame>
        <InstallPrompt />
        <Assistant />
        <BottomNav />
      </FavoritesProvider>
    </div>
  );
}
