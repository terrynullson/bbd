'use client';

import { Camera } from 'lucide-react';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { BarcodeScanner } from './BarcodeScanner';
import { PaoSelector } from './PaoSelector';
import { SmartFillButton } from './SmartFillButton';
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
      <Modal title="Новый продукт" onClose={onClose}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block pl-1 text-sm font-medium text-muted">
              Бренд
            </label>
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
            <label className="mb-2 block pl-1 text-sm font-medium text-muted">
              Название продукта
            </label>
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

          <div className="rounded-button border border-border bg-bg p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-text">Умное заполнение</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Исправит опечатки, нормализует бренд и дополнит название на
                  основе уже введённых полей.
                </p>
              </div>
              <SmartFillButton
                onClick={form.handleSmartFill}
                disabled={!form.canSmartFill}
                loading={form.isSmartLoading}
              />
            </div>
            {form.smartError && (
              <p className="mt-3 text-sm text-expired">{form.smartError}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block pl-1 text-sm font-medium text-muted">
              Штрих-код
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="4600..."
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
          </div>

          <div>
            <label className="mb-2 block pl-1 text-sm font-medium text-muted">
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
            <label className="mb-2 block pl-1 text-sm font-medium text-muted">
              Срок после вскрытия (PAO)
            </label>
            <PaoSelector value={form.paoMonths} onChange={form.setPaoMonths} />
          </div>

          <Button type="submit" size="lg" className="mt-2 w-full">
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
