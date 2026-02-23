/**
 * White-label configuration.
 * Change these values to rebrand the entire site.
 */

export const brandConfig = {
  /** Display name of the eSIM brand */
  name: 'Sim2Me',
  /** Short tagline used in hero and meta */
  tagline: 'Stay connected worldwide',
  /** Logo: use path to image in /public or leave null for text logo */
  logoUrl: '/logo.svg' as string | null,
  /** Fallback text when logo is not available */
  logoAlt: 'Sim2Me',

  /** Primary brand color (hex). Airalo-style green */
  primaryColor: '#0d9f6e',
  /** Secondary color for subtle accents */
  secondaryColor: '#10b981',

  /** Support email shown in footer and help */
  supportEmail: 'info.sim2me@gmail.com',
  /** Optional phone (e.g. for RTL regions) */
  supportPhone: null as string | null,

  /** Social links (null = hide) */
  social: {
    twitter: 'https://twitter.com/sim2me' as string | null,
    facebook: 'https://facebook.com/sim2me' as string | null,
    instagram: 'https://instagram.com/sim2me' as string | null,
    linkedin: null as string | null,
  },

  /** Default locale when no preference is set */
  defaultLocale: 'en' as 'en' | 'he' | 'ar',

  /** Sticky help: 'whatsapp' | 'email' | 'both' */
  helpButton: 'whatsapp' as 'whatsapp' | 'email' | 'both',
  /** WhatsApp number with country code, no + (e.g. 972501234567) */
  whatsappNumber: '972501234567',
  /** Pre-filled message for WhatsApp */
  whatsappMessage: 'Hi, I need help choosing an eSIM',

  /** App store links for "Coming soon" section */
  appStoreComingSoon: true,

  /** Trust: number of destinations to show in marketing */
  destinationsCount: '200+',
  /** Optional rating (e.g. "4.8") */
  rating: '4.8' as string | null,
  /** Optional review count */
  reviewCount: '12,000+' as string | null,
} as const;

export type BrandConfig = typeof brandConfig;
