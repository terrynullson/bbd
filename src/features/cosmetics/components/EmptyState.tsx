'use client';

import { ProductIllustration } from './ProductIllustration';

export function EmptyState() {
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
