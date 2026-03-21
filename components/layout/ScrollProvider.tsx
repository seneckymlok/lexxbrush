"use client";

import { useEffect } from "react";

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cleanup: (() => void) | undefined;

    (async () => {
      const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] = await Promise.all([
        import("lenis"),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      gsap.registerPlugin(ScrollTrigger);

      const lenis = new Lenis({
        duration: 0.5,
        easing: (t) => 1 - Math.pow(1 - t, 2),
        smoothWheel: true,
      });

      lenis.on("scroll", ScrollTrigger.update);

      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);

      cleanup = () => {
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
