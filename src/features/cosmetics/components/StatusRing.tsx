import type { ReactNode } from 'react';
import type { CosmeticStatus } from '../types';

const STATUS_COLOR: Record<CosmeticStatus, string> = {
  fresh: 'var(--fresh)',
  expiring: 'var(--expiring)',
  expired: 'var(--expired)',
};

type StatusRingProps = {
  /** Доля прожитого срока, 0–100. */
  progress: number;
  status: CosmeticStatus;
  /** Содержимое в центре кольца. */
  children: ReactNode;
  /** Срок не определён — рисуем только дорожку. */
  muted?: boolean;
  size?: number;
  strokeWidth?: number;
  radius?: number;
};

export function StatusRing({
  progress,
  status,
  children,
  muted = false,
  size = 48,
  strokeWidth = 3.5,
  radius = 20,
}: StatusRingProps) {
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, progress));
  const dashoffset = (circumference * clamped) / 100;
  const color = muted ? 'var(--muted)' : STATUS_COLOR[status];
  const center = size / 2;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size, color }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={strokeWidth}
        />
        {!muted && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference.toFixed(2)}
            strokeDashoffset={dashoffset.toFixed(2)}
            transform={`rotate(-90 ${center} ${center})`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}
