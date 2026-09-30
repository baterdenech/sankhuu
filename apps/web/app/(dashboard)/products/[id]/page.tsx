import { notFound } from "next/navigation";
import { prisma } from "@sankhuu/db";
import { requireShop } from "@/lib/shop";
import { aiEnabled } from "@/lib/ai/product";
import { ProductForm } from "../product-form";
import { archiveProduct, updateProduct } from "../actions";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { shop } = await requireShop();
  const { id } = await params;
  const product = await prisma.product.findFirst({ where: { id, shopId: shop.id, isActive: true } });
  if (!product) notFound();

  const update = updateProduct.bind(null, product.id);
  const archive = archiveProduct.bind(null, product.id);

  return (
    <div className="narrow">
      <h1>Бараа засах</h1>
      <ProductForm action={update} ai={aiEnabled()} submitLabel="Хадгалах" product={product} />
      <form action={archive} className="danger-zone">
        <button type="submit" className="link-button danger">
          Барааг жагсаалтаас хасах
        </button>
      </form>
    </div>
  );
}
