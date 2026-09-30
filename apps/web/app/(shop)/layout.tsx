import "./shop.css";
import { BottomNav } from "./_components/bottom-nav";
import { Assistant } from "./_components/assistant";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <div className="app-page">{children}</div>
      <Assistant />
      <BottomNav />
    </div>
  );
}
