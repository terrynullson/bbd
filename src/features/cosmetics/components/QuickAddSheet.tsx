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
import { assessBarcodeTrust } from '../lib/barcode';
import { inferCategoryFromText } from '../lib/categories';
import { haptic } from '@/lib/haptics';
import type {
  AddProductInput,
  AnalyzeProductResponse,
  BarcodeSource,
  CosmeticItem,
  LookupProductResponse,
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
  barcodeSource?: BarcodeSource,
  lookup?: LookupProductResponse,
): AddProductInput {
  const trimmedBarcode = barcode || suggestion.barcode;
  const barcodeTrust = trimmedBarcode
    ? assessBarcodeTrust({
        barcode: trimmedBarcode,
        source: barcodeSource ?? (barcode ? 'scan' : 'manual'),
        lookup,
        savedName: suggestion.name,
      })
    : undefined;

  return {
    name: suggestion.name,
    brand: suggestion.brand ?? 'Неизвестный бренд',
    barcode: trimmedBarcode,
    barcodeSource,
    barcodeTrust,
    paoMonths: suggestion.paoMonths ?? 12,
    openedAt: new Date(todayIso()).toISOString(),
    isSealed,
    category: suggestion.category,
    imageUrl: suggestion.imageUrl,
    lookupSource:
      suggestion.source === 'catalog'
        ? 'catalog'
        : lookup?.source === 'open-beauty-facts'
          ? 'open-beauty-facts'
          : 'manual',
    paoSource: suggestion.paoMonths ? 'catalog' : undefined,
  };
}

function lookupToSuggestion(
  lookup: LookupProductResponse,
  barcode: string,
): ProductSuggestion {
  return {
    id: `lookup-${barcode}`,
    brand: lookup.brand,
    name: lookup.name!,
    barcode,
    paoMonths: lookup.paoMonths,
    category: lookup.category,
    imageUrl: lookup.imageUrl,
    source: 'catalog',
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
    initialDraft?.isSealed === undefined ? false : !initialDraft.isSealed,
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
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
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
      void fetchProductSuggestions({ type: 'product', query: name })
        .then(setRemoteSuggestions)
        .catch(() => setRemoteSuggestions([]));
    }, 280);

    return () => clearTimeout(timeout);
  }, [name]);

  const isSealed = !isPackagingOpen;

  const buildDraft = (extra?: Partial<AddProductInput>): Partial<AddProductInput> => ({
    name: name.trim() || undefined,
    barcode: barcode.trim() || undefined,
    isSealed,
    openedAt: new Date(todayIso()).toISOString(),
    lookupSource: 'manual',
    ...extra,
  });

  const handleManualFill = () => {
    haptic('light');
    onManualFill(buildDraft());
    onClose();
  };

  const openManualFromSuggestion = (suggestion: ProductSuggestion) => {
    haptic('light');
    onManualFill(
      suggestionToInput(
        suggestion,
        isSealed,
        barcode.trim() || suggestion.barcode,
        barcode.trim() ? 'scan' : undefined,
      ),
    );
    onClose();
  };

  const handleSuggestionKeyDown = useSuggestionKeyboard({
    suggestions,
    highlightIndex,
    setHighlightIndex,
    onPick: openManualFromSuggestion,
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

  const handleQuickAdd = async () => {
    const trimmedName = name.trim();
    const trimmedBarcode = barcode.trim();

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
          const suggestion = lookupToSuggestion(lookup, trimmedBarcode);
          submitProduct(
            suggestionToInput(
              suggestion,
              isSealed,
              trimmedBarcode,
              'scan',
              lookup,
            ),
          );
          return;
        }

        if (!trimmedName) {
          setError('Штрих-код не найден. Введите название или нажмите «Подобрать»');
          haptic('error');
          return;
        }
      }

      if (trimmedName) {
        const matches = await collectMatches(trimmedName);

        if (matches.length === 1) {
          submitProduct(
            suggestionToInput(
              matches[0]!,
              isSealed,
              trimmedBarcode || matches[0]!.barcode,
              trimmedBarcode ? 'scan' : undefined,
            ),
          );
          return;
        }

        if (matches.length > 1) {
          setError('Найдено несколько вариантов — нажмите «Подобрать»');
          haptic('error');
          return;
        }

        if (!trimmedBarcode) {
          submitProduct({
            name: trimmedName,
            brand: 'Неизвестный бренд',
            paoMonths: 12,
            openedAt: new Date(todayIso()).toISOString(),
            isSealed,
            category: inferCategoryFromText(trimmedName),
            lookupSource: 'manual',
            paoSource: 'preset',
          });
          return;
        }

        setError('Не удалось добавить. Нажмите «Подобрать» или заполните вручную');
        haptic('error');
        return;
      }
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

  const handlePickSearch = async () => {
    const trimmedName = name.trim();
    const trimmedBarcode = barcode.trim();

    if (!trimmedName && !trimmedBarcode) {
      setError('Введите название или отсканируйте штрих-код');
      haptic('error');
      return;
    }

    if (!isOnline) {
      setError('Нужен интернет для подбора');
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
          setMatchSuggestions([lookupToSuggestion(lookup, trimmedBarcode)]);
          setAiResult(null);
          setMatchStep('matches');
          return;
        }
      }

      if (trimmedName) {
        const matches = await collectMatches(trimmedName);
        if (matches.length > 0) {
          setMatchSuggestions(matches);
          setAiResult(null);
          setMatchStep('matches');
          return;
        }
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
    openManualFromSuggestion(suggestion);
  };

  const handleConfirmAi = () => {
    if (!aiResult) return;

    onManualFill(
      buildDraft({
        name: aiResult.name,
        brand: aiResult.brand,
        barcode: barcode.trim() || undefined,
        paoMonths: aiResult.paoMonths,
        category:
          aiResult.category ??
          inferCategoryFromText(`${aiResult.brand} ${aiResult.name}`),
        lookupSource: barcode.trim() ? 'ai-barcode' : 'ai',
        paoSource: 'ai_estimate',
      }),
    );
    haptic('light');
    onClose();
  };

  const handleBarcodeScan = async (code: string) => {
    setBarcode(code);
    setIsScannerOpen(false);
    setError('');
    haptic('success');

    try {
      const lookup = await lookupProductByBarcode(code);
      if (lookup.found && lookup.name) {
        setName(lookup.name);
        setMatchSuggestions([lookupToSuggestion(lookup, code)]);
        setAiResult(null);
        setMatchStep('matches');
        return;
      }
    } catch {
      // Unknown barcode — keep code only, user picks next action.
    }
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void handleQuickAdd();
  };

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
                    onPick={openManualFromSuggestion}
                  />
                )}
              </div>
              {barcode && (
                <p className="mt-2 text-xs text-muted">Штрих-код: {barcode}</p>
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

            <Button
              type="button"
              variant="secondary"
              size="lg"
              disabled={isLoading || !isOnline}
              onClick={() => void handlePickSearch()}
              className="h-12 w-full rounded-[14px]"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Подобрать
            </Button>

            {!isOnline && (
              <p className="text-center text-xs text-muted">
                Нужен интернет для подбора
              </p>
            )}

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
