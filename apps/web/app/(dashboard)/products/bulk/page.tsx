import Link from "next/link";
import { requireShop } from "@/lib/shop";
import { aiEnabled } from "@/lib/ai/product";
import { BulkForm } from "./bulk-form";

export const dynamic = "force-dynamic";

// Олон зургаас нэг дор бараа бүртгэх
export default async function BulkProductsPage() {
  await requireShop();
  return (
    <>
      <div className="page-head">
        <h1>Олноор нэмэх</h1>
        <Link href="/products" className="btn">
          ← Бараа
        </Link>
      </div>
      <BulkForm ai={aiEnabled()} />
    </>
  );
}
