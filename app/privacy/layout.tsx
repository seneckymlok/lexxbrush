import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://lexxbrush.eu";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Lexxbrush, s. r. o. collects, uses, and protects your personal data. GDPR-compliant privacy policy for our hand-airbrushed wearable art store.",
  alternates: {
    canonical: `${baseUrl}/privacy`,
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
