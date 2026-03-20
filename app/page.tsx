import { HeroSection } from "@/components/sections/HeroSection";
import { SectionDivider } from "@/components/sections/SectionDivider";
import { ProductGrid } from "@/components/sections/ProductGrid";
import { getProducts } from "@/lib/products";

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="page-enter">
      <HeroSection products={products} />
      <SectionDivider />
      <ProductGrid products={products} />
    </div>
  );
}
