import Image from "next/image";

export type SuitType = "heart" | "diamond" | "club" | "spade";

const SUIT_FILES: Record<SuitType, string> = {
  heart:   "/suits/heart.webp",
  diamond: "/suits/diamond.webp",
  club:    "/suits/trojlist.webp",
  spade:   "/suits/sipka.webp",
};

interface SuitIconProps {
  suit: SuitType;
  className?: string;
  /** Kept for API compat — unused with PNG files */
  glow?: boolean;
}

export function SuitIcon({ suit, className = "" }: SuitIconProps) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src={SUIT_FILES[suit]}
        alt={suit}
        fill
        sizes="128px"
        className="object-contain"
      />
    </div>
  );
}
