'use client';

import { useState } from 'react';
import { FieldLabel } from '@/components/ui/FieldLabel';
import { SuggestionDropdown } from './SuggestionDropdown';
import { PaoPicker } from './PaoPicker';
import { OpeningQuestion } from './OpeningQuestion';
import { ghostButtonClass, inputClass, primaryButtonClass } from './AddFormControls';
import { useSuggestions } from '../hooks/useSuggestions';
import { inferCategoryFromText } from '../lib/categories';
import { todayIso } from '../lib/date-input';
import { getDefaultPaoMonths, inferTaxonomy } from '../lib/taxonomy';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import type {
  AddProductInput,
  CosmeticItem,
  ProductCategory,
  ProductSuggestion,
} from '../types';

const SUGGEST_MIN_CHARS = 4;
const UNKNOWN_BRAND = 'Неизвестный бренд';

type AddManualTabProps = {
  localItems: CosmeticItem[];
  initialDraft?: Partial<AddProductInput>;
  onSubmit: (input: AddProductInput) => void;
  onOpenFullForm: (draft: Partial<AddProductInput>) => void;
};

function presetPao(category: ProductCategory, text: string) {
  return getDefaultPaoMonths(inferTaxonomy(category, text).subtype, category);
}

export function AddManualTab({
  localItems,
  initialDraft,
  onSubmit,
  onOpenFullForm,
}: AddManualTabProps) {
  const [name, setName] = useState(initialDraft?.name ?? '');
  const [pickedCategory, setPickedCategory] = useState<ProductCategory | null>(
    initialDraft?.category ?? null,
  );
  const [pickedPao, setPickedPao] = useState<number | null>(
    initialDraft?.paoMonths ?? null,
  );
  const [openedAt, setOpenedAt] = useState(todayIso());
  const [isSealed, setIsSealed] = useState(initialDraft?.isSealed ?? false);
  const [expiresAt, setExpiresAt] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState('');

  // Категория выводится из названия и в быстром вводе не показывается —
  // её правят в полной форме. PAO — пока не выбрали руками.
  const category =
    pickedCategory ??
    (name.trim().length >= 3 ? inferCategoryFromText(name) : 'cream');
  const paoMonths = pickedPao ?? presetPao(category, name);

  const pickSuggestion = (suggestion: ProductSuggestion) => {
    setName(suggestion.name);
    if (suggestion.category) setPickedCategory(suggestion.category);
    if (suggestion.paoMonths) setPickedPao(suggestion.paoMonths);
    setIsFocused(false);
  };

  const suggestions = useSuggestions({
    type: 'product',
    query: name,
    localItems,
    minChars: SUGGEST_MIN_CHARS,
    enabled: isFocused,
    onPick: pickSuggestion,
  });

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Введите название средства');
      haptic('error');
      return;
    }
    if (isSealed && !expiresAt) {
      setError('Для неоткрытого укажите «Годен до» с упаковки');
      haptic('error');
      return;
    }

    const taxonomy = inferTaxonomy(category, trimmed);
    haptic('medium');
    onSubmit({
      name: trimmed,
      brand: UNKNOWN_BRAND,
      paoMonths,
      openedAt: new Date(openedAt).toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      expirySource: expiresAt ? 'user' : undefined,
      isSealed,
      category,
      productGroup: taxonomy.group,
      productSubtype: taxonomy.subtype,
      paoSource: pickedPao !== null ? 'user' : 'preset',
      lookupSource: 'manual',
    });
  };

  const openFullForm = () => {
    haptic('light');
    onOpenFullForm({
      name: name.trim() || undefined,
      // Автоподставленные категорию и PAO не передаём: иначе полная форма
      // примет их за выбор пользователя и перестанет пересчитывать пресет.
      category: pickedCategory ?? undefined,
      paoMonths: pickedPao ?? undefined,
      openedAt: new Date(openedAt).toISOString(),
      expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      isSealed,
      lookupSource: 'manual',
    });
  };

  return (
    <div className="flex flex-col gap-[18px]">
      <div>
        <FieldLabel>Название</FieldLabel>
        <div className="relative">
          <input
            aria-label="Название средства"
            placeholder="Крем для лица с церамидами"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError('');
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 120)}
            onKeyDown={suggestions.handleKeyDown}
            className={inputClass}
          />
          {isFocused && (
            <SuggestionDropdown
              suggestions={suggestions.suggestions}
              mode="product"
              highlightIndex={suggestions.highlightIndex}
              onHighlight={suggestions.setHighlightIndex}
              onPick={pickSuggestion}
              heading="Возможно, вы имели в виду"
            />
          )}
        </div>
      </div>

      <div>
        <FieldLabel>Когда вскрыли?</FieldLabel>
        <OpeningQuestion
          value={{ openedAt, isSealed }}
          onChange={(next) => {
            setOpenedAt(next.openedAt);
            setIsSealed(next.isSealed);
            if (error) setError('');
          }}
        />
      </div>

      {!isSealed && (
        <div>
          <FieldLabel>Срок после вскрытия</FieldLabel>
          <PaoPicker
            value={paoMonths}
            isEstimate={pickedPao === null}
            onChange={setPickedPao}
          />
        </div>
      )}

      <div>
        <FieldLabel>
          {isSealed ? 'Годен до (с упаковки)' : 'Годен до (опционально)'}
        </FieldLabel>
        <input
          type="date"
          aria-label="Годен до"
          value={expiresAt}
          onChange={(event) => {
            setExpiresAt(event.target.value);
            if (error) setError('');
          }}
          className={inputClass}
        />
      </div>

      {error && <p className="text-xs text-expired">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        className={cn(primaryButtonClass, 'mt-1')}
      >
        Добавить на полку
      </button>

      <button type="button" onClick={openFullForm} className={ghostButtonClass}>
        Полная форма — бренд, фото, категория
      </button>
    </div>
  );
}
