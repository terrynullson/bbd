'use client';

import { Camera, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BarcodeScanner } from './BarcodeScanner';
import { PaoSelector } from './PaoSelector';
import { upsertCatalogProduct } from '../api/catalog-product';
import { lookupProductByBarcode } from '../api/lookup-product';
import { fetchProductSuggestions } from '../api/suggest-products';
import { useAddProductForm } from '../hooks/useAddProductForm';
import type { AddProductInput, CosmeticItem, ProductSuggestion } from '../types';

type AddProductModalProps = {
  onClose: () => void;
  onSubmit: (input: AddProductInput) => void;
  item?: CosmeticItem | null;
  localItems?: CosmeticItem[];
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

function SuggestionList({
  suggestions,
  onPick,
}: {
  suggestions: ProductSuggestion[];
  onPick: (suggestion: ProductSuggestion) => void;
}) {
  if (suggestions.length === 0) return null;

  return (
    <div className="-mt-2 flex flex-wrap gap-2">
      {suggestions.map((suggestion) => (
        <button
          key={`${suggestion.source}-${suggestion.id}`}
          type="button"
          onClick={() => onPick(suggestion)}
          className="rounded-full border border-border bg-bg px-3 py-1.5 text-xs text-muted transition-colors hover:border-accent/40 hover:text-accent"
        >
          {suggestion.brand ? `${suggestion.brand} · ${suggestion.name}` : suggestion.name}
        </button>
      ))}
    </div>
  );
}

export function AddProductModal({
  item,
  localItems = [],
  onClose,
  onSubmit,
}: AddProductModalProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [remoteBrandSuggestions, setRemoteBrandSuggestions] = useState<ProductSuggestion[]>([]);
  const [remoteProductSuggestions, setRemoteProductSuggestions] = useState<ProductSuggestion[]>([]);
  const form = useAddProductForm(item ?? undefined);
  const isEditing = Boolean(item);

  const localBrandSuggestions = useMemo(() => {
    const query = normalizeSuggestion(form.brand);
    if (query.length < 2) return [];

    return localItems
      .filter((product) => normalizeSuggestion(product.brand).startsWith(query))
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
        const matchesBrand = !brand || normalizeSuggestion(product.brand).includes(brand);
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
    if (form.brand.trim().length < 2) {
      setRemoteBrandSuggestions([]);
      return;
    }

    const timeout = setTimeout(() => {
      void fetchProductSuggestions({ type: 'brand', query: form.brand }).then(
        setRemoteBrandSuggestions,
      );
    }, 250);

    return () => clearTimeout(timeout);
  }, [form.brand]);

  useEffect(() => {
    if (form.name.trim().length < 2) {
      setRemoteProductSuggestions([]);
      return;
    }

    const timeout = setTimeout(() => {
      void fetchProductSuggestions({
        type: 'product',
        query: form.name,
        brand: form.brand,
      }).then(setRemoteProductSuggestions);
    }, 250);

    return () => clearTimeout(timeout);
  }, [form.brand, form.name]);

  const applyProductSuggestion = (suggestion: ProductSuggestion) => {
    if (suggestion.brand) form.setBrand(suggestion.brand);
    form.setName(suggestion.name);
    if (suggestion.barcode) form.setBarcode(suggestion.barcode);
    if (suggestion.paoMonths) form.setPaoMonths(suggestion.paoMonths);
    if (suggestion.category) form.setCategory(suggestion.category);
    form.setImageUrl(suggestion.imageUrl ?? '');
    form.setLookupSource(suggestion.source === 'catalog' ? 'barcode' : 'manual');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const input = form.buildInput();
    if (!input) return;

    onSubmit(input);
    void upsertCatalogProduct(input);
    if (!isEditing) form.reset();
    onClose();
  };

  const handleBarcodeScan = async (code: string) => {
    form.setBarcode(code);
    setIsScannerOpen(false);
    setLookupError('');
    setIsLookupLoading(true);

    try {
      const result = await lookupProductByBarcode(code);

      if (!result.found) {
        setLookupError('Продукт не найден в базе. Можно заполнить вручную или через ИИ.');
        return;
      }

      if (result.brand) form.setBrand(result.brand);
      if (result.name) form.setName(result.name);
      if (result.paoMonths) form.setPaoMonths(result.paoMonths);
      if (result.category) form.setCategory(result.category);
      form.setLookupSource('open-beauty-facts');
    } catch (error) {
      setLookupError(
        error instanceof Error
          ? error.message
          : 'Не удалось проверить штрих-код',
      );
    } finally {
      setIsLookupLoading(false);
    }
  };

  return (
    <>
      <Modal onClose={onClose}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
          <Input
            aria-label="Бренд"
            placeholder="Бренд"
            value={form.brand}
            onChange={(e) => {
              form.setBrand(e.target.value);
              if (form.smartError) form.setSmartError('');
            }}
          />
          <SuggestionList
            suggestions={brandSuggestions}
            onPick={(suggestion) => form.setBrand(suggestion.name)}
          />

          <Input
            required
            aria-label="Название продукта"
            placeholder="Название продукта"
            value={form.name}
            onChange={(e) => {
              form.setName(e.target.value);
              if (form.smartError) form.setSmartError('');
            }}
          />
          <SuggestionList
            suggestions={productSuggestions}
            onPick={applyProductSuggestion}
          />

          <div className="rounded-[14px] border border-border/70 bg-bg p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-accent shadow-[var(--shadow-card)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight text-text">
                  Умное заполнение
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Исправит опечатки и дополнит поля на основе введённых данных.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="h-10 shrink-0 rounded-full px-4 text-sm shadow-none"
                onClick={form.handleSmartFill}
                disabled={!form.canSmartFill || form.isSmartLoading}
              >
                {form.isSmartLoading ? '...' : 'Заполнить'}
              </Button>
            </div>
            {form.smartError && (
              <p className="mt-2 text-sm text-expired">{form.smartError}</p>
            )}
          </div>

          <div className="flex items-stretch gap-2">
            <Input
              aria-label="Штрих-код"
              placeholder="Штрих-код"
              value={form.barcode}
              onChange={(e) => form.setBarcode(e.target.value)}
              className="min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsScannerOpen(true)}
              aria-label="Сканировать штрих-код"
              disabled={isLookupLoading}
              className="h-12 w-12 shrink-0 rounded-[14px] p-0 shadow-none"
            >
              <Camera className="h-5 w-5" />
            </Button>
          </div>
          {(isLookupLoading || lookupError) && (
            <p
              className={`-mt-2 text-xs ${
                lookupError ? 'text-muted' : 'text-accent'
              }`}
            >
              {isLookupLoading ? 'Ищем продукт по штрих-коду...' : lookupError}
            </p>
          )}

          <Input
            aria-label="Ссылка на фото"
            placeholder="Ссылка на фото (необязательно)"
            value={form.imageUrl}
            onChange={(e) => form.setImageUrl(e.target.value)}
          />

          <div>
            <FieldLabel>Дата вскрытия</FieldLabel>
            <Input
              type="date"
              value={form.openedAt}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => form.setOpenedAt(e.target.value)}
            />
          </div>

          <div>
            <FieldLabel>Срок после вскрытия</FieldLabel>
            <PaoSelector value={form.paoMonths} onChange={form.setPaoMonths} />
          </div>

          <Button type="submit" size="lg" className="mt-1 h-12 w-full rounded-[14px]">
            {isEditing ? 'Сохранить изменения' : 'Сохранить'}
          </Button>
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
