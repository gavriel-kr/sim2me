import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'he', 'ar'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
  pathnames: {
    '/': '/',
    '/destinations': '/destinations',
    '/destinations/[slug]': '/destinations/[slug]',
    '/how-it-works': '/how-it-works',
    '/compatible-devices': '/compatible-devices',
    '/help': '/help',
    '/about': '/about',
    '/contact': '/contact',
    '/terms': '/terms',
    '/privacy': '/privacy',
    '/refund': '/refund',
    '/checkout': '/checkout',
    '/account': '/account',
    '/account/orders': '/account/orders',
    '/account/esims': '/account/esims',
    '/account/profile': '/account/profile',
  },
});
