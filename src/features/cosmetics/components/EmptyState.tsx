import { ProductIllustration } from './ProductIllustration';

export function EmptyState() {
  return (
    <div className="rounded-[20px] border border-border/70 bg-bg px-6 py-8 text-center">
      <div className="mx-auto mb-5 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-accent text-white shadow-[var(--shadow-button)]">
        <ProductIllustration category="cream" className="h-8 w-8 text-white" />
      </div>

      <h2 className="font-display text-[1.35rem] font-semibold text-text">
        Полка пока пуста
      </h2>
      <p className="mx-auto mt-2 max-w-[240px] text-sm leading-relaxed text-muted">
        Добавьте первый продукт — мы посчитаем срок после вскрытия.
      </p>

      <p className="mt-6 text-sm text-muted">
        Нажмите <span className="font-medium text-accent">+</span> внизу экрана
      </p>
    </div>
  );
}
