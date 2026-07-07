'use client';

export function PulseHeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-[var(--hero-overscroll)]" />
      <div
        className="absolute inset-0 opacity-[0.22] dark:opacity-[0.16]"
        style={{
          backgroundImage:
            'linear-gradient(var(--pulse-grid) 1px, transparent 1px), linear-gradient(90deg, var(--pulse-grid) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-accent/55" />
      <div className="absolute -right-8 top-8 h-28 w-28 rounded-full bg-accent/10 blur-2xl" />
      <div className="absolute -left-6 bottom-0 h-24 w-24 rounded-full bg-[var(--pulse-glow)] blur-3xl" />
    </div>
  );
}
