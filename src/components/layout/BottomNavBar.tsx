'use client';

import { NavIcon } from '@/components/icons/NavIcon';
import { useDesignStyle } from '@/components/theme/style-provider';
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

const edgeIconClass =
  'nav-icon touch-target flex h-12 w-12 items-center justify-center rounded-[18px] bg-transparent transition-all';

function WarmBottomNavBar({
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
        'safe-bottom nav-bar fixed inset-x-0 bottom-0 z-20 px-4 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,0.8,0.2,1)]',
        isHidden
          ? 'pointer-events-none translate-y-full opacity-0'
          : 'translate-y-0 opacity-100',
      )}
      aria-label="Навигация"
      aria-hidden={isHidden}
    >
      <div className="mx-auto flex w-full max-w-lg justify-center">
        <div className="relative flex items-center gap-2 rounded-[26px] bg-[var(--nav-surface)] px-2.5 py-2 ring-1 ring-[var(--sheet-edge)]">
          <button
            type="button"
            onClick={handleShelf}
            aria-label="Полка"
            aria-current={activeTab === 'shelf' ? 'page' : undefined}
            className={cn(
              edgeIconClass,
              activeTab === 'shelf' ? 'text-accent' : 'text-muted hover:text-text',
            )}
          >
            <NavIcon name="shelf" className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={handleAdd}
            aria-label="Добавить продукт"
            className="fab-button flex h-[54px] w-[54px] items-center justify-center rounded-[20px] bg-accent text-accent-foreground transition-all duration-300 hover:bg-accent-hover active:scale-[0.94]"
          >
            <NavIcon name="add" className="h-6 w-6" />
          </button>

          <button
            type="button"
            onClick={handleAccount}
            aria-label={isSignedIn ? 'Профиль' : 'Войти'}
            aria-current={activeTab === 'account' ? 'page' : undefined}
            className={cn(
              edgeIconClass,
              activeTab === 'account' ? 'text-accent' : 'text-muted hover:text-text',
            )}
          >
            {isSignedIn ? (
              <NavIcon name="profile" className="h-6 w-6" />
            ) : (
              <NavIcon name="login" className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}

function PulseBottomNavBar({
  activeTab,
  isSignedIn,
  isHidden,
  onShelfPress,
  onAddPress,
  onAccountPress,
}: BottomNavBarProps) {
  const dockBtn =
    'nav-icon touch-target flex min-h-[52px] flex-col items-center justify-center gap-1 transition-colors';

  return (
    <nav
      className={cn(
        'safe-bottom nav-bar fixed inset-x-0 bottom-0 z-20 border-t border-border bg-[var(--nav-surface)] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,0.8,0.2,1)]',
        isHidden
          ? 'pointer-events-none translate-y-full opacity-0'
          : 'translate-y-0 opacity-100',
      )}
      aria-label="Навигация"
      aria-hidden={isHidden}
    >
      <div className="mx-auto grid w-full max-w-lg grid-cols-3">
        <button
          type="button"
          onClick={() => {
            haptic('light');
            onShelfPress();
          }}
          aria-label="Полка"
          aria-current={activeTab === 'shelf' ? 'page' : undefined}
          className={cn(
            dockBtn,
            activeTab === 'shelf' ? 'pulse-dock-active' : 'text-muted hover:text-text',
          )}
        >
          <NavIcon name="shelf" className="h-5 w-5" />
          <span className="pulse-mono text-[9px]">shelf</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic('medium');
            onAddPress();
          }}
          aria-label="Добавить продукт"
          className="flex min-h-[52px] flex-col items-center justify-center gap-1 bg-accent text-accent-foreground transition-colors hover:bg-accent-hover active:scale-[0.99]"
        >
          <NavIcon name="add" className="h-5 w-5" />
          <span className="pulse-mono text-[9px]">add</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic('light');
            onAccountPress();
          }}
          aria-label={isSignedIn ? 'Профиль' : 'Войти'}
          aria-current={activeTab === 'account' ? 'page' : undefined}
          className={cn(
            dockBtn,
            activeTab === 'account' ? 'pulse-dock-active' : 'text-muted hover:text-text',
          )}
        >
          {isSignedIn ? (
            <NavIcon name="profile" className="h-5 w-5" />
          ) : (
            <NavIcon name="login" className="h-5 w-5" />
          )}
          <span className="pulse-mono text-[9px]">{isSignedIn ? 'user' : 'auth'}</span>
        </button>
      </div>
    </nav>
  );
}

function RiotBottomNavBar({
  activeTab,
  isSignedIn,
  isHidden,
  onShelfPress,
  onAddPress,
  onAccountPress,
}: BottomNavBarProps) {
  const tabClass =
    'nav-icon touch-target riot-scream flex min-h-[54px] flex-col items-center justify-center gap-0.5 text-[9px] transition-colors';

  return (
    <nav
      className={cn(
        'safe-bottom nav-bar fixed inset-x-0 bottom-0 z-20 border-t-4 border-accent bg-[var(--nav-surface)] text-white transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.22,0.8,0.2,1)]',
        isHidden
          ? 'pointer-events-none translate-y-full opacity-0'
          : 'translate-y-0 opacity-100',
      )}
      aria-label="Навигация"
      aria-hidden={isHidden}
    >
      <div className="mx-auto grid w-full max-w-lg grid-cols-3 divide-x divide-white/15">
        <button
          type="button"
          onClick={() => {
            haptic('light');
            onShelfPress();
          }}
          aria-label="Полка"
          aria-current={activeTab === 'shelf' ? 'page' : undefined}
          className={cn(
            tabClass,
            activeTab === 'shelf'
              ? 'riot-nav-active'
              : 'text-white/70 hover:bg-white/5 hover:text-white',
          )}
        >
          <NavIcon name="shelf" className="h-5 w-5" />
          <span>Полка</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic('medium');
            onAddPress();
          }}
          aria-label="Добавить продукт"
          className="flex min-h-[54px] flex-col items-center justify-center bg-[var(--riot-neon)] text-black transition-transform active:scale-[0.97]"
        >
          <NavIcon name="add" className="h-6 w-6" />
          <span className="riot-scream text-[11px]">+</span>
        </button>

        <button
          type="button"
          onClick={() => {
            haptic('light');
            onAccountPress();
          }}
          aria-label={isSignedIn ? 'Профиль' : 'Войти'}
          aria-current={activeTab === 'account' ? 'page' : undefined}
          className={cn(
            tabClass,
            activeTab === 'account'
              ? 'riot-nav-active'
              : 'text-white/70 hover:bg-white/5 hover:text-white',
          )}
        >
          {isSignedIn ? (
            <NavIcon name="profile" className="h-5 w-5" />
          ) : (
            <NavIcon name="login" className="h-5 w-5" />
          )}
          <span>{isSignedIn ? 'Профиль' : 'Вход'}</span>
        </button>
      </div>
    </nav>
  );
}

export function BottomNavBar(props: BottomNavBarProps) {
  const { designStyle } = useDesignStyle();
  if (designStyle === 'pulse') return <PulseBottomNavBar {...props} />;
  if (designStyle === 'riot') return <RiotBottomNavBar {...props} />;
  return <WarmBottomNavBar {...props} />;
}
