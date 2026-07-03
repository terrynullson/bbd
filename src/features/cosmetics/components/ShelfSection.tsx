import { CosmeticCard } from './CosmeticCard';
import type { CosmeticItem } from '../types';

type ShelfSectionProps = {
  title: string;
  items: CosmeticItem[];
  onRemove: (id: string) => void;
  onEdit: (item: CosmeticItem) => void;
};

export function ShelfSection({
  title,
  items,
  onRemove,
  onEdit,
}: ShelfSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        {title}
      </h2>
      <div className="flex flex-col gap-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="card-enter"
            style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
          >
            <CosmeticCard
              item={item}
              onRemove={onRemove}
              onEdit={onEdit}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
