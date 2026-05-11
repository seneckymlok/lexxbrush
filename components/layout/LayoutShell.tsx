"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Intro } from "@/components/layout/Intro";
import { RouteTransitionProvider } from "@/components/layout/RouteTransition";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const isInnerPage = !isAdmin && pathname !== "/";

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <RouteTransitionProvider>
      <div className="flex flex-col flex-1 relative z-10">
        {/* Dim overlay for inner pages — keeps hero-bg visible but more subdued */}
        {isInnerPage && (
          <div
            className="fixed inset-0 pointer-events-none z-[1]"
            style={{ background: "rgba(5,5,5,0.52)" }}
          />
        )}
        <Header />
        <main className="flex-1 relative z-[2]">{children}</main>
        <Footer />
        <Intro />
      </div>
    </RouteTransitionProvider>
  );
}
