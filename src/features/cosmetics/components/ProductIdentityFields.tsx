'use client';

import { ScanBarcode } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { FormFieldError } from '@/components/ui/FormFieldError';
import { ProductPhotoChip } from './ProductPhotoChip';
import { SmartFillButton } from './SmartFillButton';
import { SuggestionDropdown } from './SuggestionDropdown';
import { useSuggestions } from '../hooks/useSuggestions';
import type { CosmeticItem, ProductSuggestion } from '../types';

type SmartFill = {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  error: string;
  offlineMessage: string;
  onClearError: () => void;
};

type ProductIdentityFieldsProps = {
  name: string;
  brand: string;
  barcode: string;
  imageUrl: string;
  onNameChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onBarcodeChange: (value: string) => void;
  onImageChange: (url: string) => void;
  onPickProduct: (suggestion: ProductSuggestion) => void;
  onPickBrand: (suggestion: ProductSuggestion) => void;
  smartFill: SmartFill;
  localItems: CosmeticItem[];
  userId?: string | null;
  nameError?: string;
  onClearNameError?: () => void;
  onOpenScanner: () => void;
  isLookupLoading: boolean;
  lookupError: string;
  onLookupErrorClear: () => void;
  lookupSourceLabel: string | null;
  showSourceNote: boolean;
  onCollapse?: () => void;
};

export function ProductIdentityFields({
  name,
  brand,
  barcode,
  imageUrl,
  onNameChange,
  onBrandChange,
  onBarcodeChange,
  onImageChange,
  onPickProduct,
  onPickBrand,
  smartFill,
  localItems,
  userId,
  nameError,
  onClearNameError,
  onOpenScanner,
  isLookupLoading,
  lookupError,
  onLookupErrorClear,
  lookupSourceLabel,
  showSourceNote,
  onCollapse,
}: ProductIdentityFieldsProps) {
  const [brandFocused, setBrandFocused] = useState(false);
  const [productFocused, setProductFocused] = useState(false);

  const productSuggestions = useSuggestions({
    type: 'product',
    query: name,
    brand,
    localItems,
    onPick: (suggestion) => {
      onPickProduct(suggestion);
      setProductFocused(false);
      setBrandFocused(false);
    },
    enabled: productFocused,
  });

  const brandSuggestions = useSuggestions({
    type: 'brand',
    query: brand,
    localItems,
    onPick: (suggestion) => {
      onPickBrand(suggestion);
      setBrandFocused(false);
    },
    enabled: brandFocused,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <ProductPhotoChip
          value={imageUrl}
          onChange={onImageChange}
          userId={userId}
        />
        <p className="text-xs text-muted">
          {imageUrl
            ? 'Нажмите на фото, чтобы заменить'
            : 'Добавьте фото продукта (опционально)'}
        </p>
      </div>

      {onCollapse && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onCollapse}
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
            aria-expanded={productFocused && productSuggestions.suggestions.length > 0}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? 'product-name-error' : undefined}
            placeholder="Название продукта"
            value={name}
            error={Boolean(nameError)}
            className="min-w-0 pr-[2.75rem]"
            onFocus={() => setProductFocused(true)}
            onBlur={() => setTimeout(() => setProductFocused(false), 120)}
            onChange={(event) => {
              onNameChange(event.target.value);
              onClearNameError?.();
              if (smartFill.error) smartFill.onClearError();
            }}
            onKeyDown={productSuggestions.handleKeyDown}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2">
            <SmartFillButton
              variant="inline"
              onClick={smartFill.onClick}
              disabled={smartFill.disabled}
              loading={smartFill.loading}
            />
          </div>
        </div>

        {nameError && (
          <FormFieldError id="product-name-error">{nameError}</FormFieldError>
        )}

        {productFocused && (
          <SuggestionDropdown
            suggestions={productSuggestions.suggestions}
            mode="product"
            highlightIndex={productSuggestions.highlightIndex}
            onHighlight={productSuggestions.setHighlightIndex}
            onPick={onPickProduct}
          />
        )}

        {smartFill.error && (
          <p className="mt-2 text-xs text-expired">{smartFill.error}</p>
        )}
        {smartFill.offlineMessage && (
          <p className="mt-2 text-xs text-muted">{smartFill.offlineMessage}</p>
        )}
      </div>

      <div className="relative">
        <FieldLabel>Бренд</FieldLabel>
        <Input
          aria-label="Бренд"
          aria-autocomplete="list"
          aria-expanded={brandFocused && brandSuggestions.suggestions.length > 0}
          placeholder="Бренд"
          value={brand}
          onFocus={() => setBrandFocused(true)}
          onBlur={() => setTimeout(() => setBrandFocused(false), 120)}
          onChange={(event) => {
            onBrandChange(event.target.value);
            if (smartFill.error) smartFill.onClearError();
          }}
          onKeyDown={brandSuggestions.handleKeyDown}
        />
        {brandFocused && (
          <SuggestionDropdown
            suggestions={brandSuggestions.suggestions}
            mode="brand"
            highlightIndex={brandSuggestions.highlightIndex}
            onHighlight={brandSuggestions.setHighlightIndex}
            onPick={onPickBrand}
          />
        )}
      </div>

      <div>
        <FieldLabel>Штрих-код</FieldLabel>
        <div className="relative">
          <Input
            aria-label="Штрих-код"
            placeholder="Штрих-код"
            value={barcode}
            onChange={(event) => {
              onBarcodeChange(event.target.value);
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
            className={`mt-2 text-xs ${lookupError ? 'text-muted' : 'text-accent'}`}
          >
            {isLookupLoading ? 'Ищем продукт по штрих-коду...' : lookupError}
          </p>
        )}
      </div>

      {lookupSourceLabel && showSourceNote && (
        <p className="rounded-[12px] bg-accent/5 px-3 py-2 text-xs text-muted">
          {lookupSourceLabel}
        </p>
      )}
    </div>
  );
}
