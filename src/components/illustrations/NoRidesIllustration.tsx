export default function NoRidesIllustration() {
  return (
    <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      <circle cx="80" cy="80" r="72" fill="#DCFCE7" />
      <circle cx="122" cy="38" r="14" fill="#FEF3C7" />
      <rect x="10" y="112" width="140" height="18" rx="9" fill="#2563EB" />
      <rect x="10" y="112" width="140" height="18" rx="9" fill="url(#road)" opacity="0.15" />
      <rect x="24" y="119" width="14" height="4" rx="2" fill="white" />
      <rect x="54" y="119" width="14" height="4" rx="2" fill="white" />
      <rect x="84" y="119" width="14" height="4" rx="2" fill="white" />
      <rect x="114" y="119" width="14" height="4" rx="2" fill="white" />
      <g transform="translate(38 68)">
        <rect x="0" y="20" width="84" height="28" rx="12" fill="#16A34A" />
        <path d="M10 20 L22 2 H62 L74 20 Z" fill="#22C55E" />
        <rect x="24" y="8" width="14" height="12" rx="3" fill="#DCFCE7" />
        <rect x="46" y="8" width="14" height="12" rx="3" fill="#DCFCE7" />
        <circle cx="18" cy="50" r="10" fill="#111827" />
        <circle cx="18" cy="50" r="4" fill="#9CA3AF" />
        <circle cx="66" cy="50" r="10" fill="#111827" />
        <circle cx="66" cy="50" r="4" fill="#9CA3AF" />
      </g>
      <defs>
        <linearGradient id="road" x1="0" y1="0" x2="160" y2="0">
          <stop stopColor="white" stopOpacity="0" />
          <stop offset="1" stopColor="white" stopOpacity="0.4" />
        </linearGradient>
      </defs>
    </svg>
  );
}
