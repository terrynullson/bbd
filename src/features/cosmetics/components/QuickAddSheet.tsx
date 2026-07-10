'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { BarcodeScanner } from './BarcodeScanner';
import {
  SuggestionDropdown,
  useSuggestionKeyboard,
} from './SuggestionDropdown';
import { analyzeProduct } from '../api/analyze-product';
import { lookupProductByBarcode } from '../api/lookup-product';
import { fetchProductSuggestions } from '../api/suggest-products';
import { assessBarcodeTrust } from '../lib/barcode';
import {
  CATEGORY_ORDER,
  getCategoryTitle,
  inferCategoryFromText,
} from '../lib/categories';
import {
  GENERIC_AI_RESULT_MESSAGE,
  isLowQualityAiResult,
} from '../lib/ai-result-quality';
import { plural } from '../lib/plural';
import { getDefaultPaoMonths, inferTaxonomy } from '../lib/taxonomy';
import { PAO_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import type {
  AddProductInput,
  AnalyzeProductResponse,
  CosmeticItem,
  LookupProductResponse,
  ProductCategory,
  ProductSuggestion,
} from '../types';

const SUGGEST_MIN_CHARS = 4;
const UNKNOWN_BRAND = 'Неизвестный бренд';

type AddMode = 'manual' | 'scan' | 'ai';
type ScanState = 'idle' | 'found' | 'notfound';

type QuickAddSheetProps = {
  localItems: CosmeticItem[];
  initialDraft?: Partial<AddProductInput>;
  onClose: () => void;
  onManualFill: (draft: Partial<AddProductInput>) => void;
  onSubmit: (input: AddProductInput) => void;
};

const MODES: Array<{ id: AddMode; label: string }> = [
  { id: 'manual', label: 'Вручную' },
  { id: 'scan', label: 'Штрих-код' },
  { id: 'ai', label: 'ИИ-подбор' },
];

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function mergeSuggestions(
  local: ProductSuggestion[],
  remote: ProductSuggestion[],
) {
  const seen = new Set<string>();
  return [...local, ...remote]
    .filter((suggestion) => {
      const key = normalize(`${suggestion.brand ?? ''} ${suggestion.name}`);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

function presetPao(category: ProductCategory, text: string) {
  return getDefaultPaoMonths(inferTaxonomy(category, text).subtype);
}

function monthsText(months: number) {
  return `${months} ${plural(months, ['месяц', 'месяца', 'месяцев'])}`;
}

/* ── общие поля ──────────────────────────────────────── */

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="quiet-label mb-2">{children}</p>;
}

const inputClass =
  'min-h-[52px] w-full rounded-[16px] border border-border bg-surface px-4 text-[15px] text-text placeholder:text-muted/70 focus:border-accent focus:outline-none';

const primaryButtonClass =
  'motion-safe-transition min-h-[54px] w-full rounded-full bg-[var(--nav-pill)] px-4 text-[15px] font-semibold text-[var(--nav-pill-fg)] transition-all duration-300 active:scale-[0.98] disabled:opacity-50';

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'motion-safe-transition min-h-[42px] shrink-0 rounded-full border px-4 text-[13px] font-semibold transition-all duration-300 active:scale-[0.98]',
        active
          ? 'border-text bg-text text-bg'
          : 'border-[var(--chip-border)] bg-transparent text-[var(--chip-text)]',
      )}
    >
      {children}
    </button>
  );
}

/* ── лист добавления ─────────────────────────────────── */

export function QuickAddSheet({
  localItems,
  initialDraft,
  onClose,
  onManualFill,
  onSubmit,
}: QuickAddSheetProps) {
  const [mode, setMode] = useState<AddMode>('manual');

  // вручную
  const [name, setName] = useState(initialDraft?.name ?? '');
  const [pickedCategory, setPickedCategory] = useState<ProductCategory | null>(
    initialDraft?.category ?? null,
  );
  const [openedAt, setOpenedAt] = useState(todayIso());
  const [pickedPao, setPickedPao] = useState<number | null>(
    initialDraft?.paoMonths ?? null,
  );
  const [remoteSuggestions, setRemoteSuggestions] = useState<ProductSuggestion[]>(
    [],
  );
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);

  // штрих-код
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [scanned, setScanned] = useState<{
    barcode: string;
    lookup: LookupProductResponse;
  } | null>(null);

  // ии
  const [aiQuery, setAiQuery] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiResult, setAiResult] = useState<AnalyzeProductResponse | null>(null);

  const [error, setError] = useState('');
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  // Категория и PAO выводятся из названия, пока их не выбрали руками.
  const category =
    pickedCategory ??
    (name.trim().length >= 3 ? inferCategoryFromText(name) : 'cream');
  const paoMonths = pickedPao ?? presetPao(category, name);

  const localSuggestions = useMemo(() => {
    const query = normalize(name);
    if (query.length < SUGGEST_MIN_CHARS) return [];

    return localItems
      .filter((product) => normalize(product.name).includes(query))
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

  const buildManualInput = (): AddProductInput => {
    const trimmed = name.trim();
    const taxonomy = inferTaxonomy(category, trimmed);

    return {
      name: trimmed,
      brand: UNKNOWN_BRAND,
      paoMonths,
      openedAt: new Date(openedAt).toISOString(),
      isSealed: false,
      category,
      productGroup: taxonomy.group,
      productSubtype: taxonomy.subtype,
      paoSource: pickedPao !== null ? 'user' : 'preset',
      lookupSource: 'manual',
    };
  };

  const handleManualSubmit = () => {
    if (!name.trim()) {
      setError('Введите название средства');
      haptic('error');
      return;
    }
    haptic('medium');
    onSubmit(buildManualInput());
    onClose();
  };

  const openFullForm = () => {
    haptic('light');
    onManualFill({
      name: name.trim() || undefined,
      category,
      paoMonths,
      openedAt: new Date(openedAt).toISOString(),
      isSealed: false,
      lookupSource: 'manual',
    });
    onClose();
  };

  const pickSuggestion = (suggestion: ProductSuggestion) => {
    setName(suggestion.name);
    if (suggestion.category) setPickedCategory(suggestion.category);
    if (suggestion.paoMonths) setPickedPao(suggestion.paoMonths);
    setIsFocused(false);
  };

  const handleSuggestionKeyDown = useSuggestionKeyboard({
    suggestions,
    highlightIndex,
    setHighlightIndex,
    onPick: pickSuggestion,
    enabled: isFocused && mode === 'manual',
  });

  /* штрих-код */

  const handleBarcodeScan = async (code: string) => {
    setIsScannerOpen(false);
    setError('');
    haptic('success');

    try {
      const lookup = await lookupProductByBarcode(code);
      if (lookup.found && lookup.name) {
        setScanned({ barcode: code, lookup });
        setScanState('found');
        return;
      }
    } catch {
      // Неизвестный штрих-код — предложим заполнить вручную.
    }

    setScanned({ barcode: code, lookup: { found: false } });
    setScanState('notfound');
  };

  const addScanned = () => {
    const productName = scanned?.lookup.name;
    if (!scanned || !productName) return;
    const { barcode, lookup } = scanned;
    const brand = lookup.brand ?? UNKNOWN_BRAND;
    const cat = lookup.category ?? inferCategoryFromText(`${brand} ${productName}`);
    const taxonomy = inferTaxonomy(cat, `${brand} ${productName}`);

    haptic('medium');
    onSubmit({
      name: productName,
      brand,
      barcode,
      barcodeSource: 'scan',
      barcodeTrust: assessBarcodeTrust({
        barcode,
        source: 'scan',
        lookup,
        savedName: productName,
      }),
      paoMonths: lookup.paoMonths ?? presetPao(cat, `${brand} ${productName}`),
      openedAt: new Date(todayIso()).toISOString(),
      isSealed: false,
      category: cat,
      productGroup: taxonomy.group,
      productSubtype: taxonomy.subtype,
      imageUrl: lookup.imageUrl,
      paoSource: lookup.paoMonths ? 'catalog' : 'preset',
      lookupSource: lookup.source === 'catalog' ? 'catalog' : 'open-beauty-facts',
    });
    onClose();
  };

  /* ии */

  const askAi = async () => {
    const query = aiQuery.trim();
    if (!query) {
      setError('Опишите средство');
      haptic('error');
      return;
    }
    if (!isOnline) {
      setError('Нужен интернет для подбора');
      haptic('error');
      return;
    }

    setAiThinking(true);
    setAiResult(null);
    setError('');
    haptic('medium');

    try {
      const result = await analyzeProduct({ name: query });
      if (isLowQualityAiResult(result, { hasBarcode: false })) {
        setError(GENERIC_AI_RESULT_MESSAGE);
        haptic('error');
        return;
      }
      setAiResult(result);
    } catch (aiError) {
      setError(
        aiError instanceof Error ? aiError.message : 'Не удалось подобрать срок',
      );
      haptic('error');
    } finally {
      setAiThinking(false);
    }
  };

  const acceptAi = () => {
    if (!aiResult) return;
    const cat =
      aiResult.category ??
      inferCategoryFromText(`${aiResult.brand} ${aiResult.name}`);
    const taxonomy = inferTaxonomy(cat, `${aiResult.brand} ${aiResult.name}`);

    haptic('medium');
    onSubmit({
      name: aiResult.name,
      brand: aiResult.brand,
      paoMonths: aiResult.paoMonths,
      openedAt: new Date(todayIso()).toISOString(),
      isSealed: false,
      category: cat,
      productGroup: taxonomy.group,
      productSubtype: taxonomy.subtype,
      paoSource: 'ai_estimate',
      lookupSource: 'ai',
    });
    onClose();
  };

  const switchMode = (next: AddMode) => {
    setMode(next);
    setError('');
    haptic('light');
  };

  return (
    <>
      <Modal title="" onClose={onClose}>
        <p className="quiet-label">Новое средство</p>
        <h1 className="font-display mb-5 mt-2.5 text-[28px] text-text">
          Добавить на полку
        </h1>

        <div
          role="tablist"
          aria-label="Способ добавления"
          className="mb-6 flex rounded-full p-1"
          style={{ background: 'var(--icon-bg)' }}
        >
          {MODES.map((item) => {
            const active = mode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => switchMode(item.id)}
                className={cn(
                  'motion-safe-transition min-h-11 flex-1 rounded-full text-[13.5px] font-semibold transition-all duration-300',
                  active
                    ? 'bg-surface text-text shadow-[0_2px_8px_rgba(46,42,36,0.1)]'
                    : 'text-muted',
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {mode === 'manual' && (
          <div className="flex flex-col gap-[18px]">
            <div>
              <FieldLabel>Название</FieldLabel>
              <div className="relative">
                <input
                  aria-label="Название средства"
                  placeholder="Крем для лица с церамидами"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (error) setError('');
                  }}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 120)}
                  onKeyDown={handleSuggestionKeyDown}
                  className={inputClass}
                />
                {isFocused && suggestions.length > 0 && (
                  <SuggestionDropdown
                    suggestions={suggestions}
                    mode="product"
                    highlightIndex={highlightIndex}
                    onHighlight={setHighlightIndex}
                    onPick={pickSuggestion}
                    heading="Возможно, вы имели в виду"
                  />
                )}
              </div>
            </div>

            <div>
              <FieldLabel>Категория</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ORDER.map((id) => (
                  <Chip
                    key={id}
                    active={category === id}
                    onClick={() => {
                      setPickedCategory(id);
                      setPickedPao(null);
                    }}
                  >
                    {getCategoryTitle(id)}
                  </Chip>
                ))}
              </div>
            </div>

            <div>
              <FieldLabel>Дата вскрытия</FieldLabel>
              <input
                type="date"
                aria-label="Дата вскрытия"
                value={openedAt}
                max={todayIso()}
                onChange={(event) => setOpenedAt(event.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <FieldLabel>Срок после вскрытия</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {PAO_OPTIONS.map((months) => (
                  <Chip
                    key={months}
                    active={paoMonths === months}
                    onClick={() => setPickedPao(months)}
                  >
                    {months} мес
                  </Chip>
                ))}
              </div>
            </div>

            {error && <p className="text-xs text-expired">{error}</p>}

            <button
              type="button"
              onClick={handleManualSubmit}
              className={cn(primaryButtonClass, 'mt-1')}
            >
              Добавить на полку
            </button>

            <button
              type="button"
              onClick={openFullForm}
              className="min-h-11 text-sm text-muted transition-colors hover:text-text"
            >
              Полная форма — бренд, фото, срок с упаковки
            </button>
          </div>
        )}

        {mode === 'scan' && (
          <div className="flex flex-col gap-4">
            <div className="relative flex h-[260px] items-center justify-center overflow-hidden rounded-[24px] bg-[#26221d]">
              <span className="absolute left-5 top-5 h-[26px] w-[26px] rounded-tl-md border-l-2 border-t-2 border-accent" />
              <span className="absolute right-5 top-5 h-[26px] w-[26px] rounded-tr-md border-r-2 border-t-2 border-accent" />
              <span className="absolute bottom-5 left-5 h-[26px] w-[26px] rounded-bl-md border-b-2 border-l-2 border-accent" />
              <span className="absolute bottom-5 right-5 h-[26px] w-[26px] rounded-br-md border-b-2 border-r-2 border-accent" />

              {scanState === 'idle' && (
                <div className="scanline absolute left-8 right-8 top-6 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent" />
              )}

              <p className="px-10 text-center text-[13px] text-muted">
                {scanState === 'found'
                  ? 'Средство найдено'
                  : scanState === 'notfound'
                    ? 'Штрих-код не найден в каталоге'
                    : 'Наведите камеру на штрих-код на упаковке'}
              </p>
            </div>

            {scanState === 'found' && scanned?.lookup.name && (
              <div className="card-enter rounded-card border border-border bg-surface px-5 py-[18px]">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--quiet-gold-deep)]">
                  {scanned.barcode}
                </p>
                <p className="mb-0.5 mt-1.5 text-base font-semibold text-text">
                  {scanned.lookup.name}
                </p>
                <p className="text-[13px] text-muted">
                  {getCategoryTitle(scanned.lookup.category)} · срок после
                  вскрытия{' '}
                  {monthsText(
                    scanned.lookup.paoMonths ??
                      presetPao(
                        scanned.lookup.category ?? 'other',
                        scanned.lookup.name,
                      ),
                  )}
                </p>
                <button
                  type="button"
                  onClick={addScanned}
                  className={cn(primaryButtonClass, 'mt-3.5 min-h-[50px]')}
                >
                  Добавить на полку
                </button>
              </div>
            )}

            {scanState === 'notfound' && (
              <button
                type="button"
                onClick={openFullForm}
                className={primaryButtonClass}
              >
                Заполнить вручную
              </button>
            )}

            {scanState !== 'found' && (
              <button
                type="button"
                onClick={() => {
                  haptic('light');
                  setScanState('idle');
                  setIsScannerOpen(true);
                }}
                className={primaryButtonClass}
              >
                Начать сканирование
              </button>
            )}
          </div>
        )}

        {mode === 'ai' && (
          <div className="flex flex-col gap-4">
            <p className="text-[13.5px] leading-relaxed text-muted">
              Напишите, что за средство — подскажем типичный срок хранения после
              вскрытия.
            </p>

            <input
              aria-label="Описание средства"
              placeholder="Например: сыворотка с витамином C"
              value={aiQuery}
              onChange={(event) => {
                setAiQuery(event.target.value);
                if (error) setError('');
              }}
              className={inputClass}
            />

            <button
              type="button"
              onClick={() => void askAi()}
              disabled={aiThinking}
              className="motion-safe-transition flex min-h-[54px] items-center justify-center rounded-full bg-accent px-4 text-[15px] font-bold text-accent-foreground transition-all duration-300 hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60"
            >
              {aiThinking ? <Spinner /> : 'Подобрать срок'}
            </button>

            {aiThinking && (
              <div className="flex items-center gap-2.5 px-1 py-2 text-[13.5px] text-muted">
                <span className="flex gap-1.5">
                  <span className="ai-dot h-[7px] w-[7px] rounded-full bg-accent" />
                  <span
                    className="ai-dot h-[7px] w-[7px] rounded-full bg-accent"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <span
                    className="ai-dot h-[7px] w-[7px] rounded-full bg-accent"
                    style={{ animationDelay: '0.4s' }}
                  />
                </span>
                Изучаем состав и практику хранения…
              </div>
            )}

            {error && <p className="text-xs text-expired">{error}</p>}

            {!isOnline && (
              <p className="text-center text-xs text-muted">
                Нужен интернет для подбора
              </p>
            )}

            {aiResult && !aiThinking && (
              <div className="card-enter rounded-card border border-border bg-surface px-5 py-[18px]">
                <p className="quiet-label">Рекомендация</p>
                <p className="my-2.5 text-sm leading-relaxed text-text">
                  {aiResult.brand !== UNKNOWN_BRAND
                    ? `${aiResult.brand} · ${aiResult.name}`
                    : aiResult.name}
                </p>
                <div className="mb-3.5 flex items-baseline gap-2">
                  <span className="text-[30px] font-light text-text">
                    {aiResult.paoMonths}
                  </span>
                  <span className="text-[13px] text-muted">
                    {plural(aiResult.paoMonths, [
                      'месяц',
                      'месяца',
                      'месяцев',
                    ])}{' '}
                    после вскрытия
                  </span>
                </div>
                <button
                  type="button"
                  onClick={acceptAi}
                  className={cn(primaryButtonClass, 'min-h-[50px]')}
                >
                  Добавить на полку
                </button>
              </div>
            )}
          </div>
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
