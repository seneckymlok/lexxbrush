"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { AirbrushStar } from "@/components/ui/AirbrushStar";

export function BackgroundStars() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Keep it off the admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  // Handle proximity hover effect
  useEffect(() => {
    if (!containerRef.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return; // Disable on touch devices for performance

    const wrappers = containerRef.current.querySelectorAll<HTMLDivElement>(".star-wrapper");

    // Pre-calculate centers to save DOM reads, update on resize
    let starCenters = Array.from(wrappers).map((el) => {
      const rect = el.getBoundingClientRect();
      return { el, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    });

    const handleResize = () => {
      starCenters = Array.from(wrappers).map((el) => {
        const rect = el.getBoundingClientRect();
        return { el, x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      });
    };
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const mouseX = e.clientX;
      const mouseY = e.clientY;
      const maxDist = 200; // proximity radius

      starCenters.forEach(({ el, x, y }) => {
        const dist = Math.hypot(mouseX - x, mouseY - y);
        if (dist < maxDist) {
          // Mouse is near: scale up slightly, add a distinct glow/brightness
          const intensity = (maxDist - dist) / maxDist; // 0 to 1
          gsap.to(el, {
            scale: 1 + intensity * 0.4, // Max 1.4x scale
            rotation: intensity * 15,   // Rotate up to 15deg
            filter: `brightness(${1 + intensity * 0.8}) drop-shadow(0 0 ${10 + intensity * 20}px rgba(255,255,255,0.2))`,
            duration: 0.3,
            ease: "power2.out",
            overwrite: "auto",
          });
        } else {
          // Mouse is far: return to normal
          gsap.to(el, {
            scale: 1,
            rotation: 0,
            filter: "brightness(1) drop-shadow(0 0 0px rgba(255,255,255,0))",
            duration: 0.8,
            ease: "power3.out",
            overwrite: "auto",
          });
        }
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [pathname]);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-[30] pointer-events-none overflow-hidden mix-blend-screen"
      aria-hidden="true"
    >
      {/* Precision placed stars, acting as a global static framework */}
      
      {/* Top Left Cluster */}
      <div className="star-wrapper absolute top-[12%] left-[8%]"><AirbrushStar variant={2} className="w-8 h-8 text-white/40 opacity-[0.15] -rotate-[15deg]" /></div>
      <div className="star-wrapper absolute top-[25%] left-[15%]"><AirbrushStar variant={3} className="w-4 h-4 text-white/30 opacity-[0.2]" /></div>
      
      {/* Top Right Framework */}
      <div className="star-wrapper absolute top-[15%] right-[10%]"><AirbrushStar variant={1} className="w-12 h-12 text-white/50 opacity-[0.1] rotate-[10deg] scale-x-110" /></div>
      <div className="star-wrapper absolute top-[30%] right-[18%]"><AirbrushStar variant={3} className="w-6 h-6 text-white/40 opacity-[0.15] -rotate-[25deg]" /></div>

      {/* Mid Left Offset */}
      <div className="star-wrapper absolute top-[55%] left-[5%]"><AirbrushStar variant={1} className="w-10 h-10 text-white/55 opacity-[0.12] -rotate-[5deg]" /></div>
      <div className="star-wrapper absolute top-[48%] left-[22%]"><AirbrushStar variant={2} className="w-7 h-7 text-white/35 opacity-[0.12] rotate-[12deg]" /></div>

      {/* Mid Right Offset */}
      <div className="star-wrapper absolute top-[60%] right-[6%]"><AirbrushStar variant={2} className="w-9 h-9 text-white/45 opacity-[0.15] rotate-[20deg]" /></div>
      
      {/* Bottom Center-ish Framing */}
      <div className="star-wrapper absolute bottom-[20%] left-[35%]"><AirbrushStar variant={3} className="w-5 h-5 text-white/40 opacity-[0.1] rotate-[5deg]" /></div>
      <div className="star-wrapper absolute bottom-[15%] right-[25%]"><AirbrushStar variant={2} className="w-8 h-8 text-white/35 opacity-[0.15] -rotate-[18deg]" /></div>

      {/* Extreme Bottom Right */}
      <div className="star-wrapper absolute bottom-[5%] right-[8%]"><AirbrushStar variant={1} className="w-14 h-14 text-white/50 opacity-[0.15] rotate-[15deg] scale-y-110" /></div>
    </div>
  );
}
