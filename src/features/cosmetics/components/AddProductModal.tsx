'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BarcodeScanner } from './BarcodeScanner';
import { PaoSelector } from './PaoSelector';
import { PackagingToggle } from './PackagingToggle';
import {
  getLookupSourceLabel,
  ProductSummaryCard,
} from './ProductSummaryCard';
import { upsertCatalogProduct } from '../api/catalog-product';
import { lookupProductByBarcode } from '../api/lookup-product';
import { useAddProductForm } from '../hooks/useAddProductForm';
import { useAuth } from '@/lib/supabase/use-auth';
import { haptic } from '@/lib/haptics';
import type { AddProductInput, CosmeticItem, PaoSource } from '../types';

type AddProductModalProps = {
  onClose: () => void;
  onSubmit: (input: AddProductInput) => void;
  onQuickAdd?: (draft: Partial<AddProductInput>) => void;
  item?: CosmeticItem | null;
  initialValues?: Partial<AddProductInput>;
  localItems?: CosmeticItem[];
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
    </label>
  );
}

function getDatesHint(isSealed: boolean, paoSource?: PaoSource) {
  if (isSealed) {
    return 'Для неоткрытого запаса укажите дату EXP с упаковки.';
  }

  if (paoSource === 'preset') {
    return 'Укажите PAO и дату вскрытия с упаковки. EXP — опционально. Типичный PAO подобран по категории.';
  }

  if (paoSource === 'ai_estimate') {
    return 'Укажите PAO и дату вскрытия с упаковки. EXP — опционально. PAO от ИИ — проверьте на упаковке.';
  }

  return 'Укажите PAO и дату вскрытия с упаковки. EXP — опционально.';
}

export function AddProductModal({
  item,
  initialValues,
  localItems = [],
  onClose,
  onSubmit,
  onQuickAdd,
}: AddProductModalProps) {
  const { user } = useAuth();
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isLookupLoading, setIsLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState('');
  const [nameError, setNameError] = useState('');
  const form = useAddProductForm(item ?? initialValues);
  const isEditing = Boolean(item);
  const lookupSourceLabel = getLookupSourceLabel(form.lookupSource);

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
    if (result.paoMonths) form.setPaoMonths(result.paoMonths, 'catalog');
    if (result.category) form.setCategory(result.category);
    if (result.imageUrl) form.setImageUrl(result.imageUrl);
    form.setLookupSource(result.source ?? 'barcode');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!form.name.trim()) {
      setNameError('Укажите название продукта');
      haptic('error');
      return;
    }

    setNameError('');
    const input = form.buildInput();
    if (!input) return;

    onSubmit(input);
    void upsertCatalogProduct(input);
    if (!isEditing) form.reset();
    onClose();
  };

  const handleBarcodeScan = async (code: string) => {
    form.setBarcode(code, 'scan');
    setIsScannerOpen(false);
    setLookupError('');
    setIsLookupLoading(true);

    try {
      const result = await lookupProductByBarcode(code);

      if (result.found && result.name) {
        form.setBarcode(code, 'scan', result);
        applyLookupResult(result);
        return;
      }

      setLookupError(
        'Штрих-код не найден. Заполните остальные поля вручную.',
      );
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

  const handleBackToSearch = () => {
    if (!onQuickAdd) return;

    onQuickAdd({
      name: form.name.trim() || undefined,
      brand: form.brand.trim() || undefined,
      barcode: form.barcode.trim() || undefined,
      isSealed: form.isSealed,
      expiresAt: form.expiresAt
        ? new Date(form.expiresAt).toISOString()
        : undefined,
      openedAt: form.openedAt
        ? new Date(form.openedAt).toISOString()
        : undefined,
      paoMonths: form.paoMonths,
      category: form.category,
      imageUrl: form.imageUrl.trim() || undefined,
      lookupSource: form.lookupSource,
    });
  };

  const paoHint = getDatesHint(form.isSealed, form.paoSource);

  return (
    <>
      <Modal
        title={isEditing ? 'Редактирование' : 'Новый продукт'}
        headerExtra={
          !isEditing && onQuickAdd ? (
            <button
              type="button"
              onClick={handleBackToSearch}
              className="mt-1 text-left text-sm text-muted underline-offset-2 transition-colors hover:text-text hover:underline"
            >
              Назад
            </button>
          ) : undefined
        }
        onClose={onClose}
      >
        <form onSubmit={handleSubmit} noValidate className="flex flex-col">
          <div className="flex flex-col gap-4 pb-4">
            <ProductSummaryCard
              form={form}
              localItems={localItems}
              isEditing={isEditing}
              initialValues={initialValues}
              lookupSourceLabel={lookupSourceLabel}
              onOpenScanner={() => setIsScannerOpen(true)}
              isLookupLoading={isLookupLoading}
              lookupError={lookupError}
              onLookupErrorClear={() => setLookupError('')}
              userId={user?.id}
              nameError={nameError}
              onClearNameError={() => setNameError('')}
            />

            <section className="rounded-[14px] border border-border/60 bg-bg/30 p-3">
              <PackagingToggle
                isOpen={!form.isSealed}
                onChange={(isOpen) => {
                  form.setIsSealed(!isOpen);
                  if (isOpen) {
                    form.setOpenedAt(new Date().toISOString().slice(0, 10));
                  }
                }}
              />

              {!form.isSealed ? (
                <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
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
                    <FieldLabel>Срок после вскрытия (PAO)</FieldLabel>
                    <PaoSelector
                      value={form.paoMonths}
                      onChange={form.setPaoMonths}
                    />
                  </div>

                  <div>
                    <FieldLabel>Годен до (опционально)</FieldLabel>
                    <Input
                      type="date"
                      value={form.expiresAt}
                      onChange={(e) => form.setExpiresAt(e.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div className="mt-3 border-t border-border/40 pt-3">
                  <FieldLabel>Годен до</FieldLabel>
                  <Input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => form.setExpiresAt(e.target.value)}
                  />
                </div>
              )}

              <p className="mt-3 text-xs leading-relaxed text-muted">
                {paoHint}
              </p>
            </section>
          </div>

          <div className="sticky bottom-0 -mx-5 border-t border-border/60 bg-surface px-5 pb-5 pt-3">
            <Button type="submit" size="lg" className="h-12 w-full rounded-[14px]">
              {isEditing ? 'Сохранить изменения' : 'Сохранить'}
            </Button>
          </div>
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
