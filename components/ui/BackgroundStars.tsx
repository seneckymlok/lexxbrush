"use client";

import { useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { AirbrushStar } from "@/components/ui/AirbrushStar";

export function BackgroundStars() {
  const containerRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Keep it off the admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    
    // Smooth parity-based parallax logic
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      // Calculate from center of screen to get balanced distribution
      const xPercent = (e.clientX / window.innerWidth) - 0.5;
      const yPercent = (e.clientY / window.innerHeight) - 0.5;

      // Layer 1 moves the most, layer 3 moves the least to create depth
      gsap.to(".bg-star-l1", { x: xPercent * -60, y: yPercent * -60, duration: 1.5, ease: "power2.out", overwrite: "auto" });
      gsap.to(".bg-star-l2", { x: xPercent * -30, y: yPercent * -30, duration: 1.5, ease: "power2.out", overwrite: "auto" });
      gsap.to(".bg-star-l3", { x: xPercent * -15, y: yPercent * -15, duration: 1.5, ease: "power2.out", overwrite: "auto" });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef} 
      // inset is extended to -10% so parallax movement doesn't reveal edges
      className="fixed inset-[-10%] z-0 pointer-events-none overflow-hidden mix-blend-screen"
      aria-hidden="true"
    >
      {/* LAYER 3 (Furthest, moves least, smallest/dimmest) */}
      <div className="absolute inset-0 bg-star-l3">
        {/* We use float animations defined in globals.css for organic movement */}
        <div className="absolute top-[10%] left-[8%] animate-float-slow"><AirbrushStar variant={3} className="w-4 h-4 text-white/30 opacity-[0.2] rotate-[15deg]" /></div>
        <div className="absolute top-[60%] left-[85%] animate-float-slower"><AirbrushStar variant={3} className="w-5 h-5 text-white/25 opacity-[0.15] -rotate-[10deg]" /></div>
        <div className="absolute top-[85%] left-[20%] animate-float-slow"><AirbrushStar variant={3} className="w-6 h-6 text-white/20 opacity-[0.1] rotate-[35deg]" /></div>
        <div className="absolute top-[30%] left-[70%] animate-float-slower"><AirbrushStar variant={3} className="w-4 h-4 text-white/30 opacity-[0.2] -rotate-[25deg]" /></div>
        <div className="absolute top-[5%] left-[50%] animate-float-slow"><AirbrushStar variant={3} className="w-3 h-3 text-white/40 opacity-[0.1] rotate-[5deg]" /></div>
      </div>

      {/* LAYER 2 (Mid-ground) */}
      <div className="absolute inset-0 bg-star-l2">
        <div className="absolute top-[25%] left-[15%] animate-float"><AirbrushStar variant={2} className="w-8 h-8 text-white/40 opacity-[0.15] scale-x-125 -rotate-[12deg]" /></div>
        <div className="absolute top-[75%] left-[10%] animate-float-slow"><AirbrushStar variant={2} className="w-7 h-7 text-white/35 opacity-[0.12] scale-y-110 rotate-[20deg]" /></div>
        <div className="absolute top-[15%] left-[80%] animate-float"><AirbrushStar variant={2} className="w-9 h-9 text-white/40 opacity-[0.2] scale-x-110 rotate-[8deg]" /></div>
        <div className="absolute top-[65%] left-[65%] animate-float-slow"><AirbrushStar variant={2} className="w-6 h-6 text-white/45 opacity-[0.15] scale-y-125 -rotate-[18deg]" /></div>
      </div>

      {/* LAYER 1 (Closest, moves most, biggest/brightest) */}
      <div className="absolute inset-0 bg-star-l1">
        <div className="absolute top-[50%] left-[5%] animate-pulse-slow"><AirbrushStar variant={1} className="w-12 h-12 text-white/60 -rotate-[5deg]" /></div>
        <div className="absolute top-[85%] left-[85%] animate-float"><AirbrushStar variant={1} className="w-14 h-14 text-white/50 opacity-[0.15] rotate-[15deg] scale-x-110" /></div>
        <div className="absolute top-[40%] left-[90%] animate-pulse-slow"><AirbrushStar variant={1} className="w-10 h-10 text-white/55 -rotate-[22deg] scale-y-110" /></div>
      </div>
    </div>
  );
}
