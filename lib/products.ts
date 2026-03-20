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
    return fallbackProducts;
  }

  return data.length > 0 ? data.map(toProduct) : fallbackProducts;
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
    return fallbackProducts.find((p) => p.id === id);
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

// Fallback products (used when Supabase is empty or unavailable)
const fallbackProducts: Product[] = [
  {
    id: "acid-hearts-tee",
    name: { en: "Acid Hearts Tee", sk: "Acid Hearts Tričko" },
    description: {
      en: "Hand-airbrushed character art with hearts and playing card motifs on acid-washed brown cotton. One of a kind piece.",
      sk: "Ručne airbrushovaná postavička so srdciami a kartovými motívmi na acid-wash hnedom bavlnenom tričku. Jedinečný kus.",
    },
    price: 189,
    currency: "EUR",
    images: ["/products/tshirt1.png"],
    category: "tees",
    isOneOfAKind: true,
    isSold: false,
  },
  {
    id: "tropical-ride-tee",
    name: { en: "Tropical Ride Tee", sk: "Tropical Ride Tričko" },
    description: {
      en: "Vibrant sunset scene with custom car, hibiscus flowers and flowing script. Airbrushed on white oversized tee.",
      sk: "Farebá scéna so západom slnka, autom, ibištekmi a plynúlym písmom. Airbrushované na bielom oversized tričku.",
    },
    price: 169,
    currency: "EUR",
    images: ["/products/tshirt2.png"],
    category: "tees",
    isOneOfAKind: true,
    isSold: false,
  },
  {
    id: "spiky-grin-tee",
    name: { en: "Spiky Grin Tee", sk: "Spiky Grin Tričko" },
    description: {
      en: "Wild character with spiked crown and neon glow. Hand-airbrushed on white cotton with graffiti tag detail.",
      sk: "Divá postavička s ostnatým korunou a neónovým žiarením. Ručne airbrushované na bielej bavlne s graffiti tagom.",
    },
    price: 169,
    currency: "EUR",
    images: ["/products/tshirt3.png"],
    category: "tees",
    isOneOfAKind: true,
    isSold: false,
  },
  {
    id: "chrome-grille-hoodie",
    name: { en: "Chrome Grille Hoodie", sk: "Chrome Grille Mikina" },
    description: {
      en: "Photorealistic chrome car grille airbrushed on heavyweight black hoodie.",
      sk: "Fotorealistická chrómová mriežka auta airbrushovaná na ťažkej čiernej mikine.",
    },
    price: 249,
    currency: "EUR",
    images: ["/products/hoodie1.png"],
    category: "hoodies",
    sizes: ["M", "L", "XL"],
    isOneOfAKind: false,
    isSold: false,
  },
  {
    id: "pink-flame-zip",
    name: { en: "Pink Flame Zip-Up", sk: "Pink Flame Zipsák" },
    description: {
      en: "Bold pink and black lettering with flame effect across the chest. Airbrushed on grey zip-up hoodie.",
      sk: "Výrazné ružové a čierne písmo s efektom plameňov cez hrudník. Airbrushované na šedej mikine na zips.",
    },
    price: 229,
    currency: "EUR",
    images: ["/products/hoodie2.png"],
    category: "hoodies",
    isOneOfAKind: true,
    isSold: false,
  },
];
