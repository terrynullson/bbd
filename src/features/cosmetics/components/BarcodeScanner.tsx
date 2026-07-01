'use client';

import { Camera, Flashlight, FlashlightOff, ScanLine, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  isValidBarcode,
  mapCameraError,
  SCANNER_ELEMENT_ID,
} from '../lib/barcode';

type BarcodeScannerProps = {
  onScanSuccess: (code: string) => void;
  onClose: () => void;
};

type ScannerPhase = 'permission' | 'starting' | 'scanning' | 'error';

type ScannerInstance = {
  start: (
    cameraIdOrConfig: string | MediaTrackConstraints,
    configuration: Record<string, unknown>,
    onSuccess: (decodedText: string) => void,
    onError: (errorMessage: string) => void,
  ) => Promise<unknown>;
  stop: () => Promise<void>;
  clear: () => void;
  isScanning: boolean;
  getRunningTrackCapabilities: () => MediaTrackCapabilities;
  applyVideoConstraints: (
    constraints: MediaTrackConstraints,
  ) => Promise<void>;
};

async function loadScannerModule() {
  const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import(
    'html5-qrcode'
  );

  return {
    Html5Qrcode,
    formats: [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.CODE_128,
    ],
  };
}

async function getPreferredCamera(
  getCameras: () => Promise<Array<{ id: string; label: string }>>,
): Promise<string | MediaTrackConstraints> {
  try {
    const cameras = await getCameras();
    if (cameras.length === 0) {
      return { facingMode: { ideal: 'environment' } };
    }

    const backCamera = cameras.find((camera) =>
      /back|rear|environment|задн|тыл/i.test(camera.label),
    );

    if (backCamera) return backCamera.id;

    return (
      cameras[cameras.length - 1]?.id ?? { facingMode: { ideal: 'environment' } }
    );
  } catch {
    return { facingMode: { ideal: 'environment' } };
  }
}

async function stopScanner(scanner: ScannerInstance | null) {
  if (!scanner) return;

  try {
    if (scanner.isScanning) {
      await scanner.stop();
    }
    scanner.clear();
  } catch {
    // Камера уже освобождена.
  }
}

export function BarcodeScanner({ onScanSuccess, onClose }: BarcodeScannerProps) {
  const scannerRef = useRef<ScannerInstance | null>(null);
  const handledRef = useRef(false);
  const onSuccessRef = useRef(onScanSuccess);

  const [phase, setPhase] = useState<ScannerPhase>('permission');
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState('Наведите камеру на штрих-код упаковки');
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    onSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  const handleClose = useCallback(async () => {
    await stopScanner(scannerRef.current);
    scannerRef.current = null;
    onClose();
  }, [onClose]);

  const toggleTorch = useCallback(async () => {
    const scanner = scannerRef.current;
    if (!scanner || !torchSupported) return;

    const next = !torchOn;

    try {
      await scanner.applyVideoConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      });
      setTorchOn(next);
    } catch {
      setHint('Не удалось переключить вспышку на этом устройстве.');
    }
  }, [torchOn, torchSupported]);

  const startScanner = useCallback(async () => {
    setPhase('starting');
    setError(null);
    handledRef.current = false;

    try {
      if (typeof window !== 'undefined' && !window.isSecureContext) {
        throw new Error('Camera requires secure context');
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera API is not supported');
      }

      await stopScanner(scannerRef.current);
      scannerRef.current = null;

      const { Html5Qrcode, formats } = await loadScannerModule();

      const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
        formatsToSupport: formats,
        useBarCodeDetectorIfSupported: true,
        verbose: false,
      }) as unknown as ScannerInstance;

      scannerRef.current = scanner;

      const cameraConfig = await getPreferredCamera(() =>
        Html5Qrcode.getCameras(),
      );

      await scanner.start(
        cameraConfig,
        {
          fps: 12,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const width = Math.min(Math.floor(viewfinderWidth * 0.88), 340);
            const height = Math.min(
              Math.floor(width * 0.55),
              Math.floor(viewfinderHeight * 0.5),
            );
            return { width, height: Math.max(height, 90) };
          },
          aspectRatio: 1.777778,
          disableFlip: false,
          videoConstraints: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        },
        (decodedText) => {
          if (handledRef.current) return;

          if (!isValidBarcode(decodedText)) {
            setHint('Код не распознан как EAN/UPC. Поднесите штрих-код ближе.');
            return;
          }

          handledRef.current = true;
          void stopScanner(scannerRef.current).finally(() => {
            scannerRef.current = null;
            onSuccessRef.current(decodedText.trim());
          });
        },
        () => {
          // Промахи на каждом кадре — норма.
        },
      );

      const capabilities = scanner.getRunningTrackCapabilities();
      setTorchSupported('torch' in capabilities);
      setPhase('scanning');
    } catch (err) {
      setError(mapCameraError(err));
      setPhase('error');
    }
  }, []);

  useEffect(() => {
    return () => {
      void stopScanner(scannerRef.current);
      scannerRef.current = null;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-[20px] bg-surface p-5 shadow-[var(--shadow-modal)]">
        <div className="absolute right-3 top-3 z-20 flex items-center gap-1">
          {torchSupported && phase === 'scanning' && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => void toggleTorch()}
              aria-label={torchOn ? 'Выключить вспышку' : 'Включить вспышку'}
              className="h-9 w-9"
            >
              {torchOn ? (
                <FlashlightOff className="h-4 w-4" />
              ) : (
                <Flashlight className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => void handleClose()}
            aria-label="Закрыть сканер"
            className="h-9 w-9"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4 flex items-center gap-2 pr-20 text-sm font-medium text-muted">
          <ScanLine className="h-4 w-4 text-accent" />
          Сканер штрих-кодов
        </div>

        {phase === 'permission' && (
          <div className="space-y-5 p-2 text-center">
            <div className="mx-auto flex h-44 w-full max-w-[220px] items-center justify-center rounded-[14px] border-2 border-dashed border-border bg-bg">
              <Camera className="h-10 w-10 text-muted" />
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-text">
                Включить камеру
              </p>
              <p className="mt-1 text-sm text-muted">
                Нужен доступ к камере для сканирования штрих-кода
              </p>
            </div>
            <Button
              size="lg"
              className="w-full rounded-[14px]"
              onClick={() => void startScanner()}
            >
              Разрешить
            </Button>
          </div>
        )}

        {phase === 'error' && error && (
          <div className="space-y-4 p-4 text-center">
            <Camera className="mx-auto h-10 w-10 text-expired" />
            <p className="text-sm font-medium text-expired">{error}</p>
            <Button size="lg" className="w-full" onClick={() => void startScanner()}>
              Попробовать снова
            </Button>
            <Button variant="secondary" className="w-full" onClick={() => void handleClose()}>
              Ввести вручную
            </Button>
          </div>
        )}

        {(phase === 'starting' || phase === 'scanning') && (
          <div className="space-y-3">
            <div className="scanner-shell overflow-hidden rounded-button border border-border bg-black">
              <div id={SCANNER_ELEMENT_ID} className="scanner-viewfinder" />
            </div>
            <div className="rounded-button bg-bg p-3 text-sm text-muted">
              <div className="flex items-center justify-between gap-3">
                <span>{hint}</span>
                <span
                  className={`shrink-0 text-xs font-medium ${
                    phase === 'scanning' ? 'text-fresh' : 'text-muted'
                  }`}
                >
                  {phase === 'scanning' ? 'Сканирование' : 'Запуск...'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
