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
  };
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

  return data.map(toProduct);
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

  return toProduct(data);
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

