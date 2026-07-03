'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { ProductSuggestion } from '../types';

type SuggestionDropdownProps = {
  suggestions: ProductSuggestion[];
  mode: 'brand' | 'product';
  highlightIndex: number;
  onPick: (suggestion: ProductSuggestion) => void;
  onHighlight: (index: number) => void;
};

function getLabel(suggestion: ProductSuggestion, mode: 'brand' | 'product') {
  if (mode === 'brand') return suggestion.name;
  return suggestion.brand
    ? `${suggestion.brand} · ${suggestion.name}`
    : suggestion.name;
}

function getSourceLabel(source: ProductSuggestion['source']) {
  if (source === 'personal') return 'ваш';
  if (source === 'local') return 'на устройстве';
  return null;
}

export function SuggestionDropdown({
  suggestions,
  mode,
  highlightIndex,
  onPick,
  onHighlight,
}: SuggestionDropdownProps) {
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const item = listRef.current?.children[highlightIndex] as HTMLElement | undefined;
    item?.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex]);

  if (suggestions.length === 0) return null;

  return (
    <ul
      ref={listRef}
      role="listbox"
      data-sheet-no-drag
      className="absolute inset-x-0 top-full z-20 mt-1 max-h-52 overflow-y-auto rounded-[14px] border border-border/60 bg-surface/90 shadow-[var(--shadow-card)] backdrop-blur-md"
    >
      {suggestions.map((suggestion, index) => {
        const sourceLabel = getSourceLabel(suggestion.source);

        return (
          <li key={`${suggestion.source}-${suggestion.id}`} role="option" aria-selected={index === highlightIndex}>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => onHighlight(index)}
              onClick={() => onPick(suggestion)}
              className={cn(
                'flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors',
                index === highlightIndex
                  ? 'bg-accent/10 text-text'
                  : 'text-text hover:bg-accent/5',
              )}
            >
              <span className="min-w-0 truncate">{getLabel(suggestion, mode)}</span>
              {sourceLabel && (
                <span className="shrink-0 text-[11px] text-muted">{sourceLabel}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function useSuggestionKeyboard({
  suggestions,
  highlightIndex,
  setHighlightIndex,
  onPick,
  enabled,
}: {
  suggestions: ProductSuggestion[];
  highlightIndex: number;
  setHighlightIndex: (index: number) => void;
  onPick: (suggestion: ProductSuggestion) => void;
  enabled: boolean;
}) {
  return (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!enabled || suggestions.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex =
        highlightIndex < 0 ? 0 : (highlightIndex + 1) % suggestions.length;
      setHighlightIndex(nextIndex);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const nextIndex =
        highlightIndex <= 0
          ? suggestions.length - 1
          : highlightIndex - 1;
      setHighlightIndex(nextIndex);
      return;
    }

    if (event.key === 'Enter' && highlightIndex >= 0) {
      event.preventDefault();
      const suggestion = suggestions[highlightIndex];
      if (suggestion) onPick(suggestion);
      return;
    }

    if (event.key === 'Escape') {
      setHighlightIndex(-1);
    }
  };
}
