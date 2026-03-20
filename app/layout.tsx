import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ScrollProvider } from "@/components/layout/ScrollProvider";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { CartProvider } from "@/components/providers/CartProvider";

export const metadata: Metadata = {
  title: "Lexxbrush — Hand-Airbrushed Wearable Art",
  description:
    "Every piece is unique. Hand-airbrushed clothing and accessories painted in Prague. Hoodies, tees, backpacks and more.",
  keywords: [
    "airbrush",
    "streetwear",
    "handmade",
    "custom clothing",
    "Prague",
    "wearable art",
    "lexxbrush",
  ],
  icons: {
    icon: "/characters/typecek1(png).webp",
    apple: "/characters/typecek1(png).webp",
  },
  openGraph: {
    title: "Lexxbrush — Hand-Airbrushed Wearable Art",
    description: "Every piece is unique. Painted by hand in Prague.",
    type: "website",
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
        {/* Critical: hide animated elements before ANY content paints.
            This inline <style> is in the HTML itself — parsed before body renders. */}
        <style dangerouslySetInnerHTML={{ __html: `[data-animate]{visibility:hidden!important}` }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=Instrument+Serif&display=swap"
          rel="stylesheet"
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
