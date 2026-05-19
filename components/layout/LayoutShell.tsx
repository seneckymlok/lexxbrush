"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Intro } from "@/components/layout/Intro";
import { RouteTransitionProvider } from "@/components/layout/RouteTransition";

export function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  // The middleware rewrites "/" → "/lock" when locked, so pathname stays "/".
  // Detect lock mode via the cookie the middleware sets on that rewrite.
  const isLockCookie =
    typeof document !== "undefined" && /lexx-locked=1/.test(document.cookie);
  const isLock = pathname === "/lock" || isLockCookie;
  const isInnerPage = !isAdmin && !isLock && pathname !== "/";

  // If the user is anywhere other than "/", mark the intro as seen so that
  // any subsequent navigation home (logo, footer, "back to shop", 404, etc.)
  // lands without replaying the intro. The intro is meant to fire once per
  // session for first-time visitors landing on the homepage, not as a gate
  // between internal pages.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname === "/" || isAdmin || isLock) return;
    try {
      sessionStorage.setItem("lexxbrush:intro-seen", "1");
    } catch {}
  }, [pathname, isAdmin, isLock]);

  if (isAdmin || isLock) {
    return <>{children}</>;
  }

  return (
    <RouteTransitionProvider>
      <div className="flex flex-col flex-1 relative z-10">
        {/* Dim overlay for inner pages - keeps hero-bg visible but more subdued */}
        {isInnerPage && (
          <div
            className="fixed inset-0 pointer-events-none z-[1]"
            style={{ background: "rgba(5,5,5,0.52)" }}
          />
        )}
        <Header />
        <main
          className="flex-1 flex flex-col relative z-[2]"
          style={{
            // Shift page content down by the same safe-area inset that the
            // header now reserves at top, so content never scrolls under the
            // notch-extended header. Zero on non-iOS, no visible effect.
            paddingTop:
              "max(env(safe-area-inset-top, 0px), constant(safe-area-inset-top, 0px), 0px)",
          }}
        >
          {children}
        </main>
        <Footer />
        <Intro />
      </div>
    </RouteTransitionProvider>
  );
}
