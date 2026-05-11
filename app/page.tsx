import { ProductGrid } from "@/components/sections/ProductGrid";
import { getProducts } from "@/lib/products";

// ISR — regenerate the homepage at most once every 60 seconds so newly added
// or edited products show up without a redeploy. Admin mutations also call
// `revalidatePath('/')` for instant updates; this is the fallback ceiling.
export const revalidate = 60;

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="page-enter">
      <ProductGrid products={products} />
    </div>
  );
}
