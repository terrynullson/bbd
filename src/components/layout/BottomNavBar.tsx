'use client';

import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

type BottomNavBarProps = {
  activeTab: 'shelf' | 'account';
  isSignedIn: boolean;
  isHidden: boolean;
  onShelfPress: () => void;
  onAddPress: () => void;
  onAccountPress: () => void;
};

const tabClass =
  'motion-safe-transition min-h-12 min-w-[84px] rounded-full px-4 text-[13px] font-semibold transition-all duration-300';

export function BottomNavBar({
  activeTab,
  isSignedIn,
  isHidden,
  onShelfPress,
  onAddPress,
  onAccountPress,
}: BottomNavBarProps) {
  const press = (fn: () => void, strength: 'light' | 'medium' = 'light') => () => {
    haptic(strength);
    fn();
  };

  const tabStyle = (isActive: boolean) =>
    isActive
      ? { background: 'color-mix(in srgb, var(--accent) 18%, transparent)', color: 'var(--accent)' }
      : { color: 'var(--nav-pill-muted)' };

  return (
    <nav
      className={cn(
        'nav-bar pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center',
        'px-4 pb-[max(1.375rem,var(--safe-bottom))] pt-2.5',
        'transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,0.8,0.2,1)]',
        isHidden ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-100',
      )}
      aria-label="Навигация"
      aria-hidden={isHidden}
    >
      <div
        className="pointer-events-auto flex items-center gap-1 rounded-full p-1.5"
        style={{
          background: 'var(--nav-pill)',
          boxShadow: '0 12px 32px rgba(46,42,36,0.25)',
        }}
      >
        <button
          type="button"
          onClick={press(onShelfPress)}
          aria-current={activeTab === 'shelf' ? 'page' : undefined}
          className={tabClass}
          style={tabStyle(activeTab === 'shelf')}
        >
          Полка
        </button>

        <button
          type="button"
          onClick={press(onAddPress, 'medium')}
          aria-label="Добавить средство"
          className="motion-safe-transition flex h-[52px] w-[52px] items-center justify-center rounded-full bg-accent text-[26px] font-light text-accent-foreground transition-all duration-300 hover:bg-accent-hover active:scale-[0.94]"
        >
          <span aria-hidden className="-mt-0.5">
            +
          </span>
        </button>

        <button
          type="button"
          onClick={press(onAccountPress)}
          aria-current={activeTab === 'account' ? 'page' : undefined}
          className={tabClass}
          style={tabStyle(activeTab === 'account')}
        >
          {isSignedIn ? 'Профиль' : 'Вход'}
        </button>
      </div>
    </nav>
  );
}
