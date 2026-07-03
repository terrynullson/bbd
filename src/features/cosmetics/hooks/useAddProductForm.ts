'use client';

import { useCallback, useEffect, useState } from 'react';
import { analyzeProduct } from '../api/analyze-product';
import { assessBarcodeTrust } from '../lib/barcode';
import { inferCategoryFromText } from '../lib/categories';
import { isUnknownBrand } from '../lib/analyze-context';
import { getDefaultPaoMonths, inferTaxonomy } from '../lib/taxonomy';
import type {
  AddProductInput,
  LookupProductResponse,
  PaoSource,
  ProductCategory,
} from '../types';

const DEFAULT_FORM = {
  name: '',
  brand: '',
  barcode: '',
  paoMonths: 12,
  openedAt: new Date().toISOString().slice(0, 10),
  expiresAt: '',
  category: 'other' as ProductCategory,
  imageUrl: '',
  notes: '',
  lookupSource: 'manual' as AddProductInput['lookupSource'],
  paoSource: undefined as PaoSource | undefined,
  barcodeSource: undefined as AddProductInput['barcodeSource'],
  isSealed: true,
};

function toDateInputValue(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

export function useAddProductForm(initialValues?: Partial<AddProductInput>) {
  const [name, setName] = useState(DEFAULT_FORM.name);
  const [brand, setBrand] = useState(DEFAULT_FORM.brand);
  const [barcode, setBarcodeState] = useState(DEFAULT_FORM.barcode);
  const [barcodeSource, setBarcodeSource] = useState(DEFAULT_FORM.barcodeSource);
  const [barcodeLookup, setBarcodeLookup] = useState<LookupProductResponse>();
  const [paoMonths, setPaoMonthsState] = useState(DEFAULT_FORM.paoMonths);
  const [paoSource, setPaoSource] = useState<PaoSource | undefined>(
    DEFAULT_FORM.paoSource,
  );
  const [openedAt, setOpenedAt] = useState(DEFAULT_FORM.openedAt);
  const [expiresAt, setExpiresAt] = useState(DEFAULT_FORM.expiresAt);
  const [category, setCategory] = useState<ProductCategory>(DEFAULT_FORM.category);
  const [imageUrl, setImageUrl] = useState(DEFAULT_FORM.imageUrl);
  const [notes, setNotes] = useState(DEFAULT_FORM.notes);
  const [lookupSource, setLookupSource] = useState(DEFAULT_FORM.lookupSource);
  const [isSealed, setIsSealed] = useState(DEFAULT_FORM.isSealed);
  const [isSmartLoading, setIsSmartLoading] = useState(false);
  const [smartError, setSmartError] = useState('');
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

  const applyValues = useCallback((values?: Partial<AddProductInput>) => {
    setName(values?.name ?? DEFAULT_FORM.name);
    setBrand(values?.brand ?? DEFAULT_FORM.brand);
    setBarcodeState(values?.barcode ?? DEFAULT_FORM.barcode);
    setBarcodeSource(values?.barcodeSource ?? DEFAULT_FORM.barcodeSource);
    setBarcodeLookup(undefined);
    setPaoMonthsState(values?.paoMonths ?? DEFAULT_FORM.paoMonths);
    setPaoSource(
      values?.paoSource ??
        (values?.paoMonths === undefined ? DEFAULT_FORM.paoSource : 'user'),
    );
    setOpenedAt(toDateInputValue(values?.openedAt));
    setExpiresAt(values?.expiresAt ? toDateInputValue(values.expiresAt) : '');
    setCategory(values?.category ?? DEFAULT_FORM.category);
    setImageUrl(values?.imageUrl ?? DEFAULT_FORM.imageUrl);
    setNotes(values?.notes ?? DEFAULT_FORM.notes);
    setLookupSource(values?.lookupSource ?? DEFAULT_FORM.lookupSource);
    setIsSealed(values?.isSealed ?? DEFAULT_FORM.isSealed);
    setSmartError('');
  }, []);

  useEffect(() => {
    applyValues(initialValues);
  }, [applyValues, initialValues]);

  const reset = useCallback(() => {
    applyValues();
  }, [applyValues]);

  const setBarcode = useCallback(
    (
      value: string,
      source: AddProductInput['barcodeSource'] = 'manual',
      lookup?: LookupProductResponse,
    ) => {
      setBarcodeState(value);
      setBarcodeSource(value.trim() ? source : undefined);
      setBarcodeLookup(lookup);
    },
    [],
  );

  const setPaoMonths = useCallback((value: number, source: PaoSource = 'user') => {
    setPaoMonthsState(value);
    setPaoSource(source);
  }, []);

  useEffect(() => {
    if (paoSource && paoSource !== 'preset') return;

    const inferredCategory = category === 'other'
      ? inferCategoryFromText(`${brand} ${name}`)
      : category;
    const taxonomy = inferTaxonomy(inferredCategory, `${brand} ${name}`);
    const defaultPaoMonths = getDefaultPaoMonths(taxonomy.subtype);

    setPaoMonthsState((current) =>
      current === defaultPaoMonths ? current : defaultPaoMonths,
    );
    setPaoSource('preset');
  }, [brand, category, name, paoSource]);

  const buildInput = useCallback((): AddProductInput | null => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;
    const trimmedBarcode = barcode.trim();
    const effectiveCategory =
      category === 'other'
        ? inferCategoryFromText(`${brand} ${trimmedName}`)
        : category;
    const taxonomy = inferTaxonomy(effectiveCategory, `${brand} ${trimmedName}`);
    const effectiveBarcodeSource = trimmedBarcode
      ? (barcodeSource ?? 'manual')
      : undefined;

    return {
      name: trimmedName,
      brand: brand.trim() || 'Неизвестный бренд',
      barcode: trimmedBarcode || undefined,
      barcodeSource: effectiveBarcodeSource,
      barcodeTrust: trimmedBarcode && effectiveBarcodeSource
        ? assessBarcodeTrust({
            barcode: trimmedBarcode,
            source: effectiveBarcodeSource,
            lookup: barcodeLookup,
            savedName: trimmedName,
          })
        : undefined,
      paoMonths,
      paoSource,
      openedAt: new Date(openedAt).toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      expirySource: expiresAt ? 'user' : undefined,
      isSealed,
      category: effectiveCategory,
      productGroup: taxonomy.group,
      productSubtype: taxonomy.subtype,
      imageUrl: imageUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      lookupSource,
    };
  }, [
    name,
    brand,
    barcode,
    barcodeSource,
    barcodeLookup,
    paoMonths,
    paoSource,
    openedAt,
    expiresAt,
    isSealed,
    category,
    imageUrl,
    notes,
    lookupSource,
  ]);

  const handleSmartFill = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedBrand = brand.trim();

    if (!trimmedName && !trimmedBrand) {
      setSmartError('Введите бренд или название для анализа');
      return;
    }

    if (!isOnline) {
      setSmartError('Нужен интернет для подбора');
      return;
    }

    setIsSmartLoading(true);
    setSmartError('');

    try {
      const result = await analyzeProduct({
        brand: trimmedBrand || undefined,
        name: trimmedName || undefined,
        barcode: barcode.trim() || undefined,
      });

      if (!trimmedBrand || isUnknownBrand(trimmedBrand)) {
        setBrand(result.brand);
      }

      setName(result.name);

      if (paoSource !== 'user') {
        setPaoMonths(result.paoMonths, 'ai_estimate');
      }

      setCategory(
        result.category ??
          inferCategoryFromText(`${result.brand} ${result.name}`),
      );
      setLookupSource(barcode.trim() ? 'ai-barcode' : 'ai');
    } catch (error) {
      setSmartError(
        error instanceof Error ? error.message : 'Не удалось обработать запрос',
      );
    } finally {
      setIsSmartLoading(false);
    }
  }, [name, brand, barcode, isOnline, paoSource, setPaoMonths]);

  return {
    name,
    setName,
    brand,
    setBrand,
    barcode,
    setBarcode,
    paoMonths,
    setPaoMonths,
    paoSource,
    setPaoSource,
    openedAt,
    setOpenedAt,
    expiresAt,
    setExpiresAt,
    category,
    setCategory,
    imageUrl,
    setImageUrl,
    notes,
    setNotes,
    lookupSource,
    setLookupSource,
    isSealed,
    setIsSealed,
    isSmartLoading,
    smartError,
    setSmartError,
    reset,
    buildInput,
    handleSmartFill,
    canSmartFill:
      isOnline && Boolean(name.trim() || brand.trim() || barcode.trim()),
    smartFillOfflineMessage: !isOnline ? 'Нужен интернет для подбора' : '',
  };
}
