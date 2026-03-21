import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with Lexxbrush. Questions, collaborations, or custom orders.",
  openGraph: {
    title: "Contact | Lexxbrush",
    description: "Get in touch with Lexxbrush.",
    url: `${baseUrl}/contact`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact | Lexxbrush",
    description: "Get in touch with Lexxbrush.",
  },
  alternates: {
    canonical: `${baseUrl}/contact`,
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
