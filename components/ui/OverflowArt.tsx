"use client";

import { useRef, useEffect, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function OverflowArt() {
  const art1Ref = useRef<HTMLImageElement>(null);
  const art2Ref = useRef<HTMLImageElement>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useGSAP(() => {
    if (!isDesktop) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    [art1Ref.current, art2Ref.current].forEach((el) => {
      if (!el) return;
      gsap.to(el, {
        yPercent: -10,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.5,
        },
      });
    });
  }, { dependencies: [isDesktop] });

  if (!isDesktop) return null;

  const sharedStyles: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 2,
    opacity: 0.06,
    filter: "invert(1) brightness(1.3)",
    willChange: "transform",
  };

  return (
    <>
      {/* Character 1 — guitar monster, right edge */}
      <img
        ref={art1Ref}
        src="/characters/typecek1(png).png"
        alt=""
        aria-hidden="true"
        style={{
          ...sharedStyles,
          right: "-40px",
          top: "50%",
          width: "280px",
          height: "auto",
          maxWidth: "280px",
        }}
        loading="lazy"
      />

      {/* Character 2 — flame runner, left edge */}
      <img
        ref={art2Ref}
        src="/characters/typecek2(png).png"
        alt=""
        aria-hidden="true"
        style={{
          ...sharedStyles,
          left: "-60px",
          bottom: "8%",
          width: "240px",
          height: "auto",
          maxWidth: "240px",
        }}
        loading="lazy"
      />
    </>
  );
}
