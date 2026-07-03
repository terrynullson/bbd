'use client';

import { Camera } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BarcodeScanner } from './BarcodeScanner';
import { PaoSelector } from './PaoSelector';
import { ProductPhotoPicker } from './ProductPhotoPicker';
import { SmartFillButton } from './SmartFillButton';
import {
  SuggestionDropdown,
  useSuggestionKeyboard,
} from './SuggestionDropdown';
import { upsertCatalogProduct } from '../api/catalog-product';
import { analyzeProduct } from '../api/analyze-product';
import { lookupProductByBarcode } from '../api/lookup-product';
import { fetchProductSuggestions } from '../api/suggest-products';
import { useAddProductForm } from '../hooks/useAddProductForm';
import { useAuth } from '@/lib/supabase/use-auth';
import type {
  AddProductInput,
  AnalyzeProductResponse,
  CosmeticItem,
  ProductSuggestion,
} from '../types';

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

export function AddProductModal({
  item,
  localItems = [],
  onClose,
  onSubmit,
}: AddProductModalProps) {
  const { user } = useAuth();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [remoteBrandSuggestions, setRemoteBrandSuggestions] = useState<ProductSuggestion[]>([]);
  const [remoteProductSuggestions, setRemoteProductSuggestions] = useState<ProductSuggestion[]>([]);
  const [brandHighlight, setBrandHighlight] = useState(-1);
  const [productHighlight, setProductHighlight] = useState(-1);
  const [brandFocused, setBrandFocused] = useState(false);
  const [productFocused, setProductFocused] = useState(false);
  const [barcodeAiSuggestion, setBarcodeAiSuggestion] =
    useState<AnalyzeProductResponse | null>(null);
  const [isBarcodeAiLoading, setIsBarcodeAiLoading] = useState(false);
  const form = useAddProductForm(item ?? undefined);
  const isEditing = Boolean(item);

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
    setBrandHighlight(brandSuggestions.length > 0 ? 0 : -1);
  }, [brandSuggestions]);

  useEffect(() => {
    setProductHighlight(productSuggestions.length > 0 ? 0 : -1);
  }, [productSuggestions]);

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

  const applyLookupResult = (result: {
    brand?: string;
    name?: string;
    paoMonths?: number;
    category?: AddProductInput['category'];
    imageUrl?: string;
    source?: 'open-beauty-facts' | 'catalog';
  }) => {
    if (result.brand) form.setBrand(result.brand);
    if (result.name) form.setName(result.name);
    if (result.paoMonths) form.setPaoMonths(result.paoMonths);
    if (result.category) form.setCategory(result.category);
    if (result.imageUrl) form.setImageUrl(result.imageUrl);
    form.setLookupSource(result.source ?? 'barcode');
  };

  const requestBarcodeAiSuggestion = async (code: string) => {
    setIsBarcodeAiLoading(true);
    setBarcodeAiSuggestion(null);
    setLookupError('');

    try {
      const suggestion = await analyzeProduct({ barcode: code });
      setBarcodeAiSuggestion(suggestion);
    } catch (error) {
      setLookupError(
        error instanceof Error
          ? error.message
          : 'Не удалось угадать продукт по штрих-коду',
      );
    } finally {
      setIsBarcodeAiLoading(false);
    }
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
    setBarcodeAiSuggestion(null);
    setIsLookupLoading(true);

    try {
      const result = await lookupProductByBarcode(code);

      if (result.found) {
        applyLookupResult(result);
        return;
      }

      await requestBarcodeAiSuggestion(code);
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

  const applyBarcodeAiSuggestion = () => {
    if (!barcodeAiSuggestion) return;

    form.setBrand(barcodeAiSuggestion.brand);
    form.setName(barcodeAiSuggestion.name);
    form.setPaoMonths(barcodeAiSuggestion.paoMonths);
    if (barcodeAiSuggestion.category) {
      form.setCategory(barcodeAiSuggestion.category);
    }
    form.setLookupSource('ai-barcode');
    setBarcodeAiSuggestion(null);
    setLookupError('');
  };

  return (
    <>
      <Modal onClose={onClose}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-1">
          <div className="relative">
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

          <div className="relative">
            <div className="flex items-stretch gap-2">
              <Input
                required
                aria-label="Название продукта"
                aria-autocomplete="list"
                aria-expanded={productFocused && productSuggestions.length > 0}
                placeholder="Название продукта"
                value={form.name}
                className="min-w-0 flex-1"
                onFocus={() => setProductFocused(true)}
                onBlur={() => setTimeout(() => setProductFocused(false), 120)}
                onChange={(e) => {
                  form.setName(e.target.value);
                  if (form.smartError) form.setSmartError('');
                }}
                onKeyDown={handleProductKeyDown}
              />
              <SmartFillButton
                onClick={form.handleSmartFill}
                disabled={!form.canSmartFill}
                loading={form.isSmartLoading}
              />
            </div>
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
          </div>

          <div className="flex items-stretch gap-2">
            <Input
              aria-label="Штрих-код"
              placeholder="Штрих-код"
              value={form.barcode}
              onChange={(e) => {
                form.setBarcode(e.target.value);
                setBarcodeAiSuggestion(null);
                setLookupError('');
              }}
              className="min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsScannerOpen(true)}
              aria-label="Сканировать штрих-код"
              disabled={isLookupLoading || isBarcodeAiLoading}
              className="h-12 w-12 shrink-0 rounded-[14px] p-0 shadow-none"
            >
              <Camera className="h-5 w-5" />
            </Button>
          </div>
          {(isLookupLoading || isBarcodeAiLoading || lookupError) && (
            <p
              className={`-mt-2 text-xs ${
                lookupError ? 'text-muted' : 'text-accent'
              }`}
            >
              {isLookupLoading
                ? 'Ищем продукт по штрих-коду...'
                : isBarcodeAiLoading
                  ? 'Пробуем угадать продукт через ИИ...'
                  : lookupError}
            </p>
          )}

          {barcodeAiSuggestion && (
            <div className="rounded-[14px] border border-accent/25 bg-accent/5 p-4">
              <p className="text-sm text-muted">Возможно, это:</p>
              <p className="mt-1 text-base font-semibold text-text">
                {barcodeAiSuggestion.brand} · {barcodeAiSuggestion.name}
              </p>
              <p className="mt-1 text-xs text-muted">
                Срок после вскрытия: {barcodeAiSuggestion.paoMonths} мес.
              </p>
              <div className="mt-3 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  onClick={applyBarcodeAiSuggestion}
                >
                  Да, заполнить
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="rounded-full shadow-none"
                  onClick={() => setBarcodeAiSuggestion(null)}
                >
                  Нет, вручную
                </Button>
              </div>
            </div>
          )}

          <div>
            <FieldLabel>Фото</FieldLabel>
            <ProductPhotoPicker
              value={form.imageUrl}
              onChange={form.setImageUrl}
              userId={user?.id}
            />
          </div>

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
