'use client';

import React, { useEffect, useState } from 'react';
import { X, Camera } from 'lucide-react';

type ScannerProps = {
  onScanSuccess: (code: string) => void;
  onClose: () => void;
};

// Для работы в изолированной среде Canvas мы динамически импортируем библиотеку,
// чтобы избежать ошибок сборки при отсутствии пакета в окружении.
export default function Scanner({ onScanSuccess, onClose }: ScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

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
            scanner.clear();
            onScanSuccess(decodedText);
          },
          (err: string) => {}
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
          <div id="reader" className="overflow-hidden rounded-[24px]"></div>
        )}
      </div>
    </div>
  );
}