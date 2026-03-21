"use client";

import { useRef, useCallback, cloneElement, isValidElement } from "react";

interface MagneticButtonProps {
  children: React.ReactElement;
  strength?: number;
}

export function MagneticButton({
  children,
  strength = 0.06,
}: MagneticButtonProps) {
  const ref = useRef<HTMLElement>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current || window.matchMedia("(pointer: coarse)").matches) return;

      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      ref.current.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
      ref.current.style.transition = "transform 0.15s ease-out";
    },
    [strength]
  );

  const handleMouseLeave = useCallback(() => {
    if (!ref.current) return;
    ref.current.style.transform = "translate(0, 0)";
    ref.current.style.transition = "transform 0.25s ease-out";
  }, []);

  if (!isValidElement(children)) return children;

  return cloneElement(children as React.ReactElement<any>, {
    ref,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  });
}
