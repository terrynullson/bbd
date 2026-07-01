'use client';

import { useCallback, useState } from 'react';
import { analyzeProduct } from '../api/analyze-product';
import { inferCategoryFromText } from '../lib/categories';
import type { AddProductInput, ProductCategory } from '../types';

const DEFAULT_FORM = {
  name: '',
  brand: '',
  barcode: '',
  paoMonths: 12,
  openedAt: new Date().toISOString().slice(0, 10),
  category: 'other' as ProductCategory,
};

export function useAddProductForm() {
  const [name, setName] = useState(DEFAULT_FORM.name);
  const [brand, setBrand] = useState(DEFAULT_FORM.brand);
  const [barcode, setBarcode] = useState(DEFAULT_FORM.barcode);
  const [paoMonths, setPaoMonths] = useState(DEFAULT_FORM.paoMonths);
  const [openedAt, setOpenedAt] = useState(DEFAULT_FORM.openedAt);
  const [category, setCategory] = useState<ProductCategory>(DEFAULT_FORM.category);
  const [isSmartLoading, setIsSmartLoading] = useState(false);
  const [smartError, setSmartError] = useState('');

  const reset = useCallback(() => {
    setName(DEFAULT_FORM.name);
    setBrand(DEFAULT_FORM.brand);
    setBarcode(DEFAULT_FORM.barcode);
    setPaoMonths(DEFAULT_FORM.paoMonths);
    setOpenedAt(new Date().toISOString().slice(0, 10));
    setCategory(DEFAULT_FORM.category);
    setSmartError('');
  }, []);

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
    };
  }, [name, brand, barcode, paoMonths, openedAt, category]);

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
        query: [trimmedBrand, trimmedName].filter(Boolean).join(' '),
        barcode: barcode.trim() || undefined,
      });

      if (result.brand) setBrand(result.brand);
      if (result.name) setName(result.name);
      if (result.paoMonths) setPaoMonths(result.paoMonths);
      if (result.category) {
        setCategory(result.category);
      } else {
        setCategory(inferCategoryFromText(`${result.brand} ${result.name}`));
      }
    } catch (error) {
      setSmartError(
        error instanceof Error ? error.message : 'Не удалось обработать запрос',
      );
    } finally {
      setIsSmartLoading(false);
    }
  }, [name, brand, barcode]);

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
    isSmartLoading,
    smartError,
    setSmartError,
    reset,
    buildInput,
    handleSmartFill,
    canSmartFill: Boolean(name.trim() || brand.trim()),
  };
}
