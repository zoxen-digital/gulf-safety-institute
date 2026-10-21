// Line icons for the industries strip (no suitable Lucide equivalents exist for these).
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const ICONS: Record<string, React.ReactNode> = {
  "Oil & Gas": (
    <g {...P}>
      <path d="M20 6l-6 34M20 6l6 34M16 26h8M15 32h10M17 18h6" />
      <path d="M6 40h28M30 40V28h10v12M33 28v-4h4v4M44 40H34" />
      <path d="M8 40v-6h6v6" />
    </g>
  ),
  Petrochemical: (
    <g {...P}>
      <path d="M6 42V18a5 5 0 0110 0v24M18 42V12a5 5 0 0110 0v30M30 42V24h12v18" />
      <path d="M4 42h40M34 24v-6h4v6M11 24h0M23 20h0" />
      <path d="M16 30h2M28 30h2" />
    </g>
  ),
  Construction: (
    <g {...P}>
      <path d="M14 42V8M14 8h28M14 8L6 14h8M20 8l-6 6M26 8l-6 6M32 8l-6 6M38 8l-6 6" />
      <path d="M38 8v12M35 20h6v5h-6zM10 42h8M14 22h0" />
      <path d="M22 42V32h12v10M20 42h20" />
    </g>
  ),
  "Marine & Offshore": (
    <g {...P}>
      <path d="M6 32h36l-5 8H11z" />
      <path d="M12 32v-8h22v8M18 24v-6h10v6M23 18v-8M23 10l6 3-6 3" />
      <path d="M4 44c3 0 3-2 6-2s3 2 6 2 3-2 6-2 3 2 6 2 3-2 6-2 3 2 6 2" />
    </g>
  ),
  "Energy & Utilities": (
    <g {...P}>
      <path d="M8 42l4-26h6l4 26M10 30h10M11 22h8" />
      <path d="M26 42V20h6v22M34 42V12h6v30M24 42h18M4 42h20" />
      <path d="M29 26h0M37 18h0M37 26h0" />
    </g>
  ),
};

export function IndustryIcon({ name, className = "h-12 w-12" }: { name: string; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {ICONS[name] ?? ICONS["Oil & Gas"]}
    </svg>
  );
}
