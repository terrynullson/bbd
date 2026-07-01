'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

type ModalProps = {
  title?: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
};

export function Modal({ title, children, onClose, className }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 backdrop-blur-[2px]">
      <div
        className={cn(
          'max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-[28px] bg-surface px-5 pb-8 pt-4 shadow-[var(--shadow-modal)] animate-in slide-in-from-bottom-4 duration-300',
          className,
        )}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

        {title && (
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-text">
              {title}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Закрыть"
              className="h-9 w-9 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {!title && (
          <div className="mb-4 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              aria-label="Закрыть"
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
