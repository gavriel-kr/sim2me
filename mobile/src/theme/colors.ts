/**
 * Sim2Me brand colors — Airalo-inspired palette
 */
export const colors = {
  // Brand
  primary: '#0d9f6e',
  primaryLight: '#10b981',
  primaryDark: '#059669',
  primaryBg: '#ecfdf5',

  // Neutrals
  white: '#ffffff',
  background: '#f8fafc',
  surface: '#ffffff',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',

  // Text
  text: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  textInverse: '#ffffff',

  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Gradients (start, end)
  gradientPrimary: ['#10b981', '#059669'] as [string, string],
  gradientDark: ['#1e293b', '#0f172a'] as [string, string],
  gradientHero: ['#ecfdf5', '#f0fdf4'] as [string, string],

  // Shadows
  shadowColor: '#0f172a',
} as const;
