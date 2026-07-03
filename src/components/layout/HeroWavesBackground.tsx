'use client';

export function HeroWavesBackground() {
  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ background: 'var(--hero-overscroll)' }}
      aria-hidden
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 800 220"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g className="hero-wave-group hero-wave-group-1" opacity="0.55">
          <path
            d="M-40 108C80 88 160 128 280 104C400 80 480 120 600 98C680 84 760 110 840 96"
            stroke="#f0c5b4"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </g>
        <g className="hero-wave-group hero-wave-group-2" opacity="0.42">
          <path
            d="M-60 132C100 112 200 152 320 128C440 104 520 148 640 122C720 106 800 134 860 118"
            stroke="#e8d4c0"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </g>
        <g className="hero-wave-group hero-wave-group-3" opacity="0.32">
          <path
            d="M-20 84C120 64 220 104 340 80C460 56 540 96 660 74C740 60 820 86 880 72"
            stroke="#d4b8a4"
            strokeWidth="0.85"
            strokeLinecap="round"
          />
        </g>
        <g className="hero-wave-group hero-wave-group-4" opacity="0.22">
          <path
            d="M-80 156C60 136 180 176 300 152C420 128 500 168 620 144C700 128 780 156 900 140"
            stroke="#f5e6dc"
            strokeWidth="0.7"
            strokeLinecap="round"
          />
        </g>
      </svg>
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/25 to-black/55" />
    </div>
  );
}
