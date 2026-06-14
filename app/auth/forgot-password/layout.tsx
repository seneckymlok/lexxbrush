import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset your password",
  description: "Request a link to reset your Lexxbrush password.",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
