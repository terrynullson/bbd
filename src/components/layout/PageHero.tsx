'use client';

import { ThemeToggle } from '@/components/theme/theme-toggle';

type PageHeroProps = {
  summary?: string | null;
};

export function PageHero({ summary }: PageHeroProps) {
  return (
    <header className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/hero-bg.svg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50" />

      <div className="safe-top relative px-5 pb-10 pt-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80">
            Beauty shelf
          </p>
          <ThemeToggle variant="hero" />
        </div>

        <div className="relative mt-4 py-1">
          <img
            src="/images/hero-title-waves.png"
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-x-[-10%] top-1/2 w-[120%] max-w-none -translate-y-1/2 opacity-85 mix-blend-lighten"
          />
          <h1 className="relative font-display text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-white sm:text-[2rem]">
            Где мой крем
          </h1>
        </div>

        {summary && (
          <p className="mt-2 text-[13px] leading-relaxed text-white/85">{summary}</p>
        )}
      </div>
    </header>
  );
}
