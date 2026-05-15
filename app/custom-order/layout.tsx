import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";

export const metadata: Metadata = {
  title: "Custom Order",
  description:
    "Commission your own hand-airbrushed piece. Custom hoodies, tees, jackets and more - each one painted by hand.",
  openGraph: {
    title: "Custom Order | Lexxbrush",
    description: "Commission your own hand-airbrushed piece.",
    url: `${baseUrl}/custom-order`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Custom Order | Lexxbrush",
    description: "Commission your own hand-airbrushed piece.",
  },
  alternates: {
    canonical: `${baseUrl}/custom-order`,
  },
};

export default function CustomOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
