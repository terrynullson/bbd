import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { NotificationsSheet } from './NotificationsSheet';
import type { Reminder } from '../lib/reminders';

const reminders: Reminder[] = [
  {
    id: 'a:expired',
    itemId: 'a',
    name: 'Мицеллярная вода',
    kind: 'expired',
    daysLeft: -10,
    message: 'Срок вышел 10 дней назад — лучше заменить',
  },
  {
    id: 'b:expiring',
    itemId: 'b',
    name: 'Ночная маска',
    kind: 'expiring',
    daysLeft: 7,
    message: 'Истекает через 7 дней',
  },
];

describe('NotificationsSheet', () => {
  it('пустой список — «всё под контролем»', () => {
    render(
      <NotificationsSheet reminders={[]} onClose={() => {}} onOpenItem={() => {}} />,
    );
    expect(screen.getByText(/Всё под контролем/)).toBeDefined();
  });

  it('показывает напоминания с текстом', () => {
    render(
      <NotificationsSheet
        reminders={reminders}
        onClose={() => {}}
        onOpenItem={() => {}}
      />,
    );
    expect(screen.getByText('Мицеллярная вода')).toBeDefined();
    expect(screen.getByText('Истекает через 7 дней')).toBeDefined();
  });

  it('тап по напоминанию отдаёт itemId', () => {
    const onOpenItem = vi.fn();
    render(
      <NotificationsSheet
        reminders={reminders}
        onClose={() => {}}
        onOpenItem={onOpenItem}
      />,
    );
    fireEvent.click(screen.getByText('Мицеллярная вода'));
    expect(onOpenItem).toHaveBeenCalledWith('a');
  });
});
