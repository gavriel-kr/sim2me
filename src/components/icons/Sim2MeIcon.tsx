'use client';

/**
 * Sim2Me brand icon: antenna/signal waves in a circle (green circle + arcs).
 * Used for patterns, reflections, and watermarks.
 */
export function Sim2MeIcon({
  className,
  size = 24,
  variant = 'default',
}: {
  className?: string;
  size?: number;
  /** default = full icon; waves-only = just the arcs for patterns */
  variant?: 'default' | 'waves-only';
}) {
  const s = size;
  const viewBox = variant === 'waves-only' ? '0 0 24 24' : '0 0 32 32';
  const stroke = variant === 'waves-only' ? 'currentColor' : '#10b981';
  const strokeWidth = variant === 'waves-only' ? 1.2 : 1.5;

  if (variant === 'waves-only') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        width={s}
        height={s}
        aria-hidden
      >
        {/* Antenna dot */}
        <circle cx="6" cy="12" r="1.5" fill="currentColor" />
        {/* Three signal arcs */}
        <path d="M8 12a4 4 0 0 1 4-4" opacity={0.9} />
        <path d="M8 12a8 8 0 0 1 8-8" opacity={0.6} />
        <path d="M8 12a12 12 0 0 1 12-12" opacity={0.35} />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      width={s}
      height={s}
      aria-hidden
    >
      <circle cx="16" cy="16" r="15" stroke={stroke} strokeWidth={strokeWidth} fill="none" />
      <circle cx="10" cy="16" r="2" fill={stroke} />
      <path
        d="M13 16a6 6 0 0 1 6-6"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={0.9}
      />
      <path
        d="M13 16a12 12 0 0 1 12-12"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={0.6}
      />
      <path
        d="M13 16a18 18 0 0 1 18-18"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={0.35}
      />
    </svg>
  );
}
