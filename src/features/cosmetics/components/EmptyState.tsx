import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';

type EmptyStateProps = {
  onAdd: () => void;
};

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="mx-auto mt-16 flex max-w-sm flex-col items-center text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-card border border-border bg-surface shadow-[var(--shadow-card)]">
        <div className="h-10 w-10 rounded-full bg-accent/15" />
      </div>

      <h2 className="font-display text-2xl font-semibold text-text">
        Полка пока пуста
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Добавьте первый продукт — мы посчитаем срок после вскрытия и напомним,
        когда пора обновить уход.
      </p>

      <Button size="lg" className="mt-8 w-full" onClick={onAdd}>
        <Plus className="h-5 w-5" />
        Добавить продукт
      </Button>
    </div>
  );
}
