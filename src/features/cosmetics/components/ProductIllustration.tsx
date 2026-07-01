import type { ProductCategory } from '../types';

type ProductIllustrationProps = {
  category?: ProductCategory;
  className?: string;
};

export function ProductIllustration({
  category = 'other',
  className = 'h-10 w-10',
}: ProductIllustrationProps) {
  const stroke = 'currentColor';
  const common = {
    fill: 'none',
    stroke,
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (category === 'serum') {
    return (
      <svg viewBox="0 0 40 40" className={className} aria-hidden>
        <rect x="14" y="8" width="12" height="5" rx="2.5" {...common} />
        <path d="M16 13h8v18c0 2-1.5 3-4 3s-4-1-4-3V13Z" {...common} />
        <path d="M18 20h4" {...common} />
      </svg>
    );
  }

  if (category === 'cream') {
    return (
      <svg viewBox="0 0 40 40" className={className} aria-hidden>
        <ellipse cx="20" cy="28" rx="11" ry="4" {...common} />
        <path d="M11 18h18v10c0 3-4 5-9 5s-9-2-9-5V18Z" {...common} />
        <path d="M16 12h8v6h-8v-6Z" {...common} />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden>
      <rect x="14" y="10" width="12" height="4" rx="2" {...common} />
      <path d="M15 14h10v18c0 2.5-2 4-5 4s-5-1.5-5-4V14Z" {...common} />
    </svg>
  );
}
