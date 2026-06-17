import { supabase } from "./supabase";

export interface Product {
  id: string;
  name: {
    en: string;
    sk: string;
  };
  description: {
    en: string;
    sk: string;
  };
  price: number;
  currency: string;
  images: string[];
  category: "hoodies" | "tees" | "pants" | "bags" | "accessories";
  sizes?: string[];
  isOneOfAKind: boolean;
  isSold: boolean;
  /** Gradient start hex - dominant accent extracted from first image. Falls back to brand purple. */
  accentColor?: string;
  /** Gradient end hex - hue-distant secondary accent. Falls back to a triadic shift of accentColor. */
  accentColorSecondary?: string;
  /** Scheduled-drop time (ISO, UTC). null = live now. Future = hidden until then. */
  releasedAt?: string | null;
  /** Manual catalog position, lowest first. null = unpositioned (floats to top). */
  sortOrder?: number | null;
}

// Transform Supabase row to Product interface
function toProduct(row: any): Product {
  return {
    id: row.id,
    name: { en: row.name_en, sk: row.name_sk },
    description: { en: row.description_en || "", sk: row.description_sk || "" },
    price: row.price / 100, // DB stores cents, display in euros
    currency: "EUR",
    images: row.images || [],
    category: row.category,
    sizes: row.sizes || undefined,
    isOneOfAKind: row.is_one_of_a_kind,
    isSold: row.is_sold,
    accentColor: row.accent_color || undefined,
    accentColorSecondary: row.accent_color_secondary || undefined,
    releasedAt: row.released_at ?? null,
    sortOrder: row.sort_order ?? null,
  };
}

/**
 * Catalog order: lowest sort_order first. Unpositioned products (null) float to
 * the top as "newest". Stable - equal positions keep the created_at-desc order
 * the SQL query already applied. Used everywhere products are listed publicly.
 */
export function compareByOrder(a: Product, b: Product): number {
  return (a.sortOrder ?? -1) - (b.sortOrder ?? -1);
}

/** A product is public once it has no release time, or that time has passed. */
function isReleased(releasedAt: string | null | undefined): boolean {
  if (!releasedAt) return true;
  return new Date(releasedAt).getTime() <= Date.now();
}

// Fetch all products from Supabase
export async function getProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("Error fetching products:", error);
    return [];
  }

  // Filter + sort in JS (not in the SQL query) on purpose: if this code ships
  // before the released_at / sort_order migrations run, those columns are simply
  // undefined → isReleased() is true and compareByOrder() falls back to the
  // created_at-desc order the query already applied → nothing breaks. A
  // query-level filter/order would instead error on the missing column and
  // empty the whole shop. Catalog is small, so the cost is negligible.
  return data
    .map(toProduct)
    .filter((p) => isReleased(p.releasedAt))
    .sort(compareByOrder);
}

// Fetch single product by ID (UUID or slug)
export async function getProduct(id: string): Promise<Product | undefined> {
  // Try by UUID first, then by slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq(isUUID ? "id" : "slug", id)
    .single();

  if (error || !data) {
    return undefined;
  }

  // Scheduled drops stay hidden on their own URL too - a future release_at
  // makes the detail page behave as "not found" until the drop goes live.
  const product = toProduct(data);
  if (!isReleased(product.releasedAt)) return undefined;
  return product;
}

export function getProductsByCategory(allProducts: Product[], category: string): Product[] {
  if (category === "all") return allProducts;
  return allProducts.filter((p) => p.category === category);
}

export const categories = [
  { id: "all", label: { en: "All", sk: "Všetko" } },
  { id: "hoodies", label: { en: "Hoodies", sk: "Mikiny" } },
  { id: "tees", label: { en: "Tees", sk: "Tričká" } },
  { id: "pants", label: { en: "Pants", sk: "Nohavice" } },
  { id: "bags", label: { en: "Bags", sk: "Tašky" } },
  { id: "accessories", label: { en: "Accessories", sk: "Doplnky" } },
] as const;

