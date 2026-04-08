/**
 * Spray-paint style card suit icons — brand identity elements.
 * Each suit has its own color matching the hand-airbrushed originals:
 *   heart = purple, diamond = cyan, club = yellow, spade = blue
 */
export type SuitType = "heart" | "diamond" | "club" | "spade";

const SUIT_COLORS: Record<SuitType, { fill: string; glow: string }> = {
  heart:   { fill: "#9B30FF", glow: "rgba(155, 48, 255, 0.6)" },
  diamond: { fill: "#00E5CC", glow: "rgba(0, 229, 204, 0.6)" },
  club:    { fill: "#E8E030", glow: "rgba(232, 224, 48, 0.6)" },
  spade:   { fill: "#2060FF", glow: "rgba(32, 96, 255, 0.6)" },
};

interface SuitIconProps {
  suit: SuitType;
  className?: string;
  /** Add the spray-paint glow effect */
  glow?: boolean;
}

export function SuitIcon({ suit, className = "", glow = true }: SuitIconProps) {
  const { fill, glow: glowColor } = SUIT_COLORS[suit];
  const filterId = `spray-${suit}`;
  const glowId = `glow-${suit}`;

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Spray paint texture — grainy, organic edges */}
        <filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" seed="2" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feComponentTransfer in="grayNoise" result="threshold">
            <feFuncA type="discrete" tableValues="0 0 0 0 1 1 1 1" />
          </feComponentTransfer>
          <feComposite in="SourceGraphic" in2="threshold" operator="in" result="sprayed" />
          <feGaussianBlur in="sprayed" stdDeviation="0.8" />
        </filter>
        {glow && (
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        )}
      </defs>

      {/* Outer glow layer */}
      {glow && (
        <g opacity="0.4" filter={`url(#${glowId})`}>
          <SuitPath suit={suit} fill={fill} />
        </g>
      )}

      {/* Dark outline / shadow */}
      <g opacity="0.7" transform="translate(0, 1)">
        <SuitPath suit={suit} fill="#111" />
      </g>

      {/* Main colored shape with spray texture */}
      <g filter={`url(#${filterId})`}>
        <SuitPath suit={suit} fill={fill} />
      </g>

      {/* Inner highlight for depth */}
      <g opacity="0.3" transform="scale(0.7) translate(21, 21)">
        <SuitPath suit={suit} fill="#fff" />
      </g>
    </svg>
  );
}

/** Individual suit shape paths */
function SuitPath({ suit, fill }: { suit: SuitType; fill: string }) {
  switch (suit) {
    case "heart":
      return (
        <path
          d="M50 85 C50 85 15 60 15 38 C15 25 25 18 35 18 C42 18 47 22 50 28 C53 22 58 18 65 18 C75 18 85 25 85 38 C85 60 50 85 50 85Z"
          fill={fill}
        />
      );
    case "diamond":
      return (
        <path
          d="M50 12 L78 50 L50 88 L22 50 Z"
          fill={fill}
        />
      );
    case "club":
      return (
        <path
          d="M50 18 C58 18 65 25 65 33 C65 38 62 42 58 44 C64 44 72 48 72 58 C72 65 66 70 59 70 C54 70 50 66 50 66 C50 66 46 70 41 70 C34 70 28 65 28 58 C28 48 36 44 42 44 C38 42 35 38 35 33 C35 25 42 18 50 18Z M45 70 L45 85 L55 85 L55 70"
          fill={fill}
          fillRule="evenodd"
        />
      );
    case "spade":
      return (
        <path
          d="M50 12 C50 12 15 45 15 62 C15 72 23 78 32 78 C40 78 46 73 50 68 C54 73 60 78 68 78 C77 78 85 72 85 62 C85 45 50 12 50 12Z M45 78 L45 88 L55 88 L55 78"
          fill={fill}
          fillRule="evenodd"
        />
      );
  }
}
