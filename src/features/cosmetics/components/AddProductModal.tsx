'use client';

import { Camera, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BarcodeScanner } from './BarcodeScanner';
import { PaoSelector } from './PaoSelector';
import { useAddProductForm } from '../hooks/useAddProductForm';
import type { AddProductInput } from '../types';

type AddProductModalProps = {
  onClose: () => void;
  onSubmit: (input: AddProductInput) => void;
};

export function AddProductModal({ onClose, onSubmit }: AddProductModalProps) {
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const form = useAddProductForm();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const input = form.buildInput();
    if (!input) return;

    onSubmit(input);
    form.reset();
    onClose();
  };

  return (
    <>
      <Modal onClose={onClose}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            placeholder="Бренд"
            value={form.brand}
            onChange={(e) => {
              form.setBrand(e.target.value);
              if (form.smartError) form.setSmartError('');
            }}
          />

          <Input
            required
            placeholder="Название продукта"
            value={form.name}
            onChange={(e) => {
              form.setName(e.target.value);
              if (form.smartError) form.setSmartError('');
            }}
          />

          <div className="rounded-[14px] bg-bg p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-accent shadow-[var(--shadow-card)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text">Умное заполнение</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Исправит опечатки и дополнит поля на основе введённых данных.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={form.handleSmartFill}
                disabled={!form.canSmartFill || form.isSmartLoading}
                className="shrink-0"
              >
                {form.isSmartLoading ? '...' : 'Заполнить'}
              </Button>
            </div>
            {form.smartError && (
              <p className="mt-3 text-sm text-expired">{form.smartError}</p>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Штрих-код"
              value={form.barcode}
              onChange={(e) => form.setBarcode(e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => setIsScannerOpen(true)}
              aria-label="Сканировать штрих-код"
            >
              <Camera className="h-4 w-4" />
            </Button>
          </div>

          <div>
            <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-muted">
              Дата вскрытия
            </label>
            <Input
              type="date"
              value={form.openedAt}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => form.setOpenedAt(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-3 block text-xs font-medium uppercase tracking-[0.12em] text-muted">
              Срок после вскрытия
            </label>
            <PaoSelector value={form.paoMonths} onChange={form.setPaoMonths} />
          </div>

          <Button type="submit" size="lg" className="mt-1 w-full rounded-[14px]">
            Сохранить
          </Button>
        </form>
      </Modal>

      {isScannerOpen && (
        <BarcodeScanner
          onClose={() => setIsScannerOpen(false)}
          onScanSuccess={(code) => {
            form.setBarcode(code);
            setIsScannerOpen(false);
          }}
        />
      )}
    </>
  );
}
