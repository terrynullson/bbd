'use client';

import { cn } from '@/lib/utils';
import type { AnalyzeProductResponse, ProductSuggestion } from '../types';

type ProductMatchPickerProps = {
  suggestions?: ProductSuggestion[];
  aiResult?: AnalyzeProductResponse | null;
  title: string;
  onPickSuggestion: (suggestion: ProductSuggestion) => void;
  onConfirmAi: () => void;
  onBack: () => void;
};

function getSuggestionLabel(suggestion: ProductSuggestion) {
  return suggestion.brand
    ? `${suggestion.brand} · ${suggestion.name}`
    : suggestion.name;
}

export function ProductMatchPicker({
  suggestions = [],
  aiResult,
  title,
  onPickSuggestion,
  onConfirmAi,
  onBack,
}: ProductMatchPickerProps) {
  return (
    <div className="flex flex-col gap-4 pt-1">
      <p className="text-sm text-muted">{title}</p>

      {suggestions.length > 0 && (
        <ul
          className="max-h-56 overflow-y-auto overscroll-y-none rounded-[14px] border border-border/60 bg-bg"
          data-sheet-no-drag
        >
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.source}-${suggestion.id}`}>
              <button
                type="button"
                onClick={() => onPickSuggestion(suggestion)}
                className="flex w-full items-center justify-between gap-3 border-b border-border/40 px-4 py-3.5 text-left text-sm transition-colors last:border-b-0 hover:bg-accent/5 active:bg-accent/10"
              >
                <span className="min-w-0 font-medium text-text">
                  {getSuggestionLabel(suggestion)}
                </span>
                {suggestion.paoMonths && (
                  <span className="shrink-0 text-xs text-muted">
                    {suggestion.paoMonths}M
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {aiResult && (
        <div className="rounded-[14px] border border-accent/25 bg-accent/5 p-4">
          <p className="text-sm text-muted">ИИ предлагает:</p>
          <p className="mt-1 text-base font-semibold text-text">
            {aiResult.brand} · {aiResult.name}
          </p>
          <p className="mt-1 text-xs text-muted">
            Срок после вскрытия: {aiResult.paoMonths} мес.
          </p>
          <button
            type="button"
            onClick={onConfirmAi}
            className={cn(
              'mt-3 w-full rounded-[14px] bg-accent px-4 py-3 text-sm font-medium text-accent-foreground shadow-[var(--shadow-button)] transition-colors hover:bg-accent-hover',
            )}
          >
            Да, добавить
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={onBack}
        className="text-center text-sm text-muted underline-offset-2 transition-colors hover:text-text hover:underline"
      >
        Назад
      </button>
    </div>
  );
}
