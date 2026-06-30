'use client';

import React, { useEffect, useState } from 'react';
import { X, Camera, ScanLine } from 'lucide-react';

type ScannerProps = {
  onScanSuccess: (code: string) => void;
  onClose: () => void;
};

// Для работы в изолированной среде Canvas мы динамически импортируем библиотеку,
// чтобы избежать ошибок сборки при отсутствии пакета в окружении.
export default function Scanner({ onScanSuccess, onClose }: ScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hint, setHint] = useState('Наведите камеру на штрих-код');

  const isValidBarcode = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return false;
    if (/^\d{8,13}$/.test(normalized)) return true;
    return false;
  };

  useEffect(() => {
    let scanner: any = null;

    const initScanner = async () => {
      try {
        // Динамический импорт для обхода ошибки сборки
        const { Html5QrcodeScanner } = await import('html5-qrcode');
        
        await navigator.mediaDevices.getUserMedia({ video: true });
        
        scanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 150 } },
          false
        );

        scanner.render(
          (decodedText: string) => {
            if (!isValidBarcode(decodedText)) {
              setHint('Сканирован не EAN/UPC. Попробуйте ещё раз.');
              return;
            }

            scanner.clear();
            onScanSuccess(decodedText.trim());
          },
          (err: string) => {
            if (err && typeof err === 'string' && !err.includes('No QR code')) {
              setHint('Проверьте освещение и положение штрих-кода');
            }
          }
        );
        setIsReady(true);
      } catch (err) {
        setError("Камера недоступна. Проверь разрешения в настройках браузера.");
      }
    };

    initScanner();

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-[32px] p-4 relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full z-10"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-600">
          <ScanLine className="w-4 h-4 text-[#2E3CFF]" />
          Сканер штрих-кодов
        </div>

        {error ? (
          <div className="p-8 text-center text-red-500 font-bold">
            <Camera className="w-12 h-12 mx-auto mb-4" />
            {error}
            <button 
              onClick={onClose}
              className="mt-6 w-full bg-slate-800 text-white py-3 rounded-xl"
            >
              Ввести вручную
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-[24px] overflow-hidden border border-slate-200">
              <div id="reader" className="min-h-[280px]" />
            </div>
            <div className="rounded-[20px] bg-[#FDFBF7] p-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>{hint}</span>
                <span className={`text-xs font-bold ${isReady ? 'text-emerald-600' : 'text-slate-400'}`}>
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