import type { Metadata, Viewport } from "next";
import { Syne, Inter } from "next/font/google";
import "./globals.css";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { ScrollProvider } from "@/components/layout/ScrollProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { FavoritesProvider } from "@/components/providers/FavoritesProvider";
import { BackgroundStars } from "@/components/ui/BackgroundStars";

const syne = Syne({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-inter",
  display: "swap",
});

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  width: "device-width",
  initialScale: 1,
  // Extend layout under the iOS status bar / notch so `env(safe-area-inset-*)`
  // resolves to real values. Without this, the safe-area insets are all 0
  // and our header would sit under the status bar.
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Lexxbrush",
    template: "%s | Lexxbrush",
  },
  description:
    "Every piece is unique. Hand-airbrushed streetwear painted entirely by hand. Hoodies, tees, backpacks and custom orders. One of a kind wearable art.",
  keywords: [
    "44lexx",
    "lexxbrush",
    "airbrush",
    "streetwear",
    "handmade",
    "custom clothing",
    "wearable art",
    "lexxbrush",
    "hand painted",
    "one of a kind",
    "ručne maľované",
    "airbrush oblečenie",
    "unikátna móda",
    "slovenský streetwear",
    "custom mikiny",
    "ručná maľba",
    "Slovakia",
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
      "Every piece is unique. Hand-airbrushed streetwear painted entirely by hand.",
    url: baseUrl,
    siteName: "Lexxbrush",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo-new.png",
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
      "Every piece is unique. Hand-airbrushed streetwear painted entirely by hand.",
    images: ["/logo-new.png"],
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
    <html lang="en" className={`antialiased ${syne.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Critical: hide animated elements before ANY content paints */}
        <style dangerouslySetInnerHTML={{ __html: `[data-animate]{visibility:hidden!important}html.intro-pending body{visibility:hidden}html.intro-pending [data-intro]{visibility:visible}` }} />
        {/* Synchronously decide whether the intro is about to play.
            If yes, mark <html> so the body is invisible until the Intro overlay paints.
            Runs before body parses — no flash of homepage content. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(location.pathname==='/'&&!sessionStorage.getItem('lexxbrush:intro-seen')){document.documentElement.classList.add('intro-pending')}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://nfvocdkvtaittmvbmaoq.supabase.co" crossOrigin="anonymous" />
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
              description: "Hand-airbrushed wearable art, made entirely by hand. Every piece is unique.",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Stará ulica 38/27",
                addressLocality: "Slovenská Kajňa",
                postalCode: "094 02",
                addressCountry: "SK",
              },
              sameAs: ["https://www.instagram.com/lexxbrush"],
            }),
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col text-text">
        <BackgroundStars />
        <LanguageProvider>
          <AuthProvider>
            <FavoritesProvider>
              <CartProvider>
                <ScrollProvider>
                  <LayoutShell>{children}</LayoutShell>
                </ScrollProvider>
              </CartProvider>
            </FavoritesProvider>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
