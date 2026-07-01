'use client';

import { Camera, ScanLine, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

type BarcodeScannerProps = {
  onScanSuccess: (code: string) => void;
  onClose: () => void;
};

function isValidBarcode(value: string): boolean {
  const normalized = value.trim();
  return /^\d{8,13}$/.test(normalized);
}

export function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hint, setHint] = useState('Наведите камеру на штрих-код');

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanner: any = null;

    const initScanner = async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');
        await navigator.mediaDevices.getUserMedia({ video: true });

        scanner = new Html5QrcodeScanner(
          'barcode-reader',
          { fps: 10, qrbox: { width: 250, height: 150 } },
          false,
        );

        scanner.render(
          (decodedText: string) => {
            if (!isValidBarcode(decodedText)) {
              setHint('Сканирован не EAN/UPC. Попробуйте ещё раз.');
              return;
            }

            scanner?.clear();
            onScanSuccess(decodedText.trim());
          },
          (err: string) => {
            if (err && !err.includes('No QR code')) {
              setHint('Проверьте освещение и положение штрих-кода');
            }
          },
        );

        setIsReady(true);
      } catch {
        setError('Камера недоступна. Проверьте разрешения в настройках браузера.');
      }
    };

    initScanner();

    return () => {
      scanner?.clear().catch(console.error);
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-card border border-border bg-surface p-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-3 top-3 z-10"
          aria-label="Закрыть сканер"
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted">
          <ScanLine className="h-4 w-4 text-accent" />
          Сканер штрих-кодов
        </div>

        {error ? (
          <div className="p-6 text-center">
            <Camera className="mx-auto mb-4 h-10 w-10 text-expired" />
            <p className="text-sm font-medium text-expired">{error}</p>
            <Button variant="secondary" className="mt-6 w-full" onClick={onClose}>
              Ввести вручную
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-button border border-border">
              <div id="barcode-reader" className="min-h-[280px]" />
            </div>
            <div className="rounded-button bg-bg p-3 text-sm text-muted">
              <div className="flex items-center justify-between gap-3">
                <span>{hint}</span>
                <span
                  className={`shrink-0 text-xs font-medium ${isReady ? 'text-fresh' : 'text-muted'}`}
                >
                  {isReady ? 'Готово' : 'Инициализация...'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
