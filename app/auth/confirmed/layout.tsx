import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Email confirmed",
  description: "Your Lexxbrush account is verified.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
