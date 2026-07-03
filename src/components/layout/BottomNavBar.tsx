'use client';

import { LayoutGrid, LogIn, Plus, User } from 'lucide-react';
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
        'safe-bottom nav-bar fixed inset-x-0 bottom-0 z-20 border-t border-border/50 bg-surface/90 backdrop-blur-xl transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
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
            'nav-icon touch-target flex h-12 w-12 items-center justify-center rounded-button transition-colors',
            activeTab === 'shelf'
              ? 'text-accent'
              : 'text-muted hover:text-text',
          )}
        >
          <LayoutGrid className="h-6 w-6" strokeWidth={1.75} />
        </button>

        <div className="pointer-events-none absolute inset-x-0 flex justify-center">
          <button
            type="button"
            onClick={handleAdd}
            aria-label="Добавить продукт"
            className="fab-button pointer-events-auto -mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[var(--shadow-button)] transition-all hover:bg-accent-hover active:scale-[0.94]"
          >
            <Plus className="h-6 w-6" strokeWidth={2} />
          </button>
        </div>

        <button
          type="button"
          onClick={handleAccount}
          aria-label={isSignedIn ? 'Профиль' : 'Войти'}
          aria-current={activeTab === 'account' ? 'page' : undefined}
          className={cn(
            'nav-icon touch-target flex h-12 w-12 items-center justify-center rounded-button transition-colors',
            activeTab === 'account'
              ? 'text-accent'
              : 'text-muted hover:text-text',
          )}
        >
          {isSignedIn ? (
            <User className="h-6 w-6" strokeWidth={1.75} />
          ) : (
            <LogIn className="h-6 w-6" strokeWidth={1.75} />
          )}
        </button>
      </div>
    </nav>
  );
}
