import { draftMode } from "next/headers";
import { ProductGrid } from "@/components/sections/ProductGrid";
import { AdminPreviewBar } from "@/components/layout/AdminPreviewBar";
import { getProducts } from "@/lib/products";

// ISR - regenerate the homepage at most once every 60 seconds so newly added
// or edited products show up without a redeploy. Admin mutations also call
// `revalidatePath('/')` for instant updates; this is the fallback ceiling.
export const revalidate = 60;

export default async function Home() {
  // Draft mode (admin preview) shows scheduled drops. Normal visitors have no
  // bypass cookie, so isEnabled is false and the page stays statically cached.
  const { isEnabled: preview } = await draftMode();
  const products = await getProducts({ includeUnreleased: preview });

  return (
    <div className="page-enter">
      {preview && <AdminPreviewBar />}
      <ProductGrid products={products} />
    </div>
  );
}
