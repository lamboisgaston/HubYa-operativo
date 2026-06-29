import type { SVGProps } from "react";

type HubyaBrandLogoProps = SVGProps<SVGSVGElement> & {
  showWordmark?: boolean;
  stacked?: boolean;
  markOnly?: boolean;
};

export function HubyaBrandLogo({
  showWordmark = true,
  stacked = false,
  markOnly = false,
  className = "",
  ...props
}: HubyaBrandLogoProps) {
  const renderWordmark = showWordmark && !markOnly;
  const width = renderWordmark ? (stacked ? 190 : 228) : 72;
  const height = renderWordmark ? (stacked ? 142 : 76) : 72;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="HUBYA"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <defs>
        <radialGradient id="hubya-brand-core" cx="50%" cy="50%" r="58%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="22%" stopColor="#C4B5FD" />
          <stop offset="55%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#111827" />
        </radialGradient>
        <linearGradient id="hubya-brand-orbit" x1="6" y1="60" x2="66" y2="10" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563EB" />
          <stop offset="0.45" stopColor="#8B5CF6" />
          <stop offset="1" stopColor="#F5F3FF" />
        </linearGradient>
        <linearGradient id="hubya-brand-word" x1="0" y1="0" x2="150" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#DDD6FE" />
          <stop offset="1" stopColor="#7DD3FC" />
        </linearGradient>
        <filter id="hubya-brand-glow" x="-55%" y="-55%" width="210%" height="210%">
          <feGaussianBlur stdDeviation="3.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g transform={stacked && renderWordmark ? "translate(59 3)" : "translate(2 2)"}>
        <path d="M12 36C18 13 55 5 64 23" fill="none" stroke="url(#hubya-brand-orbit)" strokeWidth="5" strokeLinecap="round" opacity="0.95" />
        <path d="M60 36C54 59 17 67 8 49" fill="none" stroke="url(#hubya-brand-orbit)" strokeWidth="5" strokeLinecap="round" opacity="0.95" />
        <path d="M18 15C31 27 43 46 54 59" fill="none" stroke="#312E81" strokeWidth="2.4" strokeLinecap="round" opacity="0.72" />
        <path d="M54 15C41 27 29 46 18 59" fill="none" stroke="#1D4ED8" strokeWidth="2.4" strokeLinecap="round" opacity="0.72" />

        <g filter="url(#hubya-brand-glow)">
          <circle cx="36" cy="36" r="23" fill="#05030B" stroke="#A78BFA" strokeWidth="1.8" />
          <circle cx="36" cy="36" r="16" fill="url(#hubya-brand-core)" opacity="0.96" />
          <path d="M28 24V48M44 24V48M29 36H43" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        </g>

        <g filter="url(#hubya-brand-glow)">
          <circle cx="12" cy="36" r="4.4" fill="#7DD3FC" />
          <circle cx="60" cy="36" r="4.4" fill="#C4B5FD" />
          <circle cx="23" cy="13" r="3.8" fill="#8B5CF6" />
          <circle cx="49" cy="59" r="3.8" fill="#FFFFFF" />
          <circle cx="55" cy="18" r="3.2" fill="#2563EB" />
          <circle cx="17" cy="54" r="3.2" fill="#A78BFA" />
        </g>
      </g>

      {renderWordmark && (
        <g transform={stacked ? "translate(0 93)" : "translate(86 19)"}>
          <text x={stacked ? 95 : 0} y="27" textAnchor={stacked ? "middle" : "start"} fill="url(#hubya-brand-word)" fontFamily="Arial, Helvetica, sans-serif" fontSize="34" fontWeight="900" letterSpacing="3">
            HUBYA
          </text>
          <path d={stacked ? "M43 42h73" : "M2 42h73"} stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
          <path d={stacked ? "M123 42h25" : "M83 42h25"} stroke="#7DD3FC" strokeWidth="4" strokeLinecap="round" />
          <text x={stacked ? 95 : 0} y="60" textAnchor={stacked ? "middle" : "start"} fill="#A5B4FC" fontFamily="Arial, Helvetica, sans-serif" fontSize="10" fontWeight="800" letterSpacing="2.2">
            RED DE HUBS
          </text>
        </g>
      )}
    </svg>
  );
}
