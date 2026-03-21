import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms and conditions for purchasing hand-airbrushed products from Lexxbrush, s. r. o. — ordering, payment, shipping, returns, and more.",
  alternates: {
    canonical: `${baseUrl}/terms`,
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
