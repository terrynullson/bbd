'use client';

import { HeroWavesBackground } from './HeroWavesBackground';
import { PulseHeroBackground } from './PulseHeroBackground';
import { RiotHeroBackground } from './RiotHeroBackground';
import { useDesignStyle } from '@/components/theme/style-provider';
import { APP_VERSION } from '@/lib/constants';
import { cn } from '@/lib/utils';

type PageHeroProps = {
  summary?: string | null;
  compact?: boolean;
};

function WarmPageHero({ summary, compact = false }: PageHeroProps) {
  return (
    <header className="relative z-30 shrink-0 overflow-hidden">
      <HeroWavesBackground />

      <div
        className={cn(
          'safe-top relative px-5 pt-2',
          compact ? 'pb-5' : 'pb-7',
        )}
      >
        <p className="text-[11px] font-medium tracking-[0.04em] text-white/75">
          Твоя забота о себе
        </p>

        <h1
          className={cn(
            'font-display font-semibold leading-none tracking-tight text-white',
            compact
              ? 'mt-3 text-[2.1rem] sm:text-[2.35rem]'
              : 'mt-4 text-[2.35rem] sm:text-[2.6rem]',
          )}
        >
          BBD
        </h1>

        {summary && (
          <p className="mt-2 max-w-[20rem] text-[13px] leading-relaxed text-white/78">
            {summary}
          </p>
        )}
      </div>
    </header>
  );
}

function PulsePageHero({ summary, compact = false }: PageHeroProps) {
  return (
    <header className="relative z-30 shrink-0 overflow-hidden border-b border-white/10 text-white">
      <PulseHeroBackground />

      <div
        className={cn(
          'safe-top relative px-4 pt-2',
          compact ? 'pb-4' : 'pb-5',
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <p className="pulse-mono text-[10px] text-sky-300">BBD / shelf</p>
          <span className="pulse-mono text-[10px] text-white/45">v{APP_VERSION}</span>
        </div>

        <h1
          className={cn(
            'font-display mt-3 font-bold leading-none tracking-tight',
            compact ? 'text-[1.95rem]' : 'text-[2.25rem]',
          )}
        >
          BBD
        </h1>

        <p className="mt-1.5 text-[12px] text-white/65">Твоя забота о себе</p>

        {summary && (
          <p className="pulse-mono mt-3 inline-flex rounded-[8px] border border-sky-400/30 bg-sky-400/10 px-2.5 py-1 text-[10px] text-sky-200">
            {summary}
          </p>
        )}
      </div>
    </header>
  );
}

function RiotPageHero({ summary, compact = false }: PageHeroProps) {
  return (
    <header className="relative z-30 shrink-0 overflow-hidden border-b-4 border-[var(--riot-neon)] text-white">
      <RiotHeroBackground />

      <div
        className={cn(
          'safe-top relative px-4 pt-2',
          compact ? 'pb-4' : 'pb-5',
        )}
      >
        <p className="riot-scream text-[10px] text-[var(--riot-neon)]">
          Твоя забота о себе
        </p>

        <h1
          className={cn(
            'font-display mt-2 font-black italic leading-[0.82] tracking-tighter -rotate-2',
            compact ? 'text-[3rem]' : 'text-[3.45rem]',
          )}
        >
          BBD
        </h1>

        {summary && (
          <p className="riot-scream mt-3 inline-block max-w-full bg-accent px-2.5 py-1.5 text-[10px] leading-snug text-white">
            {summary}
          </p>
        )}
      </div>
    </header>
  );
}

export function PageHero(props: PageHeroProps) {
  const { designStyle } = useDesignStyle();
  if (designStyle === 'pulse') return <PulsePageHero {...props} />;
  if (designStyle === 'riot') return <RiotPageHero {...props} />;
  return <WarmPageHero {...props} />;
}
