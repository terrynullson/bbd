'use client';

import { ThemeToggle } from '@/components/theme/theme-toggle';
import { HeroWavesBackground } from './HeroWavesBackground';

type PageHeroProps = {
  summary?: string | null;
};

export function PageHero({ summary }: PageHeroProps) {
  return (
    <header className="relative z-30 shrink-0 overflow-hidden">
      <HeroWavesBackground />

      <div className="safe-top relative px-5 pb-8 pt-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80">
            Твоя забота о себе
          </p>
          <ThemeToggle variant="hero" />
        </div>

        <h1 className="font-display mt-4 text-[2.25rem] font-semibold leading-none tracking-tight text-white sm:text-[2.5rem]">
          BBD
        </h1>

        {summary && (
          <p className="mt-2 text-[13px] leading-relaxed text-white/85">{summary}</p>
        )}
      </div>
    </header>
  );
}
