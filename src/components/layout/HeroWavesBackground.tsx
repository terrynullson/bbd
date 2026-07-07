'use client';

export function HeroWavesBackground() {
  return (
    <div className="warm-hero absolute inset-0 overflow-hidden" aria-hidden>
      <div className="warm-hero-base absolute inset-0" />

      <div className="warm-hero-orb warm-hero-orb--accent" />
      <div className="warm-hero-orb warm-hero-orb--warm" />
      <div className="warm-hero-orb warm-hero-orb--fresh" />

      <div className="warm-hero-vignette absolute inset-0" />
      <div className="warm-hero-fade absolute inset-x-0 bottom-0" />
    </div>
  );
}
