import type { LookupProductResponse } from '../types';
import { isLikelyCosmetic, namesMatchForBarcode } from './catalog-guard';

export type BarcodeSource = 'scan' | 'manual';
export type BarcodeTrust = 'verified' | 'unverified' | 'suspicious';

export function validateEanChecksum(code: string): boolean {
  const normalized = code.trim();
  if (!/^\d{8}$/.test(normalized) && !/^\d{13}$/.test(normalized)) {
    return false;
  }

  const digits = normalized.split('').map(Number);
  const checkDigit = digits.pop()!;
  const weights = normalized.length === 13 ? [1, 3] : [3, 1];

  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    sum += digits[i]! * weights[i % 2]!;
  }

  return (10 - (sum % 10)) % 10 === checkDigit;
}

function isTrivialBarcode(code: string): boolean {
  return /^(\d)\1+$/.test(code);
}

export function isValidBarcode(value: string): boolean {
  const normalized = value.trim();
  if (!/^\d{8}$|^\d{13}$/.test(normalized)) return false;
  return validateEanChecksum(normalized);
}

export function assessBarcodeTrust(params: {
  barcode: string;
  source: BarcodeSource;
  lookup?: LookupProductResponse;
  savedName?: string;
}): BarcodeTrust {
  const { barcode, source, lookup, savedName } = params;

  if (!validateEanChecksum(barcode) || isTrivialBarcode(barcode)) {
    return 'suspicious';
  }

  if (lookup?.found) {
    const lookupText = `${lookup.name ?? ''} ${lookup.brand ?? ''}`;
    if (!isLikelyCosmetic(lookupText, lookup.categoriesTags)) {
      return 'suspicious';
    }
    if (
      savedName &&
      lookup.name &&
      !namesMatchForBarcode(savedName, lookup.name)
    ) {
      return 'suspicious';
    }
    return 'verified';
  }

  return source === 'scan' ? 'unverified' : 'suspicious';
}

export function mapCameraError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Камера недоступна. Проверьте разрешения в настройках браузера.';
  }

  const name = error.name;
  const message = error.message.toLowerCase();

  if (name === 'NotAllowedError' || message.includes('permission')) {
    return 'Нет доступа к камере. Разрешите использование камеры в настройках браузера.';
  }

  if (name === 'NotFoundError' || message.includes('requested device not found')) {
    return 'Камера не найдена на этом устройстве.';
  }

  if (name === 'NotReadableError' || message.includes('could not start video source')) {
    return 'Камера занята другим приложением. Закройте его и попробуйте снова.';
  }

  if (message.includes('secure context') || message.includes('https')) {
    return 'Камера доступна только по защищённому соединению (HTTPS).';
  }

  return 'Не удалось запустить камеру. Проверьте разрешения и попробуйте снова.';
}

export const SCANNER_ELEMENT_ID = 'barcode-scanner-viewfinder';
