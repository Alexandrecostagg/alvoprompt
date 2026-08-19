interface BrandMarkProps {
  compact?: boolean
  className?: string
}

export function BrandIcon({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="alvoprompter-mark" x1="7" y1="5" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7C5CFC" />
          <stop offset="0.52" stopColor="#6366F1" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="42" height="42" rx="14" fill="#101525" />
      <rect x="4.5" y="4.5" width="39" height="39" rx="12.5" stroke="url(#alvoprompter-mark)" strokeWidth="3" />
      <path d="M14 18v-2.5A3.5 3.5 0 0 1 17.5 12H20M28 12h2.5a3.5 3.5 0 0 1 3.5 3.5V18M34 30v2.5a3.5 3.5 0 0 1-3.5 3.5H28M20 36h-2.5a3.5 3.5 0 0 1-3.5-3.5V30" stroke="white" strokeWidth="2.4" strokeLinecap="round" />
      <path d="m18.5 32 5.5-16 5.5 16M20.7 26.2h6.6" stroke="white" strokeWidth="3.1" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="24" cy="26.2" r="2.15" fill="#22D3EE" stroke="#101525" strokeWidth="1.2" />
    </svg>
  )
}

export default function BrandMark({ compact = false, className = '' }: BrandMarkProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <BrandIcon className={compact ? 'h-8 w-8' : 'h-9 w-9'} />
      <span className="text-[17px] font-bold tracking-[-0.03em]" style={{ color: 'var(--text)' }}>
        Alvo<span className="brand-gradient-text">Prompter</span>
      </span>
    </span>
  )
}
