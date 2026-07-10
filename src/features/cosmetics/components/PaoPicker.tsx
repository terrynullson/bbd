'use client';

import { useState } from 'react';
import { PAO_MAX_MONTHS, PAO_MIN_MONTHS, PAO_PRESETS } from '@/lib/constants';
import { Chip } from './AddFormControls';
import { plural } from '../lib/plural';

type PaoPickerProps = {
  value: number;
  /** true — значение подобрано (пресет/ИИ), показываем «≈ примерно». */
  isEstimate?: boolean;
  onChange: (months: number) => void;
};

function clampMonths(raw: number): number {
  if (Number.isNaN(raw)) return PAO_MIN_MONTHS;
  return Math.min(PAO_MAX_MONTHS, Math.max(PAO_MIN_MONTHS, Math.round(raw)));
}

export function PaoPicker({ value, isEstimate = false, onChange }: PaoPickerProps) {
  const isPreset = (PAO_PRESETS as readonly number[]).includes(value);
  const [customOpen, setCustomOpen] = useState(!isPreset);

  const showCustom = customOpen || !isPreset;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {PAO_PRESETS.map((months) => (
          <Chip
            key={months}
            active={value === months && !showCustom}
            onClick={() => {
              setCustomOpen(false);
              onChange(months);
            }}
          >
            {months} мес
          </Chip>
        ))}

        <Chip active={showCustom} onClick={() => setCustomOpen(true)}>
          Другое
        </Chip>

        {isEstimate && (
          <span
            className="text-[11px] font-semibold"
            style={{ color: 'var(--quiet-gold-deep)' }}
          >
            ≈ примерно
          </span>
        )}
      </div>

      {showCustom && (
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="number"
            inputMode="numeric"
            min={PAO_MIN_MONTHS}
            max={PAO_MAX_MONTHS}
            value={value}
            aria-label="Срок после вскрытия, месяцев"
            onChange={(event) => onChange(clampMonths(event.target.valueAsNumber))}
            className="min-h-11 w-20 rounded-[14px] border border-border bg-surface px-3 text-center text-[15px] text-text focus:border-accent focus:outline-none"
          />
          <span>{plural(value, ['месяц', 'месяца', 'месяцев'])}</span>
        </label>
      )}
    </div>
  );
}
