import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lexxbrush",
  description: "Coming soon.",
  robots: { index: false, follow: false },
};

// Bare layout - skips Header/Footer/Intro that LayoutShell would render.
// The root layout still wraps it (html, body, providers).
export default function LockLayout({ children }: { children: React.ReactNode }) {
  return children;
}
