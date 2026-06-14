import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Choose a new password",
  description: "Set a new password for your Lexxbrush account.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
