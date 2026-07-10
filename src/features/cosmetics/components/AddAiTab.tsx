'use client';

import { useState } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { ghostButtonClass, inputClass, primaryButtonClass } from './AddFormControls';
import { analyzeProduct } from '../api/analyze-product';
import {
  GENERIC_AI_RESULT_MESSAGE,
  isLowQualityAiResult,
} from '../lib/ai-result-quality';
import { inferCategoryFromText } from '../lib/categories';
import { todayIso } from '../lib/date-input';
import { plural } from '../lib/plural';
import { inferTaxonomy } from '../lib/taxonomy';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import type { AddProductInput, AnalyzeProductResponse } from '../types';

const UNKNOWN_BRAND = 'Неизвестный бренд';

type AddAiTabProps = {
  onSubmit: (input: AddProductInput) => void;
  onOpenFullForm: (draft: Partial<AddProductInput>) => void;
};

export function AddAiTab({ onSubmit, onOpenFullForm }: AddAiTabProps) {
  const isOnline = useOnlineStatus();
  const [query, setQuery] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [result, setResult] = useState<AnalyzeProductResponse | null>(null);
  const [error, setError] = useState('');

  const ask = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Опишите средство');
      haptic('error');
      return;
    }
    if (!isOnline) {
      setError('Нужен интернет для подбора');
      haptic('error');
      return;
    }

    setIsThinking(true);
    setResult(null);
    setError('');
    haptic('medium');

    try {
      const response = await analyzeProduct({ name: trimmed });
      if (isLowQualityAiResult(response, { hasBarcode: false })) {
        setError(GENERIC_AI_RESULT_MESSAGE);
        haptic('error');
        return;
      }
      setResult(response);
    } catch (aiError) {
      setError(
        aiError instanceof Error ? aiError.message : 'Не удалось подобрать срок',
      );
      haptic('error');
    } finally {
      setIsThinking(false);
    }
  };

  const buildInput = (): AddProductInput | null => {
    if (!result) return null;
    const category =
      result.category ?? inferCategoryFromText(`${result.brand} ${result.name}`);
    const taxonomy = inferTaxonomy(category, `${result.brand} ${result.name}`);

    return {
      name: result.name,
      brand: result.brand,
      paoMonths: result.paoMonths,
      openedAt: new Date(todayIso()).toISOString(),
      isSealed: false,
      category,
      productGroup: taxonomy.group,
      productSubtype: taxonomy.subtype,
      paoSource: 'ai_estimate',
      lookupSource: 'ai',
    };
  };

  const accept = () => {
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
      <p className="text-[13.5px] leading-relaxed text-muted">
        Напишите, что за средство — подскажем типичный срок хранения после
        вскрытия.
      </p>

      <input
        aria-label="Описание средства"
        placeholder="Например: сыворотка с витамином C"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          if (error) setError('');
        }}
        className={inputClass}
      />

      <button
        type="button"
        onClick={() => void ask()}
        disabled={isThinking}
        className="motion-safe-transition flex min-h-[54px] items-center justify-center rounded-full bg-accent px-4 text-[15px] font-bold text-accent-foreground transition-all duration-300 hover:bg-accent-hover active:scale-[0.98] disabled:opacity-60"
      >
        {isThinking ? <Spinner /> : 'Подобрать срок'}
      </button>

      {isThinking && (
        <div className="flex items-center gap-2.5 px-1 py-2 text-[13.5px] text-muted">
          <span className="flex gap-1.5">
            <span className="ai-dot h-[7px] w-[7px] rounded-full bg-accent" />
            <span
              className="ai-dot h-[7px] w-[7px] rounded-full bg-accent"
              style={{ animationDelay: '0.2s' }}
            />
            <span
              className="ai-dot h-[7px] w-[7px] rounded-full bg-accent"
              style={{ animationDelay: '0.4s' }}
            />
          </span>
          Изучаем состав и практику хранения…
        </div>
      )}

      {error && <p className="text-xs text-expired">{error}</p>}

      {!isOnline && (
        <p className="text-center text-xs text-muted">Нужен интернет для подбора</p>
      )}

      {result && !isThinking && (
        <div className="card-enter rounded-card border border-border bg-surface px-5 py-[18px]">
          <p className="quiet-label">Рекомендация</p>
          <p className="my-2.5 text-sm leading-relaxed text-text">
            {result.brand !== UNKNOWN_BRAND
              ? `${result.brand} · ${result.name}`
              : result.name}
          </p>
          <div className="mb-3.5 flex items-baseline gap-2">
            <span className="text-[30px] font-light text-text">
              {result.paoMonths}
            </span>
            <span className="text-[13px] text-muted">
              {plural(result.paoMonths, ['месяц', 'месяца', 'месяцев'])} после
              вскрытия
            </span>
          </div>

          <button
            type="button"
            onClick={accept}
            className={cn(primaryButtonClass, 'min-h-[50px]')}
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
    </div>
  );
}
