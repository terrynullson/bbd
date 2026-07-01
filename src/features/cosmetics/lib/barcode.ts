export function isValidBarcode(value: string): boolean {
  const normalized = value.trim();
  return /^\d{8,13}$/.test(normalized);
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
