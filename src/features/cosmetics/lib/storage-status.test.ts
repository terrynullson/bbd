import { describe, expect, it } from 'vitest';
import { getStorageStatusMessage, shouldShowSyncRetry } from './storage-status';

function status(overrides: Partial<Parameters<typeof getStorageStatusMessage>[0]> = {}) {
  return getStorageStatusMessage({
    isOnline: true,
    error: '',
    syncStatus: 'local',
    syncError: '',
    isSignedIn: false,
    isStorageReady: true,
    ...overrides,
  });
}

describe('getStorageStatusMessage', () => {
  it('офлайн важнее всего остального', () => {
    expect(status({ isOnline: false, error: 'что-то', syncStatus: 'syncing' })).toMatch(
      /Офлайн/,
    );
  });

  it('ошибка хранилища показывается как есть', () => {
    expect(status({ error: 'Не удалось сохранить' })).toBe('Не удалось сохранить');
  });

  it('синхронизация важнее ошибки синхронизации', () => {
    expect(status({ syncStatus: 'syncing', syncError: 'упало' })).toMatch(
      /Синхронизируем/,
    );
  });

  it('ошибка синхронизации показывается после статуса', () => {
    expect(status({ syncError: 'упало' })).toBe('упало');
  });

  it('синхронизировано — только для вошедшего пользователя', () => {
    expect(status({ syncStatus: 'synced', isSignedIn: true })).toMatch(/облаком/);
    expect(status({ syncStatus: 'synced', isSignedIn: false })).toBe(
      'Сохранено на устройстве',
    );
  });

  it('готовое хранилище сообщает о локальном сохранении', () => {
    expect(status({ isStorageReady: true })).toBe('Сохранено на устройстве');
  });

  it('до готовности хранилища — нейтральный текст', () => {
    expect(status({ isStorageReady: false })).toBe('Локальное хранение готово');
  });
});

describe('shouldShowSyncRetry', () => {
  it('нужен и вход, и сеть, и ошибка', () => {
    expect(shouldShowSyncRetry('упало', true, true)).toBe(true);
    expect(shouldShowSyncRetry('', true, true)).toBe(false);
    expect(shouldShowSyncRetry('упало', false, true)).toBe(false);
    expect(shouldShowSyncRetry('упало', true, false)).toBe(false);
  });
});
