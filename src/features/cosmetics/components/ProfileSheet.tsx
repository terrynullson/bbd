'use client';

import { Modal } from '@/components/ui/Modal';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { StylePicker } from '@/components/theme/StylePicker';
import { APP_VERSION } from '@/lib/constants';
import { useAuth } from '@/lib/supabase/use-auth';
import {
  getStorageStatusMessage,
  shouldShowSyncRetry,
} from '../lib/storage-status';

type ProfileSheetProps = {
  onClose: () => void;
  isOnline: boolean;
  error: string;
  syncStatus: 'local' | 'syncing' | 'synced' | 'offline' | 'error';
  syncError: string;
  isSaving: boolean;
  lastSavedAt: string | null;
  isSignedIn: boolean;
  onRetrySync: () => void;
};

export function ProfileSheet({
  onClose,
  isOnline,
  error,
  syncStatus,
  syncError,
  isSaving,
  lastSavedAt,
  isSignedIn,
  onRetrySync,
}: ProfileSheetProps) {
  const { user } = useAuth();

  const storageStatus = getStorageStatusMessage({
    isOnline,
    error,
    syncStatus,
    syncError,
    isSignedIn,
    isSaving,
    lastSavedAt,
  });
  const showSyncRetry = shouldShowSyncRetry(syncError, isOnline, isSignedIn);

  return (
    <Modal title={user ? 'Профиль' : 'Вход'} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <AuthPanel />

        <StylePicker />

        <div className="flex items-center justify-between rounded-[14px] border border-border bg-bg px-4 py-3">
          <div>
            <p className="text-sm font-medium text-text">Тема оформления</p>
            <p className="text-xs text-muted">Светлая или тёмная</p>
          </div>
          <ThemeToggle />
        </div>

        <div className="border-t border-border/60 pt-4">
          <p
            className={`text-center text-xs ${
              error || syncError ? 'text-expired' : 'text-muted/70'
            }`}
          >
            {storageStatus}
            {showSyncRetry && (
              <>
                {' · '}
                <button
                  type="button"
                  onClick={onRetrySync}
                  className="font-semibold text-text underline underline-offset-2"
                >
                  Повторить
                </button>
              </>
            )}
          </p>

          <p className="mt-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted/60">
            v{APP_VERSION}
          </p>
        </div>
      </div>
    </Modal>
  );
}
