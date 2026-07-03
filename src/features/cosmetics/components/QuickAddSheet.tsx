'use client';

import { ScanBarcode, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { BarcodeScanner } from './BarcodeScanner';
import { PackagingToggle } from './PackagingToggle';
import { ProductMatchPicker } from './ProductMatchPicker';
import {
  SuggestionDropdown,
  useSuggestionKeyboard,
} from './SuggestionDropdown';
import { analyzeProduct } from '../api/analyze-product';
import { lookupProductByBarcode } from '../api/lookup-product';
import { fetchProductSuggestions } from '../api/suggest-products';
import { inferCategoryFromText } from '../lib/categories';
import { haptic } from '@/lib/haptics';
import type {
  AddProductInput,
  AnalyzeProductResponse,
  CosmeticItem,
  ProductSuggestion,
} from '../types';

type QuickAddSheetProps = {
  localItems: CosmeticItem[];
  initialDraft?: Partial<AddProductInput>;
  onClose: () => void;
  onSubmit: (input: AddProductInput) => void;
  onManualFill: (draft: Partial<AddProductInput>) => void;
};

type MatchStep = 'form' | 'matches' | 'ai';

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
    .slice(0, 8);
}

function suggestionToInput(
  suggestion: ProductSuggestion,
  isSealed: boolean,
  barcode?: string,
): AddProductInput {
  return {
    name: suggestion.name,
    brand: suggestion.brand ?? 'Неизвестный бренд',
    barcode: barcode || suggestion.barcode,
    paoMonths: suggestion.paoMonths ?? 12,
    openedAt: new Date(todayIso()).toISOString(),
    isSealed,
    category: suggestion.category,
    imageUrl: suggestion.imageUrl,
    lookupSource: suggestion.source === 'catalog' ? 'catalog' : 'manual',
  };
}

export function QuickAddSheet({
  localItems,
  initialDraft,
  onClose,
  onSubmit,
  onManualFill,
}: QuickAddSheetProps) {
  const [name, setName] = useState(initialDraft?.name ?? '');
  const [barcode, setBarcode] = useState(initialDraft?.barcode ?? '');
  const [isPackagingOpen, setIsPackagingOpen] = useState(
    initialDraft?.isSealed === undefined ? true : !initialDraft.isSealed,
  );
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [remoteSuggestions, setRemoteSuggestions] = useState<ProductSuggestion[]>(
    [],
  );
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [matchStep, setMatchStep] = useState<MatchStep>('form');
  const [matchSuggestions, setMatchSuggestions] = useState<ProductSuggestion[]>(
    [],
  );
  const [aiResult, setAiResult] = useState<AnalyzeProductResponse | null>(null);

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
      void fetchProductSuggestions({ type: 'product', query: name })
        .then(setRemoteSuggestions)
        .catch(() => setRemoteSuggestions([]));
    }, 280);

    return () => clearTimeout(timeout);
  }, [name]);

  const buildDraft = (): Partial<AddProductInput> => ({
    name: name.trim() || undefined,
    barcode: barcode.trim() || undefined,
    isSealed: !isPackagingOpen,
    openedAt: new Date(todayIso()).toISOString(),
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
    enabled: isFocused && matchStep === 'form',
  });

  const submitProduct = (input: AddProductInput) => {
    onSubmit(input);
    haptic('success');
    onClose();
  };

  const collectMatches = async (trimmedName: string) => {
    const query = normalizeSuggestion(trimmedName);
    const local =
      query.length < 2
        ? []
        : localItems
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

    const remote =
      query.length >= 2
        ? await fetchProductSuggestions({ type: 'product', query: trimmedName })
        : [];

    return mergeSuggestions(local, remote);
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
          const lookupSuggestion: ProductSuggestion = {
            id: `lookup-${trimmedBarcode}`,
            brand: lookup.brand,
            name: lookup.name,
            barcode: trimmedBarcode,
            paoMonths: lookup.paoMonths,
            category: lookup.category,
            imageUrl: lookup.imageUrl,
            source: 'catalog',
          };
          setMatchSuggestions([lookupSuggestion]);
          setAiResult(null);
          setMatchStep('matches');
          return;
        }
      }

      const matches = await collectMatches(trimmedName);

      if (matches.length > 0) {
        setMatchSuggestions(matches);
        setAiResult(null);
        setMatchStep('matches');
        return;
      }

      const result = await analyzeProduct({
        name: trimmedName || undefined,
        barcode: trimmedBarcode || undefined,
      });

      setMatchSuggestions([]);
      setAiResult(result);
      setMatchStep('ai');
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Не удалось найти продукт',
      );
      haptic('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickSuggestion = (suggestion: ProductSuggestion) => {
    submitProduct(
      suggestionToInput(suggestion, !isPackagingOpen, barcode.trim() || undefined),
    );
  };

  const handleConfirmAi = () => {
    if (!aiResult) return;

    submitProduct({
      name: aiResult.name,
      brand: aiResult.brand,
      barcode: barcode.trim() || undefined,
      paoMonths: aiResult.paoMonths,
      openedAt: new Date(todayIso()).toISOString(),
      isSealed: !isPackagingOpen,
      category:
        aiResult.category ??
        inferCategoryFromText(`${aiResult.brand} ${aiResult.name}`),
      lookupSource: barcode.trim() ? 'ai-barcode' : 'ai',
    });
  };

  const handleBarcodeScan = async (code: string) => {
    setBarcode(code);
    setIsScannerOpen(false);
    setIsLoading(true);
    setError('');
    haptic('medium');

    try {
      const lookup = await lookupProductByBarcode(code);
      if (lookup.found && lookup.name) {
        setName(lookup.name);
        setMatchSuggestions([
          {
            id: `lookup-${code}`,
            brand: lookup.brand,
            name: lookup.name,
            barcode: code,
            paoMonths: lookup.paoMonths,
            category: lookup.category,
            imageUrl: lookup.imageUrl,
            source: 'catalog',
          },
        ]);
        setAiResult(null);
        setMatchStep('matches');
        haptic('success');
        return;
      }

      const result = await analyzeProduct({ barcode: code });
      setName(result.name);
      setMatchSuggestions([]);
      setAiResult(result);
      setMatchStep('ai');
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

  const showAiHint = name.trim().length >= 2 && !isLoading && matchStep === 'form';

  const matchTitle =
    matchSuggestions.length > 1
      ? 'Найдено несколько вариантов — выберите:'
      : 'Найден подходящий вариант:';

  return (
    <>
      <Modal title="Новый продукт" onClose={onClose}>
        {matchStep === 'form' ? (
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-5 pt-1">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
                Название
              </p>
              <div className="relative">
                <Input
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
                  При добавлении покажем варианты или спросим подтверждение
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
        ) : (
          <ProductMatchPicker
            suggestions={matchStep === 'matches' ? matchSuggestions : []}
            aiResult={matchStep === 'ai' ? aiResult : null}
            title={matchStep === 'ai' ? 'Проверьте результат ИИ:' : matchTitle}
            onPickSuggestion={handlePickSuggestion}
            onConfirmAi={handleConfirmAi}
            onBack={() => {
              setMatchStep('form');
              setMatchSuggestions([]);
              setAiResult(null);
              haptic('light');
            }}
          />
        )}
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
