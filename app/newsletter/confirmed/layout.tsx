import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Newsletter confirmed",
  description: "You're on the list - thanks for subscribing to Lexxbrush.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
