'use client';

export function RiotHeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-black" />
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background: `repeating-linear-gradient(
            -14deg,
            var(--accent) 0,
            var(--accent) 14px,
            #0a0a0a 14px,
            #0a0a0a 28px,
            var(--riot-neon) 28px,
            var(--riot-neon) 36px,
            #0a0a0a 36px,
            #0a0a0a 52px
          )`,
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/70 to-black" />
      <div className="absolute inset-0 riot-scanlines opacity-30" />
    </div>
  );
}
