'use client';

import { useEffect, useState } from 'react';

function PillAnimate({
  values,
  dur,
  reduceMotion,
}: {
  values: string;
  dur: string;
  reduceMotion: boolean;
}) {
  if (reduceMotion) return null;

  return (
    <animate
      attributeName="y"
      values={values}
      dur={dur}
      repeatCount="indefinite"
    />
  );
}

export function HeroWavesBackground() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduceMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden>
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1000 300"
        preserveAspectRatio="xMidYMid slice"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="hero-soft-blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        <rect width="100%" height="100%" fill="var(--hero-overscroll)" />

        <g fill="var(--hero-pills)" filter="url(#hero-soft-blur)">
          <rect x="40" y="-50" width="110" height="280" rx="55">
            <PillAnimate
              values="-50; 20; -50"
              dur="6s"
              reduceMotion={reduceMotion}
            />
          </rect>

          <rect x="210" y="70" width="110" height="240" rx="55">
            <PillAnimate
              values="70; 10; 70"
              dur="7.5s"
              reduceMotion={reduceMotion}
            />
          </rect>

          <rect x="380" y="-20" width="110" height="320" rx="55">
            <PillAnimate
              values="-20; -80; -20"
              dur="5s"
              reduceMotion={reduceMotion}
            />
          </rect>

          <rect x="550" y="60" width="110" height="260" rx="55">
            <PillAnimate
              values="60; -10; 60"
              dur="10s"
              reduceMotion={reduceMotion}
            />
          </rect>

          <rect x="720" y="-30" width="110" height="290" rx="55">
            <PillAnimate
              values="-30; 40; -30"
              dur="15s"
              reduceMotion={reduceMotion}
            />
          </rect>

          <rect x="890" y="40" width="110" height="250" rx="55">
            <PillAnimate
              values="40; -20; 40"
              dur="6s"
              reduceMotion={reduceMotion}
            />
          </rect>
        </g>
      </svg>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/25 to-transparent" />
    </div>
  );
}
