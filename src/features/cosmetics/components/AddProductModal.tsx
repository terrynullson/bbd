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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
      {children}
    </label>
  );
}

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
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <FieldLabel>Бренд</FieldLabel>
            <Input
              placeholder="Например, CeraVe"
              value={form.brand}
              onChange={(e) => {
                form.setBrand(e.target.value);
                if (form.smartError) form.setSmartError('');
              }}
            />
          </div>

          <div>
            <FieldLabel>Название продукта</FieldLabel>
            <Input
              required
              placeholder="Увлажняющий крем"
              value={form.name}
              onChange={(e) => {
                form.setName(e.target.value);
                if (form.smartError) form.setSmartError('');
              }}
            />
          </div>

          <div className="rounded-[16px] bg-bg p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface text-accent shadow-[var(--shadow-card)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text">Умное заполнение</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Исправит опечатки и дополнит поля.
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="mt-3 h-11 w-full"
              onClick={form.handleSmartFill}
              disabled={!form.canSmartFill || form.isSmartLoading}
            >
              {form.isSmartLoading ? 'Заполняем...' : 'Заполнить'}
            </Button>
            {form.smartError && (
              <p className="mt-2 text-sm text-expired">{form.smartError}</p>
            )}
          </div>

          <div>
            <FieldLabel>Штрих-код</FieldLabel>
            <div className="flex items-stretch gap-2">
              <Input
                placeholder="4600..."
                value={form.barcode}
                onChange={(e) => form.setBarcode(e.target.value)}
                className="min-w-0 flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsScannerOpen(true)}
                aria-label="Сканировать штрих-код"
                className="h-12 w-12 shrink-0 rounded-[14px] p-0"
              >
                <Camera className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div>
            <FieldLabel>Дата вскрытия</FieldLabel>
            <Input
              type="date"
              value={form.openedAt}
              max={new Date().toISOString().slice(0, 10)}
              onChange={(e) => form.setOpenedAt(e.target.value)}
            />
          </div>

          <div>
            <FieldLabel>Срок после вскрытия</FieldLabel>
            <PaoSelector value={form.paoMonths} onChange={form.setPaoMonths} />
          </div>

          <Button type="submit" size="lg" className="mt-1 h-12 w-full rounded-[14px]">
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
