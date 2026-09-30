import { CartView } from "./cart-view";
import { lastCheckoutInfo } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Сагс · Sankhuu" };

// Нэвтэрсэн худалдан авагчид сүүлийн захиалгын хаягийг урьдчилан бөглөнө
export default async function CartPage() {
  const prefill = await lastCheckoutInfo();
  return <CartView prefill={prefill} />;
}
