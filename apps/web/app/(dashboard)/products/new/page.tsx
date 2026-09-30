import { aiEnabled } from "@/lib/ai/product";
import { ProductForm } from "../product-form";
import { createProduct } from "../actions";

export default function NewProductPage() {
  return (
    <div className="narrow">
      <h1>Бараа нэмэх</h1>
      <ProductForm action={createProduct} ai={aiEnabled()} submitLabel="Бараа нэмэх" />
    </div>
  );
}
