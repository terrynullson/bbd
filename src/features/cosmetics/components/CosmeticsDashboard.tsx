import { ShelfSection } from './ShelfSection';
import { buildShelfSections } from '../lib/group-items';
import type { CosmeticItem } from '../types';

type CosmeticsDashboardProps = {
  items: CosmeticItem[];
  onRemove: (id: string) => void;
  onOpen: (item: CosmeticItem) => void;
};

export function CosmeticsDashboard({
  items,
  onRemove,
  onOpen,
}: CosmeticsDashboardProps) {
  const sections = buildShelfSections(items);

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section) => (
        <ShelfSection
          key={section.id}
          title={section.title}
          items={section.items}
          onRemove={onRemove}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
