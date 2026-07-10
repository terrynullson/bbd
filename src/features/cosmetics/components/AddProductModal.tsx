'use client';

import { useCallback, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { BarcodeScanner } from './BarcodeScanner';
import { PaoPicker } from './PaoPicker';
import { OpeningQuestion } from './OpeningQuestion';
import { ProductIdentitySection } from './ProductIdentitySection';
import { Chip } from './AddFormControls';
import { CATEGORY_ORDER, getCategoryTitle } from '../lib/categories';
import { upsertCatalogProduct } from '../api/catalog-product';
import { useAddProductForm } from '../hooks/useAddProductForm';
import { useBarcodeLookup } from '../hooks/useBarcodeLookup';
import { useAuth } from '@/lib/supabase/use-auth';
import { haptic } from '@/lib/haptics';
import type {
  AddProductInput,
  CosmeticItem,
  LookupProductResponse,
  PaoSource,
} from '../types';

type AddProductModalProps = {
  onClose: () => void;
  onSubmit: (input: AddProductInput) => void;
  onQuickAdd?: (draft: Partial<AddProductInput>) => void;
  item?: CosmeticItem | null;
  initialValues?: Partial<AddProductInput>;
  localItems?: CosmeticItem[];
};

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
  const [nameError, setNameError] = useState('');
  const form = useAddProductForm(item ?? initialValues);
  const isEditing = Boolean(item);

  const handleLookupFound = useCallback(
    (code: string, result: LookupProductResponse) => {
      form.setBarcode(code, 'scan', result);
      if (result.brand) form.setBrand(result.brand);
      if (result.name) form.setName(result.name);
      if (result.paoMonths) form.setPaoMonths(result.paoMonths, 'catalog');
      if (result.category) form.setCategory(result.category);
      if (result.imageUrl) form.setImageUrl(result.imageUrl);
      form.setLookupSource(result.source ?? 'barcode');
    },
    [form],
  );

  const barcodeLookup = useBarcodeLookup({ onFound: handleLookupFound });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const input = form.buildInput();
    if (!input) {
      setNameError('Укажите название продукта');
      haptic('error');
      return;
    }

    setNameError('');
    onSubmit(input);
    void upsertCatalogProduct(input);
    if (!isEditing) form.reset();
    onClose();
  };

  const handleBarcodeScan = (code: string) => {
    form.setBarcode(code, 'scan');
    setIsScannerOpen(false);
    void barcodeLookup.lookup(code);
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
            <ProductIdentitySection
              form={form}
              localItems={localItems}
              isEditing={isEditing}
              initialValues={initialValues}
              onOpenScanner={() => setIsScannerOpen(true)}
              isLookupLoading={barcodeLookup.isLoading}
              lookupError={barcodeLookup.error}
              onLookupErrorClear={barcodeLookup.clearError}
              userId={user?.id}
              nameError={nameError}
              onClearNameError={() => setNameError('')}
            />

            <div>
              <FieldLabel>Категория</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ORDER.map((id) => (
                  <Chip
                    key={id}
                    active={form.effectiveCategory === id}
                    onClick={() => form.setCategory(id)}
                  >
                    {getCategoryTitle(id)}
                  </Chip>
                ))}
              </div>
            </div>

            <section className="flex flex-col gap-3 rounded-card border border-border bg-surface p-3">
              <div>
                <FieldLabel>Когда вскрыли?</FieldLabel>
                <OpeningQuestion
                  value={{ openedAt: form.openedAt, isSealed: form.isSealed }}
                  onChange={(next) => {
                    form.setIsSealed(next.isSealed);
                    form.setOpenedAt(next.openedAt);
                  }}
                />
              </div>

              {!form.isSealed && (
                <div>
                  <FieldLabel>Срок после вскрытия (PAO)</FieldLabel>
                  <PaoPicker
                    value={form.paoMonths}
                    isEstimate={
                      form.paoSource === 'preset' ||
                      form.paoSource === 'ai_estimate'
                    }
                    onChange={form.setPaoMonths}
                  />
                </div>
              )}

              <div>
                <FieldLabel>
                  {form.isSealed ? 'Годен до (с упаковки)' : 'Годен до (опционально)'}
                </FieldLabel>
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(event) => form.setExpiresAt(event.target.value)}
                />
              </div>

              <p className="text-xs leading-relaxed text-muted">
                {getDatesHint(form.isSealed, form.paoSource)}
              </p>
            </section>
          </div>

          <div className="sticky bottom-0 -mx-5 border-t border-border/60 bg-surface px-5 pb-5 pt-3">
            <Button type="submit" size="lg" className="h-12 w-full">
              {isEditing ? 'Сохранить изменения' : 'Сохранить'}
            </Button>
          </div>
        </form>
      </Modal>

      {isScannerOpen && (
        <BarcodeScanner
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={handleBarcodeScan}
        />
      )}
    </>
  );
}
