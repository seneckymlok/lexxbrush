import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description:
    "Shipping zones, delivery times, return policy, and refund information for Lexxbrush hand-airbrushed products. EU-wide shipping from Slovakia.",
  alternates: {
    canonical: `${baseUrl}/shipping`,
  },
};

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
