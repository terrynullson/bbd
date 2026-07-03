import { CosmeticCard } from './CosmeticCard';
import { sortCosmeticItems } from '../lib/sort-items';
import type { CosmeticItem } from '../types';

type CosmeticsDashboardProps = {
  items: CosmeticItem[];
  onRemove: (id: string) => void;
  onEdit: (item: CosmeticItem) => void;
};

export function CosmeticsDashboard({
  items,
  onRemove,
  onEdit,
}: CosmeticsDashboardProps) {
  const sorted = sortCosmeticItems(items);

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((item, index) => (
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
  );
}
