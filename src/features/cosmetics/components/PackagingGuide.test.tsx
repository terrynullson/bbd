import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PackagingGuide } from './PackagingGuide';

describe('PackagingGuide', () => {
  it('«?» открывает лист со справкой', () => {
    render(<PackagingGuide />);
    expect(screen.queryByText(/Значок открытой баночки/)).toBeNull();

    fireEvent.click(screen.getByLabelText('Как читать упаковку'));
    expect(screen.getByText(/Значок открытой баночки/)).toBeDefined();
    expect(screen.getByText(/наименьшему из двух/)).toBeDefined();
  });

  it('вариант «row» — строка с текстом', () => {
    render(<PackagingGuide variant="row" />);
    expect(screen.getByText('Как читать упаковку')).toBeDefined();
  });
});
