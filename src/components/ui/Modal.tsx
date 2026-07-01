'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

type ModalProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
};

export function Modal({ title, children, onClose, className }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center sm:p-0">
      <div
        className={cn(
          'w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-[var(--shadow-modal)] animate-in slide-in-from-bottom-4 duration-300',
          className,
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
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
        {children}
      </div>
    </div>
  );
}
