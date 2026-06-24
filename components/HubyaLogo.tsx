import type { SVGProps } from "react";

type HubyaLogoProps = SVGProps<SVGSVGElement> & {
  showWordmark?: boolean;
  stacked?: boolean;
};

export function HubyaLogo({ showWordmark = true, stacked = false, className = "", ...props }: HubyaLogoProps) {
  const width = showWordmark ? (stacked ? 168 : 196) : 56;
  const height = showWordmark ? (stacked ? 118 : 64) : 56;

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
        <linearGradient id="hubya-orbit" x1="8" y1="52" x2="64" y2="8" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E8F4D" />
          <stop offset="0.35" stopColor="#22C7E8" />
          <stop offset="0.68" stopColor="#FFD447" />
          <stop offset="1" stopColor="#FF9F1C" />
        </linearGradient>
        <linearGradient id="hubya-core" x1="19" y1="18" x2="47" y2="49" gradientUnits="userSpaceOnUse">
          <stop stopColor="#16324F" />
          <stop offset="1" stopColor="#0B1726" />
        </linearGradient>
      </defs>

      <g transform={stacked ? "translate(56 4)" : "translate(4 4)"}>
        <ellipse cx="28" cy="28" rx="28" ry="14" fill="none" stroke="url(#hubya-orbit)" strokeWidth="7" strokeLinecap="round" transform="rotate(-24 28 28)" />
        <circle cx="28" cy="28" r="16" fill="url(#hubya-core)" />
        <circle cx="39" cy="13" r="5" fill="#FF9F1C" />
        <circle cx="11" cy="38" r="4.5" fill="#1E8F4D" />
        <circle cx="47" cy="41" r="3.5" fill="#22C7E8" />
        <path d="M23 23c4-4 11-3 15 2" stroke="#E8F6FF" strokeWidth="3" strokeLinecap="round" opacity="0.78" />
      </g>

      {showWordmark && (
        <g transform={stacked ? "translate(0 82)" : "translate(74 18)"}>
          <text x={stacked ? 84 : 0} y="22" textAnchor={stacked ? "middle" : "start"} fill="#0B1726" fontFamily="Arial, Helvetica, sans-serif" fontSize="30" fontWeight="900" letterSpacing="2.5">
            HUBYA
          </text>
          <path d={stacked ? "M45 33h78" : "M2 32h72"} stroke="#1E8F4D" strokeWidth="4" strokeLinecap="round" />
          <path d={stacked ? "M126 33h18" : "M80 32h18"} stroke="#FF9F1C" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
