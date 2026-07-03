import { cn } from '@/lib/utils';

export type NavIconName = 'shelf' | 'profile' | 'login' | 'add';

type NavIconProps = {
  name: NavIconName;
  className?: string;
};

export function NavIcon({ name, className }: NavIconProps) {
  const src = `/icons/nav/${name}.svg`;

  return (
    <span
      aria-hidden
      className={cn('inline-block h-6 w-6 bg-current', className)}
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
