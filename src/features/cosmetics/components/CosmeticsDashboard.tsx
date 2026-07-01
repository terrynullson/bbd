import { CosmeticCard } from './CosmeticCard';
import { sortCosmeticItems } from '../lib/sort-items';
import type { CosmeticItem } from '../types';

type CosmeticsDashboardProps = {
  items: CosmeticItem[];
  onRemove: (id: string) => void;
};

export function CosmeticsDashboard({ items, onRemove }: CosmeticsDashboardProps) {
  const sorted = sortCosmeticItems(items);

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((item) => (
        <CosmeticCard key={item.id} item={item} onRemove={onRemove} />
      ))}
    </div>
  );
}
