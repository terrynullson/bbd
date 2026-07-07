'use client';

import { ScanBarcode, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { BarcodeScanner } from './BarcodeScanner';
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
import {
  GENERIC_AI_RESULT_MESSAGE,
  isLowQualityAiResult,
} from '../lib/ai-result-quality';
import { getDefaultPaoMonths, inferTaxonomy } from '../lib/taxonomy';
import { haptic } from '@/lib/haptics';
import type {
  AddProductInput,
  AnalyzeProductResponse,
  BarcodeSource,
  CosmeticItem,
  LookupProductResponse,
  ProductSuggestion,
} from '../types';

const SUGGEST_MIN_CHARS = 4;

type QuickAddSheetProps = {
  localItems: CosmeticItem[];
  initialDraft?: Partial<AddProductInput>;
  onClose: () => void;
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
  const brand = suggestion.brand ?? 'Неизвестный бренд';
  const category =
    suggestion.category ?? inferCategoryFromText(`${brand} ${suggestion.name}`);
  const presetPaoMonths = getPresetPaoMonths(
    category,
    `${brand} ${suggestion.name}`,
  );
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
    brand,
    barcode: trimmedBarcode,
    barcodeSource,
    barcodeTrust,
    paoMonths: suggestion.paoMonths ?? presetPaoMonths,
    openedAt: new Date(todayIso()).toISOString(),
    isSealed,
    category,
    imageUrl: suggestion.imageUrl,
    lookupSource:
      suggestion.source === 'catalog'
        ? 'catalog'
        : lookup?.source === 'open-beauty-facts'
          ? 'open-beauty-facts'
          : 'manual',
    paoSource: suggestion.paoMonths ? 'catalog' : 'preset',
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

function getPresetPaoMonths(category: AddProductInput['category'], text: string) {
  return getDefaultPaoMonths(inferTaxonomy(category, text).subtype);
}

export function QuickAddSheet({
  localItems,
  initialDraft,
  onClose,
  onManualFill,
}: QuickAddSheetProps) {
  const [name, setName] = useState(initialDraft?.name ?? '');
  const [barcode, setBarcode] = useState(initialDraft?.barcode ?? '');
  const [barcodeNotFound, setBarcodeNotFound] = useState(false);
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

  const isSealed = initialDraft?.isSealed ?? true;

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
    if (query.length < SUGGEST_MIN_CHARS) return [];

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
    if (name.trim().length < SUGGEST_MIN_CHARS) {
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

  const trimmedName = name.trim();
  const trimmedBarcode = barcode.trim();
  const canPick =
    isOnline && (trimmedName.length >= SUGGEST_MIN_CHARS || Boolean(trimmedBarcode));

  const buildDraft = (extra?: Partial<AddProductInput>): Partial<AddProductInput> => ({
    name: trimmedName || undefined,
    barcode: trimmedBarcode || undefined,
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
        trimmedBarcode || suggestion.barcode,
        trimmedBarcode ? 'scan' : undefined,
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

  const collectMatches = async (queryName: string) => {
    const query = normalizeSuggestion(queryName);
    const local =
      query.length < SUGGEST_MIN_CHARS
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
      query.length >= SUGGEST_MIN_CHARS
        ? await fetchProductSuggestions({ type: 'product', query: queryName })
        : [];

    return mergeSuggestions(local, remote);
  };

  const handlePickSearch = async () => {
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
          setBarcodeNotFound(false);
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

      if (isLowQualityAiResult(result, { hasBarcode: Boolean(trimmedBarcode) })) {
        setError(GENERIC_AI_RESULT_MESSAGE);
        setMatchStep('form');
        haptic('error');
        return;
      }

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
        barcode: trimmedBarcode || undefined,
        paoMonths: aiResult.paoMonths,
        category:
          aiResult.category ??
          inferCategoryFromText(`${aiResult.brand} ${aiResult.name}`),
        lookupSource: trimmedBarcode ? 'ai-barcode' : 'ai',
        paoSource: 'ai_estimate',
      }),
    );
    haptic('light');
    onClose();
  };

  const handleBarcodeScan = async (code: string) => {
    setBarcode(code);
    setBarcodeNotFound(false);
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

    setBarcodeNotFound(true);
  };

  const matchTitle =
    matchSuggestions.length > 1
      ? 'Найдено несколько вариантов — выберите:'
      : 'Найден подходящий вариант:';

  return (
    <>
      <Modal title="Новый продукт" onClose={onClose}>
        {matchStep === 'form' ? (
          <div className="flex flex-col gap-5 pt-1">
            <div>
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
                    setBarcodeNotFound(false);
                    if (error) setError('');
                  }}
                  onKeyDown={handleSuggestionKeyDown}
                  className="pr-[5.75rem]"
                />
                <div className="absolute right-1 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
                  {canPick && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => void handlePickSearch()}
                      disabled={isLoading}
                      aria-label="Подобрать"
                      title="Подобрать"
                      className="h-9 w-9 shrink-0 shadow-none"
                    >
                      {isLoading ? (
                        <Spinner />
                      ) : (
                        <Sparkles className="h-4 w-4 text-accent" />
                      )}
                    </Button>
                  )}
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
                    className="h-9 w-9 shrink-0 shadow-none"
                  >
                    <ScanBarcode className="h-5 w-5 text-muted" />
                  </Button>
                </div>
                {isFocused && suggestions.length > 0 && (
                  <SuggestionDropdown
                    suggestions={suggestions}
                    mode="product"
                    highlightIndex={highlightIndex}
                    onHighlight={setHighlightIndex}
                    onPick={openManualFromSuggestion}
                    heading="Возможно, вы имели в виду"
                  />
                )}
              </div>
              {barcodeNotFound && (
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Не нашли продукт по штрих-коду.{' '}
                  <button
                    type="button"
                    onClick={handleManualFill}
                    className="font-medium text-accent underline-offset-2 hover:underline"
                  >
                    Полная форма
                  </button>
                </p>
              )}
            </div>

            {error && <p className="text-xs text-expired">{error}</p>}

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
              Полная форма
            </button>
          </div>
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
