'use client';

import { NavIcon } from '@/components/icons/NavIcon';
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

export function BottomNavBar({
  activeTab,
  isSignedIn,
  isHidden,
  onShelfPress,
  onAddPress,
  onAccountPress,
}: BottomNavBarProps) {
  const handleAdd = () => {
    haptic('medium');
    onAddPress();
  };

  const handleShelf = () => {
    haptic('light');
    onShelfPress();
  };

  const handleAccount = () => {
    haptic('light');
    onAccountPress();
  };

  return (
    <nav
      className={cn(
        'safe-bottom nav-bar fixed inset-x-0 bottom-0 z-20 border-t border-border/40 bg-surface/85 shadow-[0_-14px_34px_rgba(44,36,32,0.08)] backdrop-blur-2xl transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,0.8,0.2,1)] dark:shadow-[0_-14px_34px_rgba(0,0,0,0.28)]',
        isHidden
          ? 'pointer-events-none translate-y-full opacity-0'
          : 'translate-y-0 opacity-100',
      )}
      aria-label="Навигация"
      aria-hidden={isHidden}
    >
      <div className="relative mx-auto flex h-16 w-full max-w-lg items-center justify-between px-8">
        <button
          type="button"
          onClick={handleShelf}
          aria-label="Полка"
          aria-current={activeTab === 'shelf' ? 'page' : undefined}
          className={cn(
            'nav-icon touch-target flex h-12 w-12 items-center justify-center rounded-[18px] transition-all',
            activeTab === 'shelf'
              ? 'bg-accent/10 text-accent shadow-sm'
              : 'text-muted hover:bg-bg/70 hover:text-text',
          )}
        >
          <NavIcon name="shelf" />
        </button>

        <div className="pointer-events-none absolute inset-x-0 flex justify-center">
          <button
            type="button"
            onClick={handleAdd}
            aria-label="Добавить продукт"
            className="fab-button pointer-events-auto -mt-7 flex h-14 w-14 items-center justify-center rounded-[22px] bg-accent text-accent-foreground shadow-[var(--shadow-button)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-hover active:scale-[0.94]"
          >
            <NavIcon name="add" />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAccount}
          aria-label={isSignedIn ? 'Профиль' : 'Войти'}
          aria-current={activeTab === 'account' ? 'page' : undefined}
          className={cn(
            'nav-icon touch-target flex h-12 w-12 items-center justify-center rounded-[18px] transition-all',
            activeTab === 'account'
              ? 'bg-accent/10 text-accent shadow-sm'
              : 'text-muted hover:bg-bg/70 hover:text-text',
          )}
        >
          {isSignedIn ? (
            <NavIcon name="profile" />
          ) : (
            <NavIcon name="login" />
          )}
        </button>
      </div>
    </nav>
  );
}
