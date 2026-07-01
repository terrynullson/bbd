export const STORAGE_KEY = 'gde-moy-krem-data';
export const THEME_STORAGE_KEY = 'gde-moy-krem-theme';
export const INSTALL_DISMISS_KEY = 'gde-moy-krem-install-dismissed';

export const PAO_OPTIONS = [3, 6, 12, 24] as const;

export const STATUS_ORDER = {
  expired: 1,
  expiring: 2,
  fresh: 3,
} as const;

export const EXPIRING_THRESHOLD_DAYS = 30;

export const APP_NAME = 'Где Мой Крем?';
export const APP_DESCRIPTION =
  'Умный трекер сроков годности косметики после вскрытия';
export const APP_VERSION = '2.2.2';
