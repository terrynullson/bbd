'use client';

import { Modal } from '@/components/ui/Modal';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { APP_VERSION } from '@/lib/constants';
import { useAuth } from '@/lib/supabase/use-auth';

type ProfileSheetProps = {
  onClose: () => void;
};

export function ProfileSheet({ onClose }: ProfileSheetProps) {
  const { user } = useAuth();

  return (
    <Modal title={user ? 'Профиль' : 'Вход'} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <AuthPanel />

        <div className="flex items-center justify-between rounded-[14px] border border-border bg-bg px-4 py-3">
          <div>
            <p className="text-sm font-medium text-text">Тема оформления</p>
            <p className="text-xs text-muted">Светлая или тёмная</p>
          </div>
          <ThemeToggle />
        </div>

        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-muted/60">
          v{APP_VERSION}
        </p>
      </div>
    </Modal>
  );
}
