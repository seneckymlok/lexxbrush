import type { Metadata } from "next";
import { getProduct, getProducts } from "@/lib/products";
import { ProductPageClient } from "./ProductPageClient";

// ISR — regenerate each product page at most once every 60 seconds so edits
// in the admin propagate without a redeploy. Admin mutations also call
// `revalidatePath('/product/[id]', 'page')` for instant updates.
export const revalidate = 60;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.com";

  if (!product) {
    return { title: "Product Not Found" };
  }

  const title = product.name.en;
  const description = product.description.en;
  const image = product.images[0];

  return {
    title,
    description,
    openGraph: {
      title: `${title} | Lexxbrush`,
      description,
      url: `${baseUrl}/product/${id}`,
      type: "website",
      images: [
        {
          url: image,
          width: 1200,
          height: 1200,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Lexxbrush`,
      description,
      images: [image],
    },
    alternates: {
      canonical: `${baseUrl}/product/${id}`,
    },
  };
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ id: product.id }));
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProduct(id);

  // JSON-LD Product structured data
  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name.en,
        description: product.description.en,
        image: product.images,
        brand: {
          "@type": "Brand",
          name: "Lexxbrush",
        },
        offers: {
          "@type": "Offer",
          price: product.price,
          priceCurrency: "EUR",
          availability: product.isSold
            ? "https://schema.org/SoldOut"
            : "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: "Lexxbrush",
          },
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductPageClient initialProduct={product} productId={id} />
    </>
  );
}
