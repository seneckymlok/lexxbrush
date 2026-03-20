import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.com";

export const metadata: Metadata = {
  title: "Custom Order — Get Your Own Airbrushed Piece",
  description:
    "Commission a one-of-a-kind hand-airbrushed piece. Tell us your vision and we'll paint it in Prague. Custom hoodies, tees, jackets and more.",
  openGraph: {
    title: "Custom Order | Lexxbrush",
    description: "Commission your own hand-airbrushed wearable art from Prague.",
    url: `${baseUrl}/custom-order`,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Custom Order | Lexxbrush",
    description: "Commission your own hand-airbrushed wearable art from Prague.",
  },
  alternates: {
    canonical: `${baseUrl}/custom-order`,
  },
};

export default function CustomOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
