'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

type ModalProps = {
  title?: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
};

const DRAG_CLOSE_THRESHOLD = 96;

export function Modal({ title, children, onClose, className }: ModalProps) {
  const [dragY, setDragY] = useState(0);
  const dragStartY = useRef<number | null>(null);
  const latestDragY = useRef(0);

  useEffect(() => {
    const { style } = document.body;
    const prevOverflow = style.overflow;
    style.overflow = 'hidden';

    return () => {
      style.overflow = prevOverflow;
    };
  }, []);

  const updateDragY = (value: number) => {
    latestDragY.current = value;
    setDragY(value);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartY.current = event.clientY;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;
    updateDragY(Math.max(0, event.clientY - dragStartY.current));
  };

  const handlePointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;

    dragStartY.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);

    if (latestDragY.current > DRAG_CLOSE_THRESHOLD) {
      onClose();
      return;
    }

    updateDragY(0);
  };

  return (
    <div
      className="sheet-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={cn(
          'sheet-panel flex max-h-[min(92dvh,780px)] w-full max-w-lg flex-col rounded-t-[28px] bg-surface shadow-[var(--shadow-modal)]',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Диалог'}
        style={{
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: dragY > 0 ? 'none' : undefined,
        }}
      >
        <div
          className="relative shrink-0 cursor-grab touch-none px-5 pb-2 pt-3 active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
          {title && (
            <h2 className="font-display text-xl font-semibold tracking-tight text-text">
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
