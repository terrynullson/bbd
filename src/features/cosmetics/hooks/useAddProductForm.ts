'use client';

import { useCallback, useState } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { analyzeProduct } from '../api/analyze-product';
import { assessBarcodeTrust } from '../lib/barcode';
import { inferCategoryFromText } from '../lib/categories';
import { toDateInputValue, todayIso } from '../lib/date-input';
import { isUnknownBrand } from '../lib/analyze-context';
import { getDefaultPaoMonths, inferTaxonomy } from '../lib/taxonomy';
import type {
  AddProductInput,
  LookupProductResponse,
  PaoSource,
  ProductCategory,
} from '../types';

const UNKNOWN_BRAND = 'Неизвестный бренд';

/** Выбранный вручную (или подсказанный) PAO. `null` — берём пресет по категории. */
type PickedPao = { months: number; source: PaoSource } | null;

function initialPao(values?: Partial<AddProductInput>): PickedPao {
  if (values?.paoMonths === undefined) return null;
  return { months: values.paoMonths, source: values.paoSource ?? 'user' };
}

/**
 * Состояние формы добавления/редактирования.
 *
 * Компонент, использующий хук, должен пересоздаваться при смене товара
 * (`key` на месте вызова) — форма не синхронизируется с пропсами эффектом.
 */
export function useAddProductForm(initialValues?: Partial<AddProductInput>) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [brand, setBrand] = useState(initialValues?.brand ?? '');
  const [barcode, setBarcodeState] = useState(initialValues?.barcode ?? '');
  const [barcodeSource, setBarcodeSource] = useState(
    initialValues?.barcodeSource,
  );
  const [barcodeLookup, setBarcodeLookup] = useState<LookupProductResponse>();
  const [picked, setPicked] = useState<PickedPao>(() => initialPao(initialValues));
  const [openedAt, setOpenedAt] = useState(() =>
    toDateInputValue(initialValues?.openedAt),
  );
  const [expiresAt, setExpiresAt] = useState(() =>
    initialValues?.expiresAt ? toDateInputValue(initialValues.expiresAt) : '',
  );
  const [category, setCategory] = useState<ProductCategory>(
    initialValues?.category ?? 'other',
  );
  const [imageUrl, setImageUrl] = useState(initialValues?.imageUrl ?? '');
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [lookupSource, setLookupSource] = useState<
    AddProductInput['lookupSource']
  >(initialValues?.lookupSource ?? 'manual');
  const [isSealed, setIsSealed] = useState(initialValues?.isSealed ?? true);
  const [isSmartLoading, setIsSmartLoading] = useState(false);
  const [smartError, setSmartError] = useState('');
  const isOnline = useOnlineStatus();

  // Категория «other» — повод угадать её по тексту, а не хранить угадку в state.
  const effectiveCategory =
    category === 'other' ? inferCategoryFromText(`${brand} ${name}`) : category;
  const taxonomy = inferTaxonomy(effectiveCategory, `${brand} ${name}`);
  const presetPaoMonths = getDefaultPaoMonths(taxonomy.subtype, effectiveCategory);

  const isPresetPao = picked === null || picked.source === 'preset';
  const paoMonths = isPresetPao ? presetPaoMonths : picked.months;
  const paoSource: PaoSource = isPresetPao ? 'preset' : picked.source;

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

  const setPaoMonths = useCallback(
    (value: number, source: PaoSource = 'user') => {
      setPicked({ months: value, source });
    },
    [],
  );

  const reset = useCallback(() => {
    setName('');
    setBrand('');
    setBarcodeState('');
    setBarcodeSource(undefined);
    setBarcodeLookup(undefined);
    setPicked(null);
    setOpenedAt(todayIso());
    setExpiresAt('');
    setCategory('other');
    setImageUrl('');
    setNotes('');
    setLookupSource('manual');
    setIsSealed(true);
    setSmartError('');
  }, []);

  const buildInput = useCallback((): AddProductInput | null => {
    const trimmedName = name.trim();
    if (!trimmedName) return null;

    const trimmedBarcode = barcode.trim();
    const effectiveBarcodeSource = trimmedBarcode
      ? (barcodeSource ?? 'manual')
      : undefined;

    return {
      name: trimmedName,
      brand: brand.trim() || UNKNOWN_BRAND,
      barcode: trimmedBarcode || undefined,
      barcodeSource: effectiveBarcodeSource,
      barcodeTrust:
        trimmedBarcode && effectiveBarcodeSource
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
    effectiveCategory,
    taxonomy,
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

export type AddProductFormState = ReturnType<typeof useAddProductForm>;
