/**
 * Globe + emerald wave arcs — same visual as on plan cards (PlanCard).
 * Uses /public/globe-icon.png + animated stroke arcs (#10b981).
 */
const WAVE_ARCS = [
  { d: 'M93.1,69.4 A18,18 0 0,1 106.9,69.4', sw: 5.5, delay: '0s' },
  { d: 'M83,56.6 A34,34 0 0,1 117,56.6', sw: 5.0, delay: '0.5s' },
  { d: 'M69.6,46.3 A50,50 0 0,1 130.4,46.3', sw: 4.5, delay: '1s' },
] as const;

export function BrandGlobeWaves({ className }: { className?: string }) {
  return (
    <div className={className ?? 'flex h-full w-full items-center justify-center'} aria-hidden>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 96" className="h-full w-full">
        <image href="/globe-icon.png" x="89" y="75" width="22" height="22" />
        {WAVE_ARCS.map(({ d, sw, delay }, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="#10b981"
            strokeWidth={sw}
            strokeLinecap="round"
            opacity="0"
          >
            <animate
              attributeName="opacity"
              values="0;0.32;0"
              dur="2.4s"
              begin={delay}
              repeatCount="indefinite"
            />
          </path>
        ))}
      </svg>
    </div>
  );
}
