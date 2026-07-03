'use client';

import { useCallback, useEffect, useState } from 'react';
import { analyzeProduct } from '../api/analyze-product';
import { inferCategoryFromText } from '../lib/categories';
import { isUnknownBrand } from '../lib/analyze-context';
import type { AddProductInput, ProductCategory } from '../types';

const DEFAULT_FORM = {
  name: '',
  brand: '',
  barcode: '',
  paoMonths: 12,
  openedAt: new Date().toISOString().slice(0, 10),
  category: 'other' as ProductCategory,
  imageUrl: '',
  notes: '',
  lookupSource: 'manual' as AddProductInput['lookupSource'],
};

function toDateInputValue(value?: string) {
  if (!value) return new Date().toISOString().slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

export function useAddProductForm(initialValues?: Partial<AddProductInput>) {
  const [name, setName] = useState(DEFAULT_FORM.name);
  const [brand, setBrand] = useState(DEFAULT_FORM.brand);
  const [barcode, setBarcode] = useState(DEFAULT_FORM.barcode);
  const [paoMonths, setPaoMonths] = useState(DEFAULT_FORM.paoMonths);
  const [openedAt, setOpenedAt] = useState(DEFAULT_FORM.openedAt);
  const [category, setCategory] = useState<ProductCategory>(DEFAULT_FORM.category);
  const [imageUrl, setImageUrl] = useState(DEFAULT_FORM.imageUrl);
  const [notes, setNotes] = useState(DEFAULT_FORM.notes);
  const [lookupSource, setLookupSource] = useState(DEFAULT_FORM.lookupSource);
  const [isSmartLoading, setIsSmartLoading] = useState(false);
  const [smartError, setSmartError] = useState('');

  const applyValues = useCallback((values?: Partial<AddProductInput>) => {
    setName(values?.name ?? DEFAULT_FORM.name);
    setBrand(values?.brand ?? DEFAULT_FORM.brand);
    setBarcode(values?.barcode ?? DEFAULT_FORM.barcode);
    setPaoMonths(values?.paoMonths ?? DEFAULT_FORM.paoMonths);
    setOpenedAt(toDateInputValue(values?.openedAt));
    setCategory(values?.category ?? DEFAULT_FORM.category);
    setImageUrl(values?.imageUrl ?? DEFAULT_FORM.imageUrl);
    setNotes(values?.notes ?? DEFAULT_FORM.notes);
    setLookupSource(values?.lookupSource ?? DEFAULT_FORM.lookupSource);
    setSmartError('');
  }, []);

  useEffect(() => {
    applyValues(initialValues);
  }, [applyValues, initialValues]);

  const reset = useCallback(() => {
    applyValues();
  }, [applyValues]);

  const buildInput = useCallback((): AddProductInput | null => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    return {
      name: trimmedName,
      brand: brand.trim() || 'Неизвестный бренд',
      barcode: barcode.trim() || undefined,
      paoMonths,
      openedAt: new Date(openedAt).toISOString(),
      category,
      imageUrl: imageUrl.trim() || undefined,
      notes: notes.trim() || undefined,
      lookupSource,
    };
  }, [name, brand, barcode, paoMonths, openedAt, category, imageUrl, notes, lookupSource]);

  const handleSmartFill = useCallback(async () => {
    const trimmedName = name.trim();
    const trimmedBrand = brand.trim();

    if (!trimmedName && !trimmedBrand) {
      setSmartError('Введите бренд или название для анализа');
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

      if (paoMonths === DEFAULT_FORM.paoMonths) {
        setPaoMonths(result.paoMonths);
      }

      setCategory(
        result.category ??
          inferCategoryFromText(`${result.brand} ${result.name}`),
      );
      setLookupSource('ai');
    } catch (error) {
      setSmartError(
        error instanceof Error ? error.message : 'Не удалось обработать запрос',
      );
    } finally {
      setIsSmartLoading(false);
    }
  }, [name, brand, barcode, paoMonths]);

  return {
    name,
    setName,
    brand,
    setBrand,
    barcode,
    setBarcode,
    paoMonths,
    setPaoMonths,
    openedAt,
    setOpenedAt,
    category,
    setCategory,
    imageUrl,
    setImageUrl,
    notes,
    setNotes,
    lookupSource,
    setLookupSource,
    isSmartLoading,
    smartError,
    setSmartError,
    reset,
    buildInput,
    handleSmartFill,
    canSmartFill: Boolean(name.trim() || brand.trim() || barcode.trim()),
  };
}
