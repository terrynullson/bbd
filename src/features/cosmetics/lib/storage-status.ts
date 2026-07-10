type StorageStatusInput = {
  isOnline: boolean;
  error: string;
  syncStatus: 'local' | 'syncing' | 'synced' | 'offline' | 'error';
  syncError: string;
  isSignedIn: boolean;
  /** Локальное хранилище прочитано и доступно на запись. */
  isStorageReady: boolean;
};

export function getStorageStatusMessage({
  isOnline,
  error,
  syncStatus,
  syncError,
  isSignedIn,
  isStorageReady,
}: StorageStatusInput): string {
  if (!isOnline) return 'Офлайн · изменения сохраняются на устройстве';
  if (error) return error;
  if (syncStatus === 'syncing') return 'Синхронизируем с облаком...';
  if (syncError) return syncError;
  if (syncStatus === 'synced' && isSignedIn) return 'Синхронизировано с облаком';
  if (isStorageReady) return 'Сохранено на устройстве';
  return 'Локальное хранение готово';
}

export function shouldShowSyncRetry(
  syncError: string,
  isOnline: boolean,
  isSignedIn: boolean,
): boolean {
  return Boolean(syncError && isOnline && isSignedIn);
}
