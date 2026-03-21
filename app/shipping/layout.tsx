import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";

export const metadata: Metadata = {
  title: "Shipping & Returns",
  description:
    "Shipping, delivery, and return policy for Lexxbrush. EU-wide shipping from Slovakia.",
  alternates: {
    canonical: `${baseUrl}/shipping`,
  },
};

export default function ShippingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
