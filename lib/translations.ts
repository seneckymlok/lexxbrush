export type Locale = "en" | "sk";

export const translations = {
  en: {
    nav: {
      shop: "Shop",
      custom: "Custom Order",
      cart: "Cart",
    },
    hero: {
      tagline: "Hand-Airbrushed Wearable Art",
      subtitle: "Every piece is unique. Painted by hand in Prague.",
      cta: "Shop Collection",
    },
    shop: {
      title: "Collection",
      filter: "Filter",
      all: "All",
      oneOfAKind: "One of a Kind",
      addToCart: "Add to Cart",
      selectSize: "Select Size",
      sold: "Sold",
      viewDetails: "View Details",
    },
    product: {
      oneOfAKind: "One of a Kind",
      size: "Size",
      addToCart: "Add to Cart",
      sold: "Sold Out",
      backToShop: "Back to Shop",
      description: "Description",
      details: "Details",
      handPainted: "Hand-airbrushed",
      unique: "Unique piece",
      madeInPrague: "Made in Prague",
    },
    custom: {
      title: "Custom Order",
      subtitle: "Want something truly yours? Describe your vision and we'll bring it to life with airbrush.",
      name: "Your Name",
      email: "Your Email",
      description: "Describe Your Vision",
      descriptionPlaceholder: "Tell us what you want — colors, style, garment type, references...",
      garment: "Garment Type",
      garmentPlaceholder: "e.g. Hoodie, T-shirt, Backpack...",
      budget: "Budget Range",
      submit: "Send Request",
      success: "Request sent! We'll get back to you soon.",
      error: "Something went wrong. Please try again.",
    },
    cart: {
      title: "Cart",
      empty: "Your cart is empty",
      continueShopping: "Continue Shopping",
      remove: "Remove",
      total: "Total",
      checkout: "Checkout",
      size: "Size",
    },
    footer: {
      followUs: "Follow Us",
      instagram: "Instagram",
      madeBy: "Made by",
      rights: "All rights reserved.",
    },
  },
  sk: {
    nav: {
      shop: "Obchod",
      custom: "Na Zákazku",
      cart: "Košík",
    },
    hero: {
      tagline: "Ručne Airbrushované Nositeľné Umenie",
      subtitle: "Každý kus je unikát. Maľované ručne v Prahe.",
      cta: "Pozrieť Kolekciu",
    },
    shop: {
      title: "Kolekcia",
      filter: "Filter",
      all: "Všetko",
      oneOfAKind: "Unikát",
      addToCart: "Pridať do Košíka",
      selectSize: "Vybrať Veľkosť",
      sold: "Predané",
      viewDetails: "Zobraziť Detail",
    },
    product: {
      oneOfAKind: "Unikát",
      size: "Veľkosť",
      addToCart: "Pridať do Košíka",
      sold: "Vypredané",
      backToShop: "Späť do Obchodu",
      description: "Popis",
      details: "Detaily",
      handPainted: "Ručne airbrushované",
      unique: "Unikátny kus",
      madeInPrague: "Vyrobené v Prahe",
    },
    custom: {
      title: "Na Zákazku",
      subtitle: "Chceš niečo naozaj tvoje? Opíš svoju víziu a my ju airbrushom oživíme.",
      name: "Tvoje Meno",
      email: "Tvoj Email",
      description: "Opíš Svoju Víziu",
      descriptionPlaceholder: "Povedz nám, čo chceš — farby, štýl, typ oblečenia, referencie...",
      garment: "Typ Oblečenia",
      garmentPlaceholder: "napr. Mikina, Tričko, Batoh...",
      budget: "Cenový Rozsah",
      submit: "Odoslať Požiadavku",
      success: "Požiadavka odoslaná! Ozveme sa čoskoro.",
      error: "Niečo sa pokazilo. Skús to znova.",
    },
    cart: {
      title: "Košík",
      empty: "Tvoj košík je prázdny",
      continueShopping: "Pokračovať v Nákupe",
      remove: "Odstrániť",
      total: "Celkom",
      checkout: "Objednať",
      size: "Veľkosť",
    },
    footer: {
      followUs: "Sleduj Nás",
      instagram: "Instagram",
      madeBy: "Made by",
      rights: "Všetky práva vyhradené.",
    },
  },
} as const;

export function t(locale: Locale, path: string): string {
  const keys = path.split(".");
  let result: unknown = translations[locale];
  for (const key of keys) {
    if (result && typeof result === "object" && key in result) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return path;
    }
  }
  return result as string;
}
