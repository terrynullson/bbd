'use client';

import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import { DESIGN_STYLES } from './design-styles';
import { useDesignStyle } from './style-provider';

export function StylePicker() {
  const { designStyle, setDesignStyle } = useDesignStyle();

  return (
    <div className="rounded-[14px] border border-border bg-bg px-4 py-3">
      <div className="mb-3">
        <p className="text-sm font-medium text-text">Стиль оформления</p>
        <p className="text-xs text-muted">Внешний вид приложения</p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {DESIGN_STYLES.map((style) => {
          const selected = designStyle === style.id;

          return (
            <button
              key={style.id}
              type="button"
              onClick={() => {
                if (selected) return;
                haptic('light');
                setDesignStyle(style.id);
              }}
              aria-pressed={selected}
              className={cn(
                'rounded-[12px] border p-3 text-left transition-all active:scale-[0.99]',
                selected
                  ? 'border-accent/45 bg-accent/8 ring-1 ring-accent/20'
                  : 'border-border/70 bg-surface hover:border-accent/25',
              )}
            >
              <div className="mb-2.5 flex h-12 overflow-hidden rounded-[8px] border border-border/50">
                <span
                  className="w-[38%]"
                  style={{ background: style.preview.warm }}
                  aria-hidden
                />
                <span
                  className="flex-1"
                  style={{ background: style.preview.surface }}
                  aria-hidden
                />
                <span
                  className="w-3"
                  style={{ background: style.preview.accent }}
                  aria-hidden
                />
              </div>

              <p className="text-sm font-medium text-text">{style.label}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                {style.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
