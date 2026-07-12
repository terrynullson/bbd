'use client';

import { Modal } from '@/components/ui/Modal';
import { haptic } from '@/lib/haptics';
import type { Reminder } from '../lib/reminders';

type NotificationsSheetProps = {
  reminders: Reminder[];
  onClose: () => void;
  onOpenItem: (itemId: string) => void;
};

const DOT_COLOR: Record<Reminder['kind'], string> = {
  expired: 'var(--expired)',
  expiring: 'var(--expiring)',
};

export function NotificationsSheet({
  reminders,
  onClose,
  onOpenItem,
}: NotificationsSheetProps) {
  return (
    <Modal title="Уведомления" onClose={onClose}>
      <p className="quiet-label mb-4">Напоминания</p>

      {reminders.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="empty-state-icon mb-4 flex h-16 w-16 items-center justify-center rounded-full" />
          <p className="text-sm text-muted">
            Всё под контролем — ничего не требует внимания.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2.5 pb-2">
          {reminders.map((reminder) => (
            <li key={reminder.id}>
              <button
                type="button"
                onClick={() => {
                  haptic('light');
                  onOpenItem(reminder.itemId);
                }}
                className="motion-safe-transition flex w-full items-start gap-3 rounded-card border border-border bg-surface px-4 py-3.5 text-left transition-colors hover:border-accent/40 active:scale-[0.99]"
              >
                <span
                  aria-hidden
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ background: DOT_COLOR[reminder.kind] }}
                />
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold text-text">
                    {reminder.name}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-muted">
                    {reminder.message}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
