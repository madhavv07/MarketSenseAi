export function Logo({ size = 36 }: { size?: number }) {
  return (
    <div
      className="relative flex items-center justify-center rounded-xl overflow-hidden"
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-500" />
      {/* Radar pulse rings */}
      <svg
        viewBox="0 0 36 36"
        className="relative z-10"
        style={{ width: size, height: size }}
      >
        <defs>
          <radialGradient id="logoGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* Outer pulse ring */}
        <circle cx="18" cy="18" r="14" fill="none" stroke="white" strokeOpacity="0.3" strokeWidth="1" />
        {/* Inner pulse ring */}
        <circle cx="18" cy="18" r="9" fill="none" stroke="white" strokeOpacity="0.5" strokeWidth="1" />
        {/* Candlestick bars representing market data */}
        <rect x="10" y="14" width="2.5" height="8" rx="0.5" fill="white" fillOpacity="0.9" />
        <rect x="14.5" y="10" width="2.5" height="12" rx="0.5" fill="white" fillOpacity="0.7" />
        <rect x="19" y="16" width="2.5" height="6" rx="0.5" fill="white" fillOpacity="0.9" />
        <rect x="23.5" y="12" width="2.5" height="10" rx="0.5" fill="white" fillOpacity="0.7" />
        {/* Trend line */}
        <path d="M9 20 L14 16 L19 18 L27 12" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.95" />
        {/* Center dot */}
        <circle cx="18" cy="18" r="1.5" fill="url(#logoGlow)" />
      </svg>
    </div>
  );
}
