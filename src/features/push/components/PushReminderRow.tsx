'use client';

import { haptic } from '@/lib/haptics';
import { usePush } from '../hooks/usePush';

/** Ползунок-переключатель в стиле профиля. */
function Switch({
  checked,
  disabled,
  onClick,
}: {
  checked: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onClick}
      className="relative inline-flex h-[26px] w-[46px] shrink-0 items-center rounded-full border border-border transition-colors disabled:opacity-40"
      style={{
        background: checked
          ? 'var(--accent)'
          : 'color-mix(in srgb, var(--muted) 22%, var(--surface))',
      }}
    >
      <span
        className="inline-block h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-transform"
        style={{ transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

/**
 * Строка «Напоминания» (реальный web push) для карточки профиля. Честно
 * объясняет ограничения: нужен вход (сервер шлёт push только вошедшим), а на
 * iOS — установленная PWA. Разрешение просит только по клику.
 */
export function PushReminderRow() {
  const push = usePush();

  const disabled = push.busy || !push.supported || !push.isSignedIn;

  const subtext = (() => {
    if (!push.supported) {
      return push.standalone
        ? 'Браузер не поддерживает уведомления'
        : 'Установите приложение на экран — тогда придут push-уведомления';
    }
    if (!push.isSignedIn) return 'Войдите, чтобы получать напоминания на устройство';
    if (push.error) return push.error;
    if (push.enabled) return 'Придут, когда средство истекает — даже если приложение закрыто';
    if (push.permission === 'denied') {
      return 'Разрешение отклонено — включите уведомления в настройках браузера';
    }
    return 'Уведомим, когда что-то из полки истекает';
  })();

  const onToggle = () => {
    haptic('light');
    void push.toggle();
  };

  return (
    <div className="border-b border-icon-bg py-[11px]">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm text-text">Напоминания</span>
        <Switch checked={push.enabled} disabled={disabled} onClick={onToggle} />
      </div>
      {subtext && (
        <p className="mt-1 max-w-[85%] text-[12px] leading-snug text-muted/80">
          {subtext}
        </p>
      )}
    </div>
  );
}
