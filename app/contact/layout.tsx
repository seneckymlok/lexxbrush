import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";

export const metadata: Metadata = {
  title: "Contact — Get in Touch",
  description:
    "Have a question, want to collaborate, or commission a custom piece? Reach out to Lexxbrush — hand-airbrushed wearable art from Slovakia.",
  openGraph: {
    title: "Contact | Lexxbrush",
    description: "Get in touch with Lexxbrush for custom orders, collaborations, or questions.",
    url: `${baseUrl}/contact`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact | Lexxbrush",
    description: "Get in touch with Lexxbrush for custom orders, collaborations, or questions.",
  },
  alternates: {
    canonical: `${baseUrl}/contact`,
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
