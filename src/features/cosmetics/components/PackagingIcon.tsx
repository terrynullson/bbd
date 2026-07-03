import { cn } from '@/lib/utils';
import {
  getPackagingIconName,
  type PackagingIconName,
} from '../lib/packaging-icons';
import type { CosmeticItem } from '../types';

type PackagingIconProps = {
  item?: CosmeticItem;
  name?: PackagingIconName;
  className?: string;
};

export function PackagingIcon({ item, name, className }: PackagingIconProps) {
  const iconName = name ?? (item ? getPackagingIconName(item) : 'generic');
  const src = `/icons/packaging/${iconName}.svg`;

  return (
    <span
      aria-hidden
      className={cn('inline-block h-9 w-9 bg-current', className)}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: 'no-repeat',
        maskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskPosition: 'center',
        WebkitMaskSize: 'contain',
        maskSize: 'contain',
      }}
    />
  );
}
