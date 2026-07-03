type HapticStyle = 'light' | 'medium' | 'success' | 'error';

const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 8,
  medium: 16,
  success: [10, 40, 12],
  error: [20, 60, 20, 60, 20],
};

export function haptic(style: HapticStyle = 'light') {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') {
    return;
  }

  navigator.vibrate(PATTERNS[style]);
}
