'use client';

import { useState } from 'react';
import { BarcodeScanner } from './BarcodeScanner';
import { ghostButtonClass, primaryButtonClass } from './AddFormControls';
import { assessBarcodeTrust } from '../lib/barcode';
import { getCategoryTitle, inferCategoryFromText } from '../lib/categories';
import { todayIso } from '../lib/date-input';
import { plural } from '../lib/plural';
import { getDefaultPaoMonths, inferTaxonomy } from '../lib/taxonomy';
import { useBarcodeLookup } from '../hooks/useBarcodeLookup';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import type { AddProductInput, LookupProductResponse } from '../types';

const UNKNOWN_BRAND = 'Неизвестный бренд';

type AddScanTabProps = {
  onSubmit: (input: AddProductInput) => void;
  onOpenFullForm: (draft: Partial<AddProductInput>) => void;
};

type Scanned = { barcode: string; lookup: LookupProductResponse };

function monthsText(months: number) {
  return `${months} ${plural(months, ['месяц', 'месяца', 'месяцев'])}`;
}

function presetPao(category: AddProductInput['category'], text: string) {
  return getDefaultPaoMonths(inferTaxonomy(category, text).subtype, category);
}

export function AddScanTab({ onSubmit, onOpenFullForm }: AddScanTabProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanned, setScanned] = useState<Scanned | null>(null);
  const [notFound, setNotFound] = useState(false);

  const lookup = useBarcodeLookup({
    onFound: (barcode, result) => {
      setNotFound(false);
      setScanned({ barcode, lookup: result });
    },
    onNotFound: () => {
      setScanned(null);
      setNotFound(true);
    },
  });

  const handleScan = (code: string) => {
    setIsScannerOpen(false);
    haptic('success');
    void lookup.lookup(code);
  };

  const found = scanned?.lookup.name ? scanned : null;

  const hint = found
    ? 'Средство найдено'
    : notFound
      ? 'Штрих-код не найден в каталоге'
      : 'Наведите камеру на штрих-код на упаковке';

  const buildInput = (): AddProductInput | null => {
    const productName = found?.lookup.name;
    if (!found || !productName) return null;

    const brand = found.lookup.brand ?? UNKNOWN_BRAND;
    const category =
      found.lookup.category ?? inferCategoryFromText(`${brand} ${productName}`);
    const taxonomy = inferTaxonomy(category, `${brand} ${productName}`);

    return {
      name: productName,
      brand,
      barcode: found.barcode,
      barcodeSource: 'scan',
      barcodeTrust: assessBarcodeTrust({
        barcode: found.barcode,
        source: 'scan',
        lookup: found.lookup,
        savedName: productName,
      }),
      paoMonths:
        found.lookup.paoMonths ?? presetPao(category, `${brand} ${productName}`),
      openedAt: new Date(todayIso()).toISOString(),
      isSealed: false,
      category,
      productGroup: taxonomy.group,
      productSubtype: taxonomy.subtype,
      imageUrl: found.lookup.imageUrl,
      paoSource: found.lookup.paoMonths ? 'catalog' : 'preset',
      lookupSource:
        found.lookup.source === 'catalog' ? 'catalog' : 'open-beauty-facts',
    };
  };

  const addScanned = () => {
    const input = buildInput();
    if (!input) return;
    haptic('medium');
    onSubmit(input);
  };

  const refine = () => {
    const input = buildInput();
    if (!input) return;
    haptic('light');
    onOpenFullForm(input);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative flex h-[260px] items-center justify-center overflow-hidden rounded-[24px] bg-[#26221d]">
        <span className="absolute left-5 top-5 h-[26px] w-[26px] rounded-tl-md border-l-2 border-t-2 border-accent" />
        <span className="absolute right-5 top-5 h-[26px] w-[26px] rounded-tr-md border-r-2 border-t-2 border-accent" />
        <span className="absolute bottom-5 left-5 h-[26px] w-[26px] rounded-bl-md border-b-2 border-l-2 border-accent" />
        <span className="absolute bottom-5 right-5 h-[26px] w-[26px] rounded-br-md border-b-2 border-r-2 border-accent" />

        {!found && !notFound && (
          <div className="scanline absolute left-8 right-8 top-6 h-0.5 bg-gradient-to-r from-transparent via-accent to-transparent" />
        )}

        <p className="px-10 text-center text-[13px] text-muted">
          {lookup.isLoading ? 'Ищем продукт по штрих-коду…' : hint}
        </p>
      </div>

      {found?.lookup.name && (
        <div className="card-enter rounded-card border border-border bg-surface px-5 py-[18px]">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--quiet-gold-deep)]">
            {found.barcode}
          </p>
          <p className="mb-0.5 mt-1.5 text-base font-semibold text-text">
            {found.lookup.name}
          </p>
          <p className="text-[13px] text-muted">
            {getCategoryTitle(found.lookup.category)} · срок после вскрытия{' '}
            {monthsText(
              found.lookup.paoMonths ??
                presetPao(found.lookup.category ?? 'other', found.lookup.name),
            )}
          </p>

          <button
            type="button"
            onClick={addScanned}
            className={cn(primaryButtonClass, 'mt-3.5 min-h-[50px]')}
          >
            Добавить на полку
          </button>
          <button
            type="button"
            onClick={refine}
            className={cn(ghostButtonClass, 'mt-2')}
          >
            Уточнить дату и срок
          </button>
        </div>
      )}

      {notFound && (
        <button
          type="button"
          onClick={() => onOpenFullForm({ isSealed: false, lookupSource: 'manual' })}
          className={primaryButtonClass}
        >
          Заполнить вручную
        </button>
      )}

      {!found && (
        <button
          type="button"
          onClick={() => {
            haptic('light');
            setNotFound(false);
            setIsScannerOpen(true);
          }}
          disabled={lookup.isLoading}
          className={primaryButtonClass}
        >
          Начать сканирование
        </button>
      )}

      {isScannerOpen && (
        <BarcodeScanner
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleScan}
        />
      )}
    </div>
  );
}
