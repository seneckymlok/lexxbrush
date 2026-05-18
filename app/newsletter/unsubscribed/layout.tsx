import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribed",
  description: "You've been unsubscribed from the Lexxbrush newsletter.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
