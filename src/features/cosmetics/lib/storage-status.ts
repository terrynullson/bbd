type StorageStatusInput = {
  isOnline: boolean;
  error: string;
  syncStatus: 'local' | 'syncing' | 'synced' | 'offline' | 'error';
  syncError: string;
  isSignedIn: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;
};

export function getStorageStatusMessage({
  isOnline,
  error,
  syncStatus,
  syncError,
  isSignedIn,
  isSaving,
  lastSavedAt,
}: StorageStatusInput): string {
  if (!isOnline) return 'Офлайн · изменения сохраняются на устройстве';
  if (error) return error;
  if (syncStatus === 'syncing') return 'Синхронизируем с облаком...';
  if (syncError) return syncError;
  if (syncStatus === 'synced' && isSignedIn) return 'Синхронизировано с облаком';
  if (isSaving) return 'Сохраняем...';
  if (lastSavedAt) return 'Сохранено на устройстве';
  return 'Локальное хранение готово';
}

export function shouldShowSyncRetry(
  syncError: string,
  isOnline: boolean,
  isSignedIn: boolean,
): boolean {
  return Boolean(syncError && isOnline && isSignedIn);
}
