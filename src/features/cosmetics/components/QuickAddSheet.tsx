'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { AddManualTab } from './AddManualTab';
import { AddScanTab } from './AddScanTab';
import { AddAiTab } from './AddAiTab';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';
import type { AddProductInput, CosmeticItem } from '../types';

type AddMode = 'manual' | 'scan' | 'ai';

type QuickAddSheetProps = {
  localItems: CosmeticItem[];
  initialDraft?: Partial<AddProductInput>;
  onClose: () => void;
  onManualFill: (draft: Partial<AddProductInput>) => void;
  onSubmit: (input: AddProductInput) => void;
};

const MODES: Array<{ id: AddMode; label: string }> = [
  { id: 'manual', label: 'Вручную' },
  { id: 'scan', label: 'Штрих-код' },
  { id: 'ai', label: 'ИИ-подбор' },
];

export function QuickAddSheet({
  localItems,
  initialDraft,
  onClose,
  onManualFill,
  onSubmit,
}: QuickAddSheetProps) {
  const [mode, setMode] = useState<AddMode>('manual');

  const submitAndClose = (input: AddProductInput) => {
    onSubmit(input);
    onClose();
  };

  /** Открыть полную форму с уже собранными данными — режим подтверждения. */
  const openFullForm = (draft: Partial<AddProductInput>) => {
    onManualFill(draft);
    onClose();
  };

  return (
    <Modal title="" onClose={onClose}>
      <p className="quiet-label">Новое средство</p>
      <h1 className="font-display mb-5 mt-2.5 text-[28px] text-text">
        Добавить на полку
      </h1>

      <div
        role="tablist"
        aria-label="Способ добавления"
        className="mb-6 flex rounded-full p-1"
        style={{ background: 'var(--icon-bg)' }}
      >
        {MODES.map((item) => {
          const active = mode === item.id;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setMode(item.id);
                haptic('light');
              }}
              className={cn(
                'motion-safe-transition min-h-11 flex-1 rounded-full text-[13.5px] font-semibold transition-all duration-300',
                active
                  ? 'bg-surface text-text shadow-[0_2px_8px_rgba(46,42,36,0.1)]'
                  : 'text-muted',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {mode === 'manual' && (
        <AddManualTab
          localItems={localItems}
          initialDraft={initialDraft}
          onSubmit={submitAndClose}
          onOpenFullForm={openFullForm}
        />
      )}

      {mode === 'scan' && (
        <AddScanTab onSubmit={submitAndClose} onOpenFullForm={openFullForm} />
      )}

      {mode === 'ai' && (
        <AddAiTab onSubmit={submitAndClose} onOpenFullForm={openFullForm} />
      )}
    </Modal>
  );
}
