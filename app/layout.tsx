import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollProvider } from "@/components/layout/ScrollProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { CartProvider } from "@/components/providers/CartProvider";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.com";

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Lexxbrush — Hand-Airbrushed Wearable Art from Prague",
    template: "%s | Lexxbrush",
  },
  description:
    "Every piece is unique. Hand-airbrushed streetwear painted in Prague — hoodies, tees, backpacks and custom orders. One-of-a-kind wearable art.",
  keywords: [
    "airbrush",
    "streetwear",
    "handmade",
    "custom clothing",
    "Prague",
    "wearable art",
    "lexxbrush",
    "hand painted",
    "custom streetwear",
    "airbrushed hoodie",
    "unique fashion",
    "Czech Republic",
  ],
  authors: [{ name: "Lexxbrush", url: baseUrl }],
  creator: "Lexxbrush",
  publisher: "Lexxbrush",
  icons: {
    icon: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    title: "Lexxbrush — Hand-Airbrushed Wearable Art",
    description:
      "Every piece is unique. Hand-airbrushed streetwear painted by hand in Prague.",
    url: baseUrl,
    siteName: "Lexxbrush",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 675,
        alt: "Lexxbrush — Hand-Airbrushed Wearable Art",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lexxbrush — Hand-Airbrushed Wearable Art",
    description:
      "Every piece is unique. Hand-airbrushed streetwear painted by hand in Prague.",
    images: ["/logo.png"],
  },
  alternates: {
    canonical: baseUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <head>
        {/* Critical: hide animated elements before ANY content paints */}
        <style dangerouslySetInnerHTML={{ __html: `[data-animate]{visibility:hidden!important}` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://nfvocdkvtaittmvbmaoq.supabase.co" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Instrument+Serif&display=swap"
          rel="stylesheet"
        />
        {/* JSON-LD Organization structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Lexxbrush",
              url: baseUrl,
              logo: `${baseUrl}/logo.png`,
              description: "Hand-airbrushed wearable art from Prague. Every piece is unique.",
              address: {
                "@type": "PostalAddress",
                addressLocality: "Prague",
                addressCountry: "CZ",
              },
              sameAs: ["https://www.instagram.com/lexxbrush"],
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-void text-text">
        <LanguageProvider>
          <CartProvider>
            <ScrollProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </ScrollProvider>
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
