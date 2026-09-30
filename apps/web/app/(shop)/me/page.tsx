import { MyOrders } from "./my-orders";

export const metadata = { title: "Миний · Sankhuu" };

export default function MePage() {
  return (
    <>
      <header className="topbar plain">
        <h1 className="topbar-title">Миний захиалгууд</h1>
      </header>
      <MyOrders />
    </>
  );
}
