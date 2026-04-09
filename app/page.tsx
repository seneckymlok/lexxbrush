import { HeroSection } from "@/components/sections/HeroSection";
import { ProductGrid } from "@/components/sections/ProductGrid";
import { getProducts } from "@/lib/products";

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="page-enter">
      <HeroSection products={products} />
      <ProductGrid products={products} />
    </div>
  );
}
