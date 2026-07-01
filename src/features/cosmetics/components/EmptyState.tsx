import { ProductIllustration } from './ProductIllustration';
import { Button } from '@/components/ui/Button';

type EmptyStateProps = {
  onAdd: () => void;
};

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="rounded-card bg-surface p-8 text-center shadow-[var(--shadow-card)]">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-accent text-white shadow-[var(--shadow-button)]">
        <ProductIllustration category="cream" className="h-9 w-9 text-white" />
      </div>

      <h2 className="font-display text-2xl font-semibold text-text">
        Полка пока пуста
      </h2>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted">
        Добавьте первый продукт — мы посчитаем срок после вскрытия.
      </p>

      <Button size="lg" className="mt-6 w-full" onClick={onAdd}>
        Добавить продукт
      </Button>
    </div>
  );
}
