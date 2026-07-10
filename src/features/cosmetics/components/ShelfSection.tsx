import { CosmeticCard } from './CosmeticCard';
import type { CosmeticItem } from '../types';

type ShelfSectionProps = {
  title: string;
  items: CosmeticItem[];
  onRemove: (id: string) => void;
  onOpen: (item: CosmeticItem) => void;
};

export function ShelfSection({
  title,
  items,
  onRemove,
  onOpen,
}: ShelfSectionProps) {
  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="quiet-label">{title}</h2>
      <div className="flex flex-col gap-2.5">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="card-enter"
            style={{ animationDelay: `${Math.min(index, 8) * 45}ms` }}
          >
            <CosmeticCard
              item={item}
              onRemove={onRemove}
              onOpen={onOpen}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
