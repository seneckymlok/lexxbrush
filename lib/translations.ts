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
      subtitle: "Every piece is unique. Painted entirely by hand.",
      cta: "Shop Collection",
    },
    shop: {
      title: "Collection",
      filter: "Filter",
      all: "All",
      oneOfAKind: "1 of 1",
      addToCart: "Add to Cart",
      selectSize: "Select Size",
      sold: "Sold",
      viewDetails: "View Details",
    },
    product: {
      oneOfAKind: "1 of 1",
      size: "Size",
      addToCart: "Add to Cart",
      sold: "Sold Out",
      backToShop: "Back to Shop",
      description: "Description",
      details: "Details",
      handPainted: "Hand-airbrushed",
      unique: "Unique piece",
      madeByHand: "Made by hand",
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
    checkout: {
      title: "Checkout",
      contact: "Contact",
      shipping: "Shipping Address",
      email: "Email",
      name: "Full Name",
      address: "Address",
      address2: "Apt, suite, etc. (optional)",
      city: "City",
      postalCode: "Postal Code",
      country: "Country",
      orderSummary: "Order Summary",
      placeOrder: "Place Order",
      pay: "Continue to Payment",
      processing: "Processing...",
      backToCart: "Back to Cart",
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
      subtitle: "Každý kus je unikát. Maľované úplne ručne.",
      cta: "Pozrieť Kolekciu",
    },
    shop: {
      title: "Kolekcia",
      filter: "Filter",
      all: "Všetko",
      oneOfAKind: "1 of 1",
      addToCart: "Pridať do Košíka",
      selectSize: "Vybrať Veľkosť",
      sold: "Predané",
      viewDetails: "Zobraziť Detail",
    },
    product: {
      oneOfAKind: "1 of 1",
      size: "Veľkosť",
      addToCart: "Pridať do Košíka",
      sold: "Vypredané",
      backToShop: "Späť do Obchodu",
      description: "Popis",
      details: "Detaily",
      handPainted: "Ručne airbrushované",
      unique: "Unikátny kus",
      madeByHand: "Vyrobené ručne",
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
    checkout: {
      title: "Objednávka",
      contact: "Kontakt",
      shipping: "Doručovacia Adresa",
      email: "Email",
      name: "Celé Meno",
      address: "Adresa",
      address2: "Byt, poschodie, atď. (voliteľné)",
      city: "Mesto",
      postalCode: "PSČ",
      country: "Krajina",
      orderSummary: "Súhrn Objednávky",
      placeOrder: "Objednať",
      pay: "Pokračovať k Platbe",
      processing: "Spracováva sa...",
      backToCart: "Späť do Košíka",
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
