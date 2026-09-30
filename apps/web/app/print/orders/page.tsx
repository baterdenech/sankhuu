import { prisma } from "@sankhuu/db";
import { requireShop } from "@/lib/shop";
import { orderInclude, orderWhere, parseOrderQuery } from "@/lib/order-query";
import { PrintBar } from "../print-bar";
import { OrderSlip } from "./slip";

type SP = {
  id?: string;
  tab?: string;
  q?: string;
  range?: string;
  from?: string;
  to?: string;
};

// Хүргэлтийн хуудас: захиалга бүрт нэг (жолоочид өгөх / савлагаанд наах). `?id=` нэг захиалга, эсвэл жагсаалтын шүүлтээр 100 хүртэл.
export default async function PrintOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const { shop } = await requireShop();
  const sp = await searchParams;
  const where = sp.id
    ? { id: sp.id, shopId: shop.id }
    : orderWhere(shop.id, parseOrderQuery(sp));
  const orders = await prisma.order.findMany({
    where,
    include: orderInclude,
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <>
      <PrintBar count={orders.length} />
      {orders.length === 0 && (
        <p className="print-empty">Хэвлэх захиалга алга.</p>
      )}
      {orders.map((o) => (
        <OrderSlip key={o.id} shop={shop} order={o} />
      ))}
    </>
  );
}
