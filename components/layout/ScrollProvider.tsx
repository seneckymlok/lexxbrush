"use client";

import { useEffect } from "react";

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let rafId: number;

    (async () => {
      const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({
        duration: 0.4,
        easing: (t) => 1 - Math.pow(1 - t, 1.5),
        smoothWheel: true,
        touchMultiplier: 0.3,
      });

      lenis.on("scroll", ScrollTrigger.update);

      function raf(time: number) {
        lenis.raf(time);
        rafId = requestAnimationFrame(raf);
      }
      rafId = requestAnimationFrame(raf);

      cleanup = () => {
        cancelAnimationFrame(rafId);
        lenis.destroy();
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      };
    })();

    return () => {
      cleanup?.();
    };
  }, []);

  return <>{children}</>;
}
