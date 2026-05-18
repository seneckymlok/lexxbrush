import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Invalid link",
  description: "This newsletter link is no longer valid.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
