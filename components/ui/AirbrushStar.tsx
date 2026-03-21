export function AirbrushStar({ className = "", variant = 1 }: { className?: string; variant?: 1 | 2 | 3 }) {
  const isV2 = variant === 2;
  const isV3 = variant === 3;

  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <filter id={`blur-ring-heavy-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={isV2 ? "8" : isV3 ? "5" : "6"} />
        </filter>
        <filter id={`blur-ring-light-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={isV2 ? "4" : isV3 ? "2.5" : "3"} />
        </filter>
        <filter id={`blur-cross-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation={isV2 ? "2" : isV3 ? "1" : "1.5"} />
        </filter>
      </defs>

      {/* Fuzzy concentric rings background */}
      <circle 
        cx={isV3 ? "48" : "50"} 
        cy={isV2 ? "52" : "50"} 
        r={isV2 ? "18" : isV3 ? "14" : "16"} 
        stroke="currentColor" strokeWidth="4" opacity="0.4" 
        filter={`url(#blur-ring-heavy-${variant})`} 
      />
      {variant !== 3 && (
        <circle 
          cx="50" cy="50" 
          r={isV2 ? "25" : "28"} 
          stroke="currentColor" strokeWidth={isV2 ? "2" : "3"} 
          opacity="0.3" 
          filter={`url(#blur-ring-light-${variant})`} 
        />
      )}
      
      {/* Blurred cross layer */}
      <g fill="currentColor" opacity={isV2 ? "0.5" : "0.6"} filter={`url(#blur-cross-${variant})`}>
        {isV2 ? (
          <>
            <path d="M50 15 L55 50 L50 85 L45 50 Z" />
            <path d="M15 50 L50 45 L85 50 L50 55 Z" />
          </>
        ) : isV3 ? (
          <>
            <path d="M48 8 L52 50 L48 92 L44 50 Z" />
            <path d="M8 48 L50 44 L92 48 L50 52 Z" />
          </>
        ) : (
          <>
            <path d="M50 10 L54 50 L50 90 L46 50 Z" />
            <path d="M10 50 L50 46 L90 50 L50 54 Z" />
          </>
        )}
      </g>
      
      {/* Sharp inner core cross */}
      <g fill="currentColor" opacity="0.9">
        {isV2 ? (
          <>
            <path d="M50 18 L51 50 L50 82 L49 50 Z" />
            <path d="M18 50 L50 49 L82 50 L50 51 Z" />
          </>
        ) : isV3 ? (
          <>
            <path d="M49 14 L50.5 50 L49 86 L47.5 50 Z" />
            <path d="M14 49 L50 47.5 L86 49 L50 50.5 Z" />
          </>
        ) : (
          <>
            <path d="M50 12 L52 50 L50 88 L48 50 Z" />
            <path d="M12 50 L50 48 L88 50 L50 52 Z" />
          </>
        )}
      </g>
      
      {/* Darker/brighter center dot */}
      <circle cx="50" cy="50" r={isV2 ? "3" : isV3 ? "1.5" : "2"} fill="currentColor" />
    </svg>
  );
}
