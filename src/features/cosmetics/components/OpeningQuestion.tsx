'use client';

import { useState } from 'react';
import { Chip } from './AddFormControls';
import { inputClass } from './AddFormControls';
import {
  openingPresetDate,
  todayIso,
  type OpeningPreset,
} from '../lib/date-input';

type OpeningValue = {
  openedAt: string;
  isSealed: boolean;
};

type OpeningQuestionProps = {
  value: OpeningValue;
  onChange: (next: OpeningValue) => void;
};

type Mode = 'today' | 'earlier' | 'sealed';

const PRESETS: Array<{ id: OpeningPreset; label: string }> = [
  { id: 'this_month', label: 'В этом месяце' },
  { id: 'few_months', label: '2–3 месяца назад' },
  { id: 'half_year', label: 'Полгода+ назад' },
  { id: 'forgot', label: 'Не помню' },
];

function initialMode(value: OpeningValue): Mode {
  if (value.isSealed) return 'sealed';
  return value.openedAt === todayIso() ? 'today' : 'earlier';
}

export function OpeningQuestion({ value, onChange }: OpeningQuestionProps) {
  const [mode, setMode] = useState<Mode>(() => initialMode(value));
  const [preset, setPreset] = useState<OpeningPreset | null>(null);

  const selectMode = (next: Mode) => {
    setMode(next);
    if (next === 'today') {
      setPreset(null);
      onChange({ openedAt: todayIso(), isSealed: false });
    } else if (next === 'sealed') {
      onChange({ openedAt: value.openedAt, isSealed: true });
    } else {
      onChange({ ...value, isSealed: false });
    }
  };

  const selectPreset = (id: OpeningPreset) => {
    setPreset(id);
    onChange({ openedAt: openingPresetDate(id), isSealed: false });
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        role="tablist"
        aria-label="Когда вскрыли"
        className="flex rounded-full p-1"
        style={{ background: 'var(--icon-bg)' }}
      >
        {(
          [
            ['today', 'Сегодня'],
            ['earlier', 'Раньше'],
            ['sealed', 'Ещё не вскрыла'],
          ] as Array<[Mode, string]>
        ).map(([id, label]) => {
          const active = mode === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectMode(id)}
              className={
                'motion-safe-transition min-h-10 flex-1 rounded-full px-2 text-[12.5px] font-semibold transition-all duration-300 ' +
                (active
                  ? 'bg-surface text-text shadow-[0_2px_8px_rgba(46,42,36,0.1)]'
                  : 'text-muted')
              }
            >
              {label}
            </button>
          );
        })}
      </div>

      {mode === 'earlier' && (
        <div className="flex flex-col gap-2.5">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((item) => (
              <Chip
                key={item.id}
                active={preset === item.id}
                onClick={() => selectPreset(item.id)}
              >
                {item.label}
              </Chip>
            ))}
          </div>

          <label className="text-xs text-muted">
            или точная дата
            <input
              type="date"
              aria-label="Точная дата вскрытия"
              value={value.openedAt}
              max={todayIso()}
              onChange={(event) => {
                setPreset(null);
                onChange({ openedAt: event.target.value, isSealed: false });
              }}
              className={inputClass + ' mt-1.5'}
            />
          </label>
        </div>
      )}

      {mode === 'sealed' && (
        <p className="text-xs leading-relaxed text-muted">
          Срок посчитаем по дате «Годен до» с упаковки. Когда вскроете —
          отметите, и включится отсчёт после вскрытия.
        </p>
      )}
    </div>
  );
}
