'use client';

import { useState } from 'react';
import { ProductIdentityFields } from './ProductIdentityFields';
import { ProductIdentitySummary } from './ProductIdentitySummary';
import { getLookupSourceLabel } from '../lib/lookup-source';
import type { AddProductFormState } from '../hooks/useAddProductForm';
import type {
  AddProductInput,
  CosmeticItem,
  ProductSuggestion,
} from '../types';

type ProductIdentitySectionProps = {
  form: AddProductFormState;
  localItems: CosmeticItem[];
  isEditing: boolean;
  initialValues?: Partial<AddProductInput>;
  onOpenScanner: () => void;
  isLookupLoading: boolean;
  lookupError: string;
  onLookupErrorClear: () => void;
  userId?: string | null;
  nameError?: string;
  onClearNameError?: () => void;
};

/**
 * Единственное место, где состояние формы раскладывается на узкие пропсы —
 * поля ниже не имеют доступа к чужим полям.
 */
export function ProductIdentitySection({
  form,
  localItems,
  isEditing,
  initialValues,
  onOpenScanner,
  isLookupLoading,
  lookupError,
  onLookupErrorClear,
  userId,
  nameError,
  onClearNameError,
}: ProductIdentitySectionProps) {
  // Товар пришёл из поиска/сканера — показываем свёрнутое подтверждение.
  const isConfirmMode =
    !isEditing &&
    Boolean(initialValues?.name?.trim()) &&
    initialValues?.lookupSource !== 'manual';

  const [expandedByUser, setExpandedByUser] = useState<boolean | null>(null);
  const expanded =
    (expandedByUser ?? (isEditing || !isConfirmMode)) || Boolean(nameError);

  const lookupSourceLabel = getLookupSourceLabel(form.lookupSource);

  const applyProductSuggestion = (suggestion: ProductSuggestion) => {
    if (suggestion.brand) form.setBrand(suggestion.brand);
    form.setName(suggestion.name);
    if (suggestion.barcode) form.setBarcode(suggestion.barcode, 'manual');
    if (suggestion.paoMonths) form.setPaoMonths(suggestion.paoMonths, 'catalog');
    if (suggestion.category) form.setCategory(suggestion.category);
    if (suggestion.imageUrl) form.setImageUrl(suggestion.imageUrl);
    form.setLookupSource(suggestion.source === 'catalog' ? 'catalog' : 'manual');
  };

  if (!expanded) {
    return (
      <ProductIdentitySummary
        brand={form.brand || initialValues?.brand || ''}
        name={form.name || initialValues?.name || ''}
        barcode={form.barcode || initialValues?.barcode || ''}
        imageUrl={form.imageUrl || initialValues?.imageUrl || ''}
        lookupSourceLabel={lookupSourceLabel}
        userId={userId}
        onImageChange={form.setImageUrl}
        onExpand={() => setExpandedByUser(true)}
      />
    );
  }

  return (
    <ProductIdentityFields
      name={form.name}
      brand={form.brand}
      barcode={form.barcode}
      imageUrl={form.imageUrl}
      onNameChange={form.setName}
      onBrandChange={form.setBrand}
      onBarcodeChange={(value) => form.setBarcode(value, 'manual')}
      onImageChange={form.setImageUrl}
      onPickProduct={applyProductSuggestion}
      onPickBrand={(suggestion) => form.setBrand(suggestion.name)}
      smartFill={{
        onClick: form.handleSmartFill,
        disabled: !form.canSmartFill,
        loading: form.isSmartLoading,
        error: form.smartError,
        offlineMessage: form.smartFillOfflineMessage,
        onClearError: () => form.setSmartError(''),
      }}
      localItems={localItems}
      userId={userId}
      nameError={nameError}
      onClearNameError={onClearNameError}
      onOpenScanner={onOpenScanner}
      isLookupLoading={isLookupLoading}
      lookupError={lookupError}
      onLookupErrorClear={onLookupErrorClear}
      lookupSourceLabel={lookupSourceLabel}
      showSourceNote={!isEditing}
      onCollapse={isConfirmMode ? () => setExpandedByUser(false) : undefined}
    />
  );
}
