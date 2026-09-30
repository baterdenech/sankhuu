import Link from "next/link";
import { prisma } from "@sankhuu/db";
import { requireShop } from "@/lib/shop";
import { ManualOrderForm } from "./order-form";

export const dynamic = "force-dynamic";

// Утсаар / чатаар ирсэн захиалгыг худалдагч гараар бүртгэнэ
export default async function NewOrderPage() {
  const { shop } = await requireShop();
  const products = await prisma.product.findMany({ where: { shopId: shop.id, isActive: true }, select: { id: true, name: true, price: true, stock: true }, orderBy: [{ stock: "desc" }, { name: "asc" }] });
  return (
    <>
      <div className="page-head">
        <h1>Захиалга бүртгэх</h1>
        <Link href="/orders" className="btn">
          ← Захиалга
        </Link>
      </div>
      <p className="muted" style={{ marginTop: -8 }}>Утсаар, чатаар ирсэн захиалгыг энд бүртгэвэл Sankhuu хүргэж, худалдан авагчид SMS илгээнэ.</p>
      {products.length === 0 ? (
        <div className="empty">
          <p>Эхлээд бараагаа бүртгэнэ үү.</p>
          <Link href="/products/new" className="btn primary">
            Бараа нэмэх
          </Link>
        </div>
      ) : (
        <div className="card narrow">
          <ManualOrderForm products={products} />
        </div>
      )}
    </>
  );
}
