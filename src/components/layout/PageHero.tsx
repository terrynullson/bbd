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

        <h1 className="font-display mt-4 text-[1.75rem] font-semibold leading-[1.15] tracking-tight text-white sm:text-[2rem]">
          Где мой крем
        </h1>

        {summary && (
          <p className="mt-2 text-[13px] leading-relaxed text-white/85">{summary}</p>
        )}
      </div>
    </header>
  );
}
