'use client';

import { ScanBarcode } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FormFieldError } from '@/components/ui/FormFieldError';
import { ProductPhotoChip } from './ProductPhotoChip';
import { SmartFillButton } from './SmartFillButton';
import {
  SuggestionDropdown,
  useSuggestionKeyboard,
} from './SuggestionDropdown';
import { fetchProductSuggestions } from '../api/suggest-products';
import type { useAddProductForm } from '../hooks/useAddProductForm';
import type {
  AddProductInput,
  CosmeticItem,
  ProductSuggestion,
} from '../types';

type FormState = ReturnType<typeof useAddProductForm>;

type ProductSummaryCardProps = {
  form: FormState;
  localItems: CosmeticItem[];
  isEditing: boolean;
  initialValues?: Partial<AddProductInput>;
  lookupSourceLabel: string | null;
  onOpenScanner: () => void;
  isLookupLoading: boolean;
  lookupError: string;
  onLookupErrorClear: () => void;
  userId?: string | null;
  nameError?: string;
  onClearNameError?: () => void;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
    </label>
  );
}

function normalizeSuggestion(value: string) {
  return value.trim().toLowerCase();
}

function mergeSuggestions(
  local: ProductSuggestion[],
  remote: ProductSuggestion[],
) {
  const seen = new Set<string>();
  return [...local, ...remote].filter((suggestion) => {
    const key = normalizeSuggestion(`${suggestion.brand ?? ''} ${suggestion.name}`);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);
}

function getSummaryLabel(brand: string, name: string) {
  const trimmedBrand = brand.trim();
  const trimmedName = name.trim();
  if (trimmedBrand && trimmedName) return `${trimmedBrand} · ${trimmedName}`;
  return trimmedName || trimmedBrand || 'Без названия';
}

export function getLookupSourceLabel(source: AddProductInput['lookupSource']) {
  switch (source) {
    case 'catalog':
      return 'Данные из каталога';
    case 'open-beauty-facts':
      return 'Данные из Open Beauty Facts';
    case 'barcode':
      return 'Данные по штрих-коду';
    case 'ai':
    case 'ai-barcode':
      return 'Данные подобраны ИИ';
    default:
      return null;
  }
}

export function ProductSummaryCard({
  form,
  localItems,
  isEditing,
  initialValues,
  lookupSourceLabel,
  onOpenScanner,
  isLookupLoading,
  lookupError,
  onLookupErrorClear,
  userId,
  nameError,
  onClearNameError,
}: ProductSummaryCardProps) {
  const isConfirmMode =
    !isEditing &&
    Boolean(initialValues?.name?.trim()) &&
    initialValues?.lookupSource !== 'manual';

  const [isIdentityExpanded, setIsIdentityExpanded] = useState(
    isEditing || !isConfirmMode,
  );

  useEffect(() => {
    setIsIdentityExpanded(isEditing || !isConfirmMode);
  }, [isEditing, isConfirmMode, initialValues?.name, initialValues?.lookupSource]);
  const [remoteBrandSuggestions, setRemoteBrandSuggestions] = useState<
    ProductSuggestion[]
  >([]);
  const [remoteProductSuggestions, setRemoteProductSuggestions] = useState<
    ProductSuggestion[]
  >([]);
  const [brandHighlight, setBrandHighlight] = useState(-1);
  const [productHighlight, setProductHighlight] = useState(-1);
  const [brandFocused, setBrandFocused] = useState(false);
  const [productFocused, setProductFocused] = useState(false);

  useEffect(() => {
    if (nameError) setIsIdentityExpanded(true);
  }, [nameError]);

  const localBrandSuggestions = useMemo(() => {
    const query = normalizeSuggestion(form.brand);
    if (query.length < 2) return [];

    return localItems
      .filter((product) => normalizeSuggestion(product.brand).includes(query))
      .map((product) => ({
        id: product.id,
        name: product.brand,
        source: 'local' as const,
      }));
  }, [form.brand, localItems]);

  const localProductSuggestions = useMemo(() => {
    const query = normalizeSuggestion(form.name);
    const brand = normalizeSuggestion(form.brand);
    if (query.length < 2) return [];

    return localItems
      .filter((product) => {
        const matchesName = normalizeSuggestion(product.name).includes(query);
        const matchesBrand =
          !brand || normalizeSuggestion(product.brand).includes(brand);
        return matchesName && matchesBrand;
      })
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
  }, [form.brand, form.name, localItems]);

  const brandSuggestions = useMemo(
    () => mergeSuggestions(localBrandSuggestions, remoteBrandSuggestions),
    [localBrandSuggestions, remoteBrandSuggestions],
  );

  const productSuggestions = useMemo(
    () => mergeSuggestions(localProductSuggestions, remoteProductSuggestions),
    [localProductSuggestions, remoteProductSuggestions],
  );

  useEffect(() => {
    setBrandHighlight(brandSuggestions.length > 0 ? 0 : -1);
  }, [brandSuggestions]);

  useEffect(() => {
    setProductHighlight(productSuggestions.length > 0 ? 0 : -1);
  }, [productSuggestions]);

  useEffect(() => {
    if (!isIdentityExpanded || form.brand.trim().length < 2) {
      setRemoteBrandSuggestions([]);
      return;
    }

    const timeout = setTimeout(() => {
      void fetchProductSuggestions({ type: 'brand', query: form.brand })
        .then(setRemoteBrandSuggestions)
        .catch(() => setRemoteBrandSuggestions([]));
    }, 250);

    return () => clearTimeout(timeout);
  }, [form.brand, isIdentityExpanded]);

  useEffect(() => {
    if (!isIdentityExpanded || form.name.trim().length < 2) {
      setRemoteProductSuggestions([]);
      return;
    }

    const timeout = setTimeout(() => {
      void fetchProductSuggestions({
        type: 'product',
        query: form.name,
        brand: form.brand,
      })
        .then(setRemoteProductSuggestions)
        .catch(() => setRemoteProductSuggestions([]));
    }, 250);

    return () => clearTimeout(timeout);
  }, [form.brand, form.name, isIdentityExpanded]);

  const applyProductSuggestion = (suggestion: ProductSuggestion) => {
    if (suggestion.brand) form.setBrand(suggestion.brand);
    form.setName(suggestion.name);
    if (suggestion.barcode) form.setBarcode(suggestion.barcode, 'manual');
    if (suggestion.paoMonths) form.setPaoMonths(suggestion.paoMonths, 'catalog');
    if (suggestion.category) form.setCategory(suggestion.category);
    if (suggestion.imageUrl) form.setImageUrl(suggestion.imageUrl);
    form.setLookupSource(suggestion.source === 'catalog' ? 'catalog' : 'manual');
    setProductFocused(false);
    setBrandFocused(false);
  };

  const handleBrandPick = (suggestion: ProductSuggestion) => {
    form.setBrand(suggestion.name);
    setBrandFocused(false);
  };

  const handleBrandKeyDown = useSuggestionKeyboard({
    suggestions: brandSuggestions,
    highlightIndex: brandHighlight,
    setHighlightIndex: setBrandHighlight,
    onPick: handleBrandPick,
    enabled: brandFocused,
  });

  const handleProductKeyDown = useSuggestionKeyboard({
    suggestions: productSuggestions,
    highlightIndex: productHighlight,
    setHighlightIndex: setProductHighlight,
    onPick: applyProductSuggestion,
    enabled: productFocused,
  });

  if (!isIdentityExpanded) {
    const summaryBrand = form.brand || initialValues?.brand || '';
    const summaryName = form.name || initialValues?.name || '';

    return (
      <div className="rounded-[14px] border border-border/60 bg-bg/50 p-3">
        <div className="flex items-start gap-3">
          <ProductPhotoChip
            value={form.imageUrl || initialValues?.imageUrl}
            onChange={form.setImageUrl}
            userId={userId}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text">
              {getSummaryLabel(summaryBrand, summaryName)}
            </p>
            {lookupSourceLabel && (
              <p className="mt-0.5 text-xs text-muted">{lookupSourceLabel}</p>
            )}
            {(form.barcode.trim() || initialValues?.barcode) && (
              <p className="mt-0.5 truncate text-xs text-muted">
                ШК: {form.barcode.trim() || initialValues?.barcode}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsIdentityExpanded(true)}
            className="shrink-0 text-sm font-medium text-accent underline-offset-2 hover:underline"
          >
            Изменить
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <ProductPhotoChip
          value={form.imageUrl}
          onChange={form.setImageUrl}
          userId={userId}
        />
        <p className="text-xs text-muted">
          {form.imageUrl
            ? 'Нажмите на фото, чтобы заменить'
            : 'Добавьте фото продукта (опционально)'}
        </p>
      </div>

      {isConfirmMode && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsIdentityExpanded(false)}
            className="text-xs text-muted underline-offset-2 hover:text-text hover:underline"
          >
            Свернуть
          </button>
        </div>
      )}

      <div className="relative">
        <div className="relative">
          <Input
            aria-label="Название продукта"
            aria-autocomplete="list"
            aria-expanded={productFocused && productSuggestions.length > 0}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? 'product-name-error' : undefined}
            placeholder="Название продукта"
            value={form.name}
            error={Boolean(nameError)}
            className="min-w-0 pr-[2.75rem]"
            onFocus={() => setProductFocused(true)}
            onBlur={() => setTimeout(() => setProductFocused(false), 120)}
            onChange={(e) => {
              form.setName(e.target.value);
              onClearNameError?.();
              if (form.smartError) form.setSmartError('');
            }}
            onKeyDown={handleProductKeyDown}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            <SmartFillButton
              variant="inline"
              onClick={form.handleSmartFill}
              disabled={!form.canSmartFill}
              loading={form.isSmartLoading}
            />
          </div>
        </div>
        {nameError && (
          <FormFieldError id="product-name-error">{nameError}</FormFieldError>
        )}
        {productFocused && (
          <SuggestionDropdown
            suggestions={productSuggestions}
            mode="product"
            highlightIndex={productHighlight}
            onHighlight={setProductHighlight}
            onPick={applyProductSuggestion}
          />
        )}
        {form.smartError && (
          <p className="mt-2 text-xs text-expired">{form.smartError}</p>
        )}
        {form.smartFillOfflineMessage && (
          <p className="mt-2 text-xs text-muted">{form.smartFillOfflineMessage}</p>
        )}
      </div>

      <div className="relative">
        <FieldLabel>Бренд</FieldLabel>
        <Input
          aria-label="Бренд"
          aria-autocomplete="list"
          aria-expanded={brandFocused && brandSuggestions.length > 0}
          placeholder="Бренд"
          value={form.brand}
          onFocus={() => setBrandFocused(true)}
          onBlur={() => setTimeout(() => setBrandFocused(false), 120)}
          onChange={(e) => {
            form.setBrand(e.target.value);
            if (form.smartError) form.setSmartError('');
          }}
          onKeyDown={handleBrandKeyDown}
        />
        {brandFocused && (
          <SuggestionDropdown
            suggestions={brandSuggestions}
            mode="brand"
            highlightIndex={brandHighlight}
            onHighlight={setBrandHighlight}
            onPick={handleBrandPick}
          />
        )}
      </div>

      <div>
        <FieldLabel>Штрих-код</FieldLabel>
        <div className="relative">
          <Input
            aria-label="Штрих-код"
            placeholder="Штрих-код"
            value={form.barcode}
            onChange={(e) => {
              form.setBarcode(e.target.value, 'manual');
              onLookupErrorClear();
            }}
            className="min-w-0 pr-12"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onOpenScanner}
            aria-label="Сканировать штрих-код"
            disabled={isLookupLoading}
            className="absolute right-1 top-1/2 h-9 w-9 shrink-0 -translate-y-1/2 shadow-none"
          >
            <ScanBarcode className="h-5 w-5 text-muted" />
          </Button>
        </div>
        {(isLookupLoading || lookupError) && (
          <p
            className={`mt-2 text-xs ${
              lookupError ? 'text-muted' : 'text-accent'
            }`}
          >
            {isLookupLoading
              ? 'Ищем продукт по штрих-коду...'
              : lookupError}
          </p>
        )}
      </div>

      {lookupSourceLabel && !isEditing && (
        <p className="rounded-[12px] bg-accent/5 px-3 py-2 text-xs text-muted">
          {lookupSourceLabel}
        </p>
      )}
    </div>
  );
}
