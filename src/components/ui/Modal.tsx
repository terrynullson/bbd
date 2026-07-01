'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ModalProps = {
  title?: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
};

export function Modal({ title, children, onClose, className }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div
        className={cn(
          'flex max-h-[min(92dvh,780px)] w-full max-w-lg flex-col rounded-t-[28px] bg-surface shadow-[var(--shadow-modal)] animate-in slide-in-from-bottom-4 duration-300',
          className,
        )}
      >
        <div className="relative shrink-0 px-5 pb-2 pt-3">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="touch-target absolute right-3 top-2 inline-flex items-center justify-center rounded-full text-muted hover:bg-bg hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
          {title && (
            <h2 className="font-display pr-12 text-xl font-semibold tracking-tight text-text">
              {title}
            </h2>
          )}
        </div>

        <div className="safe-bottom overflow-y-auto overscroll-contain px-5 pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}
