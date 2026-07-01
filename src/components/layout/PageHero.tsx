'use client';

import { ThemeToggle } from '@/components/theme/theme-toggle';

type PageHeroProps = {
  summary?: string | null;
};

export function PageHero({ summary }: PageHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-b-[28px]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/hero-bg.svg')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-black/25 to-black/45" />

      <div className="relative px-5 pb-8 pt-10">
        <div className="flex items-start justify-between gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
            Beauty shelf
          </p>
          <ThemeToggle variant="hero" />
        </div>

        <h1 className="font-display mt-3 text-[2rem] font-semibold leading-tight tracking-tight text-white">
          Где мой крем
        </h1>

        {summary && (
          <p className="mt-2 text-sm text-white/80">{summary}</p>
        )}
      </div>
    </header>
  );
}
