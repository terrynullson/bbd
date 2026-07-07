'use client';

import { ProductIllustration } from './ProductIllustration';
import { useDesignStyle } from '@/components/theme/style-provider';

function WarmEmptyState() {
  return (
    <div className="flex min-h-[min(26rem,calc(100dvh-15rem))] flex-1 flex-col items-center justify-center px-2 pb-10 text-center">
      <div className="empty-state-icon mb-6 flex h-[76px] w-[76px] items-center justify-center rounded-full">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <ProductIllustration category="cream" className="h-7 w-7 text-accent-foreground" />
        </div>
      </div>

      <h2 className="font-display text-[1.4rem] font-semibold tracking-tight text-text">
        Полка пока пуста
      </h2>
      <p className="mx-auto mt-2.5 max-w-[16.5rem] text-sm leading-relaxed text-muted">
        Добавьте первый продукт — мы посчитаем срок после вскрытия.
      </p>

      <p className="mt-5 text-sm text-muted/80">
        Нажмите <span className="font-medium text-accent">+</span> внизу экрана
      </p>
    </div>
  );
}

function PulseEmptyState() {
  return (
    <div className="flex min-h-[min(24rem,calc(100dvh-13rem))] flex-1 flex-col justify-center px-1 pb-8">
      <p className="pulse-mono text-[10px] text-accent">status / empty</p>

      <div className="mt-4 flex items-start gap-4">
        <div className="empty-state-icon flex h-16 w-16 shrink-0 items-center justify-center rounded-[12px]">
          <ProductIllustration category="cream" className="h-8 w-8 text-accent" />
        </div>

        <div className="min-w-0 pt-1">
          <h2 className="font-display text-[1.55rem] font-bold leading-tight tracking-tight text-text">
            Полка пока пуста
          </h2>
          <p className="mt-2 max-w-[15rem] text-sm leading-relaxed text-muted">
            Добавьте первый продукт — мы посчитаем срок после вскрытия.
          </p>
        </div>
      </div>

      <div className="pulse-card mt-8 px-3 py-2.5">
        <p className="text-sm text-muted">
          Нажмите <span className="font-semibold text-accent">+</span> внизу экрана
        </p>
      </div>
    </div>
  );
}

function RiotEmptyState() {
  return (
    <div className="relative flex min-h-[min(22rem,calc(100dvh-12rem))] flex-1 flex-col justify-center px-1 pb-6">
      <span className="riot-scream absolute -right-1 top-0 rotate-3 bg-accent px-2 py-1 text-[10px] text-white">
        Пусто
      </span>

      <div className="riot-sticker relative px-5 py-7">
        <div className="empty-state-icon mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center">
          <ProductIllustration category="cream" className="h-8 w-8 text-black" />
        </div>

        <h2 className="font-display text-center text-[1.65rem] font-black italic leading-none tracking-tight text-text">
          Полка пока пуста
        </h2>
        <p className="mx-auto mt-3 max-w-[16rem] text-center text-sm font-medium leading-relaxed text-muted">
          Добавьте первый продукт — мы посчитаем срок после вскрытия.
        </p>

        <p className="mt-6 text-center text-sm font-medium text-muted">
          Нажмите <span className="riot-scream text-accent">+</span> внизу экрана
        </p>
      </div>
    </div>
  );
}

export function EmptyState() {
  const { designStyle } = useDesignStyle();
  if (designStyle === 'pulse') return <PulseEmptyState />;
  if (designStyle === 'riot') return <RiotEmptyState />;
  return <WarmEmptyState />;
}
