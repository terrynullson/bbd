'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
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
const DRAG_START_THRESHOLD = 8;

function isDragBlockedTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest(
      'input, textarea, select, button, a, [contenteditable="true"], [data-sheet-no-drag], [role="button"], [role="option"], [role="listbox"]',
    ),
  );
}

export function Modal({ title, children, onClose, className }: ModalProps) {
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef<number | null>(null);
  const latestDragY = useRef(0);
  const activePointerId = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    const { style } = document.body;
    const prevOverflow = style.overflow;
    style.overflow = 'hidden';

    return () => {
      style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel || !isDragging) return;

    const blockTouchMove = (event: TouchEvent) => {
      if (isDraggingRef.current) event.preventDefault();
    };

    panel.addEventListener('touchmove', blockTouchMove, { passive: false });
    return () => panel.removeEventListener('touchmove', blockTouchMove);
  }, [isDragging]);

  const resetDrag = () => {
    dragStartY.current = null;
    activePointerId.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
    setDragY(0);
    latestDragY.current = 0;

    if (panelRef.current) {
      panelRef.current.style.touchAction = '';
    }
  };

  const updateDragY = (value: number) => {
    latestDragY.current = value;
    setDragY(value);
  };

  const canStartDrag = (target: EventTarget | null) => {
    if (isDragBlockedTarget(target)) return false;

    const scrollEl = contentRef.current;
    if (!scrollEl?.contains(target as Node)) return true;

    return scrollEl.scrollTop <= 0;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if (!canStartDrag(event.target)) return;

    dragStartY.current = event.clientY;
    activePointerId.current = event.pointerId;

    if (panelRef.current) {
      panelRef.current.style.touchAction = 'none';
    }
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;
    if (activePointerId.current !== event.pointerId) return;

    const deltaY = event.clientY - dragStartY.current;

    if (!isDraggingRef.current) {
      if (deltaY <= DRAG_START_THRESHOLD) return;

      isDraggingRef.current = true;
      setIsDragging(true);

      if (contentRef.current) {
        contentRef.current.style.overflow = 'hidden';
      }

      panelRef.current?.setPointerCapture(event.pointerId);
    }

    if (deltaY > 0) {
      event.preventDefault();
      updateDragY(deltaY);
      return;
    }

    updateDragY(0);
  };

  const finishDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (dragStartY.current === null) return;
    if (activePointerId.current !== event.pointerId) return;

    if (isDraggingRef.current) {
      if (panelRef.current?.hasPointerCapture(event.pointerId)) {
        panelRef.current.releasePointerCapture(event.pointerId);
      }

      if (contentRef.current) {
        contentRef.current.style.overflow = '';
      }

      if (latestDragY.current > DRAG_CLOSE_THRESHOLD) {
        onClose();
        return;
      }
    }

    resetDrag();
  };

  return (
    <div
      className="sheet-backdrop fixed inset-0 z-50 flex items-end justify-center bg-black/50"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        className={cn(
          'sheet-panel flex max-h-[min(92dvh,780px)] w-full max-w-lg flex-col rounded-t-[28px] bg-surface will-change-transform',
          isDragging && 'select-none',
          className,
        )}
        onClick={(event) => event.stopPropagation()}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        role="dialog"
        aria-modal="true"
        aria-label={title ?? 'Диалог'}
        style={{
          transform: `translate3d(0, ${dragY}px, 0)`,
          transition: isDragging
            ? 'none'
            : 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        <div className="relative shrink-0 cursor-grab px-5 pb-2 pt-3 active:cursor-grabbing">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" />
          {title && (
            <h2 className="font-display text-xl font-semibold tracking-tight text-text">
              {title}
            </h2>
          )}
        </div>

        <div
          ref={contentRef}
          className="safe-bottom min-h-0 flex-1 overflow-y-auto overscroll-y-none px-5 pb-5"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
