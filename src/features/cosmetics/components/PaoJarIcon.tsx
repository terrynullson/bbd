import { cn } from '@/lib/utils';

type PaoJarIconProps = {
  months: number;
  className?: string;
  selected?: boolean;
};

export function PaoJarIcon({ months, className, selected }: PaoJarIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      aria-hidden
      className={cn('h-8 w-8', className)}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <ellipse
          cx="21"
          cy="8.5"
          rx="5.5"
          ry="1.8"
          transform="rotate(18 21 8.5)"
          className={selected ? 'stroke-accent' : 'stroke-current'}
        />
        <path
          d="M8 11.5h14c1.1 0 2 .9 2 2v11c0 1.1-.9 2-2 2H8c-1.1 0-2-.9-2-2v-11c0-1.1.9-2 2-2z"
          className={selected ? 'stroke-accent' : 'stroke-current'}
        />
      </g>
      <text
        x="15"
        y="22"
        textAnchor="middle"
        className={cn(
          'fill-current text-[9px] font-bold',
          selected ? 'text-accent' : 'text-current',
        )}
      >
        {months}M
      </text>
    </svg>
  );
}
