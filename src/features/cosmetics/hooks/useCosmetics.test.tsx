import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useCosmetics } from './useCosmetics';
import { STORAGE_KEY } from '@/lib/constants';
import type { AddProductInput } from '../types';

// Без Supabase хук работает в локальном режиме — этого достаточно для логики полки.
vi.mock('@/lib/supabase/use-auth', () => ({
  useAuth: () => ({ supabase: null, user: null, status: 'signed-out' }),
}));

const deleteProductPhoto = vi.fn().mockResolvedValue(undefined);
vi.mock('../lib/product-photo-storage', () => ({
  deleteProductPhoto: (url?: string) => deleteProductPhoto(url),
}));

function input(overrides: Partial<AddProductInput> = {}): AddProductInput {
  return {
    name: 'Крем',
    brand: 'CeraVe',
    paoMonths: 12,
    openedAt: new Date().toISOString(),
    isSealed: false,
    ...overrides,
  };
}

function stored() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw).items : [];
}

/** Хук читает хранилище в эффекте — ждём готовности. */
async function renderLoaded() {
  const view = renderHook(() => useCosmetics());
  await waitFor(() => expect(view.result.current.isLoaded).toBe(true));
  return view;
}

beforeEach(() => {
  localStorage.clear();
  deleteProductPhoto.mockClear();
});

describe('useCosmetics — загрузка', () => {
  it('инициализируется без requestAnimationFrame (работает в фоновой вкладке)', async () => {
    // rAF в фоне не вызывается — подменяем его на «никогда».
    const rafSpy = vi
      .spyOn(globalThis, 'requestAnimationFrame')
      .mockImplementation(() => 0);

    const { result } = await renderLoaded();

    expect(result.current.isLoaded).toBe(true);
    expect(rafSpy).not.toHaveBeenCalled();
    rafSpy.mockRestore();
  });

  it('поднимает сохранённые средства', async () => {
    const { result } = await renderLoaded();
    await act(async () => result.current.addItem(input({ name: 'Сыворотка' })));

    const second = await renderLoaded();
    expect(second.result.current.items).toHaveLength(1);
    expect(second.result.current.items[0].name).toBe('Сыворотка');
  });
});

describe('useCosmetics — добавление', () => {
  it('кладёт средство в начало и пишет в хранилище', async () => {
    const { result } = await renderLoaded();

    await act(async () => result.current.addItem(input({ name: 'Первый' })));
    await act(async () => result.current.addItem(input({ name: 'Второй' })));

    expect(result.current.items.map((i) => i.name)).toEqual(['Второй', 'Первый']);
    expect(stored()).toHaveLength(2);
  });

  it('проставляет таксономию и статус', async () => {
    const { result } = await renderLoaded();
    await act(async () =>
      result.current.addItem(input({ name: 'Ночной крем с ретинолом' })),
    );

    const item = result.current.items[0];
    expect(item.productSubtype).toBe('night_cream');
    expect(item.productGroup).toBe('skincare');
    expect(item.status).toBe('fresh');
  });

  it('уважает лимит полки и не теряет уже добавленное', async () => {
    const { result } = await renderLoaded();

    await act(async () => {
      for (let i = 0; i < 300; i += 1) {
        result.current.addItem(input({ name: `Товар ${i}` }));
      }
    });
    expect(result.current.items).toHaveLength(300);
    expect(result.current.error).toBe('');

    await act(async () => result.current.addItem(input({ name: 'Лишний' })));

    expect(result.current.items).toHaveLength(300);
    expect(result.current.error).toMatch(/Лимит полки/);
  });
});

describe('useCosmetics — удаление и откат', () => {
  it('удаление помечает надгробием, а не стирает запись', async () => {
    const { result } = await renderLoaded();
    await act(async () => result.current.addItem(input()));
    const id = result.current.items[0].id;

    let removed: unknown;
    await act(async () => {
      removed = result.current.removeItem(id);
    });

    expect(removed).toMatchObject({ id });
    expect(result.current.items).toHaveLength(0);
    // запись остаётся в хранилище с deletedAt — иначе облако не узнает об удалении
    expect(stored()).toHaveLength(1);
    expect(stored()[0].deletedAt).toBeTruthy();
  });

  it('повторное удаление ничего не возвращает', async () => {
    const { result } = await renderLoaded();
    await act(async () => result.current.addItem(input()));
    const id = result.current.items[0].id;

    await act(async () => {
      result.current.removeItem(id);
    });

    let second: unknown = 'не вызывалось';
    await act(async () => {
      second = result.current.removeItem(id);
    });

    expect(second).toBeNull();
  });

  it('удаление несуществующего id возвращает null', async () => {
    const { result } = await renderLoaded();
    expect(result.current.removeItem('нет-такого')).toBeNull();
  });

  it('restoreItem возвращает средство на полку', async () => {
    const { result } = await renderLoaded();
    await act(async () => result.current.addItem(input({ name: 'Вернуть' })));
    const item = result.current.items[0];

    await act(async () => {
      result.current.removeItem(item.id);
    });
    expect(result.current.items).toHaveLength(0);

    await act(async () => result.current.restoreItem(item));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Вернуть');
    expect(result.current.items[0].deletedAt).toBeUndefined();
  });

  it('finalizeDeletion удаляет фото ровно один раз', async () => {
    const { result } = await renderLoaded();
    await act(async () =>
      result.current.addItem(input({ imageUrl: 'https://cdn/фото.jpg' })),
    );
    const item = result.current.items[0];

    await act(async () => result.current.finalizeDeletion(item));

    expect(deleteProductPhoto).toHaveBeenCalledTimes(1);
    expect(deleteProductPhoto).toHaveBeenCalledWith('https://cdn/фото.jpg');
  });
});

describe('useCosmetics — обновление', () => {
  it('старое фото удаляется один раз при замене', async () => {
    const { result } = await renderLoaded();
    await act(async () => result.current.addItem(input({ imageUrl: 'старое.jpg' })));
    const id = result.current.items[0].id;

    await act(async () =>
      result.current.updateItem(id, input({ imageUrl: 'новое.jpg' })),
    );

    expect(deleteProductPhoto).toHaveBeenCalledTimes(1);
    expect(deleteProductPhoto).toHaveBeenCalledWith('старое.jpg');
    expect(result.current.items[0].imageUrl).toBe('новое.jpg');
  });

  it('фото не трогается, если оно не менялось', async () => {
    const { result } = await renderLoaded();
    await act(async () => result.current.addItem(input({ imageUrl: 'то-же.jpg' })));
    const id = result.current.items[0].id;

    await act(async () =>
      result.current.updateItem(id, input({ imageUrl: 'то-же.jpg', name: 'Новое имя' })),
    );

    expect(deleteProductPhoto).not.toHaveBeenCalled();
    expect(result.current.items[0].name).toBe('Новое имя');
  });

  it('пересчитывает статус после смены срока', async () => {
    const { result } = await renderLoaded();
    await act(async () => result.current.addItem(input()));
    const id = result.current.items[0].id;

    const longAgo = new Date(Date.now() - 400 * 86_400_000).toISOString();
    await act(async () =>
      result.current.updateItem(id, input({ openedAt: longAgo })),
    );

    expect(result.current.items[0].status).toBe('expired');
  });

  it('снимает надгробие с восстановленного через updateItem', async () => {
    const { result } = await renderLoaded();
    await act(async () => result.current.addItem(input()));
    const id = result.current.items[0].id;

    await act(async () => {
      result.current.removeItem(id);
    });
    await act(async () => result.current.updateItem(id, input({ name: 'Снова тут' })));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].name).toBe('Снова тут');
  });
});

describe('useCosmetics — статусы синхронизации', () => {
  it('без входа хранение локальное', async () => {
    const { result } = await renderLoaded();
    expect(result.current.syncStatus).toBe('local');
    expect(result.current.syncError).toBe('');
    expect(result.current.isStorageReady).toBe(true);
  });
});
