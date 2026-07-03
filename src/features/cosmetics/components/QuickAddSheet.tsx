'use client';

import { ScanBarcode, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { BarcodeScanner } from './BarcodeScanner';
import { PackagingToggle } from './PackagingToggle';
import {
  SuggestionDropdown,
  useSuggestionKeyboard,
} from './SuggestionDropdown';
import { analyzeProduct } from '../api/analyze-product';
import { lookupProductByBarcode } from '../api/lookup-product';
import { fetchProductSuggestions } from '../api/suggest-products';
import { inferCategoryFromText } from '../lib/categories';
import { haptic } from '@/lib/haptics';
import type { AddProductInput, CosmeticItem, ProductSuggestion } from '../types';

type QuickAddSheetProps = {
  localItems: CosmeticItem[];
  onClose: () => void;
  onSubmit: (input: AddProductInput) => void;
  onManualFill: (draft: Partial<AddProductInput>) => void;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeSuggestion(value: string) {
  return value.trim().toLowerCase();
}

function mergeSuggestions(
  local: ProductSuggestion[],
  remote: ProductSuggestion[],
) {
  const seen = new Set<string>();
  return [...local, ...remote]
    .filter((suggestion) => {
      const key = normalizeSuggestion(
        `${suggestion.brand ?? ''} ${suggestion.name}`,
      );
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

export function QuickAddSheet({
  localItems,
  onClose,
  onSubmit,
  onManualFill,
}: QuickAddSheetProps) {
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [isPackagingOpen, setIsPackagingOpen] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [remoteSuggestions, setRemoteSuggestions] = useState<ProductSuggestion[]>(
    [],
  );
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setName('');
    setBarcode('');
    setIsPackagingOpen(true);
    setError('');
    setRemoteSuggestions([]);
    setHighlightIndex(-1);
  }, []);

  const localSuggestions = useMemo(() => {
    const query = normalizeSuggestion(name);
    if (query.length < 2) return [];

    return localItems
      .filter((product) => normalizeSuggestion(product.name).includes(query))
      .map((product) => ({
        id: product.id,
        brand: product.brand,
        name: product.name,
        barcode: product.barcode,
        paoMonths: product.paoMonths,
        category: product.category,
        imageUrl: product.imageUrl,
        source: 'local' as const,
      }));
  }, [localItems, name]);

  const suggestions = useMemo(
    () => mergeSuggestions(localSuggestions, remoteSuggestions),
    [localSuggestions, remoteSuggestions],
  );

  useEffect(() => {
    setHighlightIndex(suggestions.length > 0 ? 0 : -1);
  }, [suggestions]);

  useEffect(() => {
    if (name.trim().length < 2) {
      setRemoteSuggestions([]);
      return;
    }

    const timeout = setTimeout(() => {
      void fetchProductSuggestions({ type: 'product', query: name }).then(
        setRemoteSuggestions,
      );
    }, 280);

    return () => clearTimeout(timeout);
  }, [name]);

  const buildDraft = (): Partial<AddProductInput> => ({
    name: name.trim() || undefined,
    barcode: barcode.trim() || undefined,
    isSealed: !isPackagingOpen,
    openedAt: isPackagingOpen
      ? new Date(todayIso()).toISOString()
      : new Date(todayIso()).toISOString(),
    lookupSource: 'manual',
  });

  const handleManualFill = () => {
    haptic('light');
    onManualFill(buildDraft());
    onClose();
  };

  const applySuggestion = (suggestion: ProductSuggestion) => {
    setName(suggestion.name);
    if (suggestion.barcode) setBarcode(suggestion.barcode);
    setIsFocused(false);
    haptic('light');
  };

  const handleSuggestionKeyDown = useSuggestionKeyboard({
    suggestions,
    highlightIndex,
    setHighlightIndex,
    onPick: applySuggestion,
    enabled: isFocused,
  });

  const submitProduct = (input: AddProductInput) => {
    onSubmit(input);
    haptic('success');
    onClose();
  };

  const handleQuickSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedBarcode = barcode.trim();
    const isSealed = !isPackagingOpen;

    if (!trimmedName && !trimmedBarcode) {
      setError('Введите название или отсканируйте штрих-код');
      haptic('error');
      return;
    }

    setIsLoading(true);
    setError('');
    haptic('medium');

    try {
      if (trimmedBarcode) {
        const lookup = await lookupProductByBarcode(trimmedBarcode);
        if (lookup.found && lookup.name) {
          submitProduct({
            name: lookup.name,
            brand: lookup.brand ?? 'Неизвестный бренд',
            barcode: trimmedBarcode,
            paoMonths: lookup.paoMonths ?? 12,
            openedAt: new Date(todayIso()).toISOString(),
            isSealed,
            category: lookup.category,
            imageUrl: lookup.imageUrl,
            lookupSource: lookup.source ?? 'barcode',
          });
          return;
        }
      }

      const result = await analyzeProduct({
        name: trimmedName || undefined,
        barcode: trimmedBarcode || undefined,
      });

      submitProduct({
        name: result.name,
        brand: result.brand,
        barcode: trimmedBarcode || undefined,
        paoMonths: result.paoMonths,
        openedAt: new Date(todayIso()).toISOString(),
        isSealed,
        category:
          result.category ??
          inferCategoryFromText(`${result.brand} ${result.name}`),
        lookupSource: trimmedBarcode ? 'ai-barcode' : 'ai',
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Не удалось добавить продукт',
      );
      haptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarcodeScan = async (code: string) => {
    setBarcode(code);
    setIsScannerOpen(false);
    setIsLoading(true);
    setError('');
    haptic('medium');

    try {
      const lookup = await lookupProductByBarcode(code);
      if (lookup.found) {
        if (lookup.name) setName(lookup.name);
        return;
      }

      const result = await analyzeProduct({ barcode: code });
      setName(result.name);
      haptic('success');
    } catch (scanError) {
      setError(
        scanError instanceof Error
          ? scanError.message
          : 'Не удалось распознать штрих-код',
      );
      haptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void handleQuickSubmit();
  };

  const showAiHint = name.trim().length >= 2 && !isLoading;

  return (
    <>
      <Modal title="Новый продукт" onClose={onClose}>
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-5 pt-1">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
              Название
            </p>
            <div className="relative">
              <Input
                autoFocus
                aria-label="Название продукта"
                aria-autocomplete="list"
                aria-expanded={isFocused && suggestions.length > 0}
                placeholder="Например, увлажняющий крем"
                value={name}
                disabled={isLoading}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 120)}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError('');
                }}
                onKeyDown={(event) => {
                  if (
                    event.key === 'Enter' &&
                    (highlightIndex < 0 || suggestions.length === 0)
                  ) {
                    return;
                  }
                  handleSuggestionKeyDown(event);
                }}
                className="pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  haptic('light');
                  setIsScannerOpen(true);
                }}
                disabled={isLoading}
                aria-label="Сканировать штрих-код"
                className="absolute right-1 top-1/2 h-10 w-10 -translate-y-1/2 shadow-none"
              >
                <ScanBarcode className="h-5 w-5 text-muted" />
              </Button>
              {isFocused && (
                <SuggestionDropdown
                  suggestions={suggestions}
                  mode="product"
                  highlightIndex={highlightIndex}
                  onHighlight={setHighlightIndex}
                  onPick={applySuggestion}
                />
              )}
            </div>
            {barcode && (
              <p className="mt-2 text-xs text-muted">Штрих-код: {barcode}</p>
            )}
            {showAiHint && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                ИИ подберёт бренд и срок при добавлении
              </p>
            )}
          </div>

          <PackagingToggle
            isOpen={isPackagingOpen}
            onChange={setIsPackagingOpen}
          />

          {error && <p className="text-xs text-expired">{error}</p>}

          <Button
            type="submit"
            size="lg"
            disabled={isLoading}
            className="h-12 w-full rounded-[14px]"
          >
            {isLoading ? <Spinner /> : 'Добавить'}
          </Button>

          <button
            type="button"
            onClick={handleManualFill}
            disabled={isLoading}
            className="text-center text-sm text-muted underline-offset-2 transition-colors hover:text-text hover:underline disabled:opacity-50"
          >
            Заполнить вручную
          </button>
        </form>
      </Modal>

      {isScannerOpen && (
        <BarcodeScanner
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(code) => void handleBarcodeScan(code)}
        />
      )}
    </>
  );
}
