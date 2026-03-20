import { HeroSection } from "@/components/sections/HeroSection";
import { SectionDivider } from "@/components/sections/SectionDivider";
import { ProductGrid } from "@/components/sections/ProductGrid";

export default function Home() {
  return (
    <div className="page-enter">
      <HeroSection />
      <SectionDivider />
      <ProductGrid />
    </div>
  );
}
