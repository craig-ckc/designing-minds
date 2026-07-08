export function GrowthChart() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-line bg-surface p-4">
      <svg viewBox="0 0 600 170" className="h-auto w-full" preserveAspectRatio="none" aria-hidden>
        <defs>
          <linearGradient id="growth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4b57e8" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#4b57e8" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,158 C160,150 300,120 440,66 S600,14 600,14 L600,170 L0,170 Z" fill="url(#growth)" />
        <path d="M0,158 C160,150 300,120 440,66 S600,14 600,14" fill="none" stroke="#4b57e8" strokeWidth="3.5" strokeLinecap="round" />
      </svg>
      <span className="absolute bottom-4 left-4 rounded-full bg-primary px-3 py-1 text-[0.75rem] font-bold text-white">
        Confidence, week by week
      </span>
    </div>
  )
}

