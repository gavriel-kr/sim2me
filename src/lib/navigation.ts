import { prisma } from '@/lib/prisma';
import type { SiteSetting } from '@prisma/client';

export const NAV_KEYS = {
  navMenu: 'nav_menu',
  footerProduct: 'footer_product',
  footerCompany: 'footer_company',
  footerLegal: 'footer_legal',
  footerGuides: 'footer_guides',
} as const;

export type NavLink = { href: string; key: string; label?: string };

export type NavigationConfig = {
  navMenu: NavLink[] | null;
  footer: {
    product: NavLink[] | null;
    company: NavLink[] | null;
    legal: NavLink[] | null;
    guides: NavLink[] | null;
  };
};

const DEFAULT_NAV_MENU: NavLink[] = [
  { href: '/', key: 'home' },
  { href: '/destinations', key: 'destinations' },
  { href: '/app', key: 'app' },
  { href: '/how-it-works', key: 'howItWorks' },
  { href: '/compatible-devices', key: 'devices' },
  { href: '/help', key: 'help' },
  { href: '/contact', key: 'contact' },
];

const DEFAULT_FOOTER_PRODUCT: NavLink[] = [
  { href: '/destinations', key: 'destinations' },
  { href: '/app', key: 'app' },
  { href: '/how-it-works', key: 'howItWorks' },
  { href: '/compatible-devices', key: 'devices' },
];

const DEFAULT_FOOTER_COMPANY: NavLink[] = [
  { href: '/about', key: 'about' },
  { href: '/contact', key: 'contact' },
  { href: '/help', key: 'help' },
];

const DEFAULT_FOOTER_LEGAL: NavLink[] = [
  { href: '/terms', key: 'terms' },
  { href: '/privacy', key: 'privacy' },
  { href: '/refund', key: 'refund' },
  { href: '/accessibility-statement', key: 'accessibilityStatement' },
];

const DEFAULT_FOOTER_GUIDES: NavLink[] = [
  { href: '/articles', key: 'guidesAll' },
  { href: '/articles/esim-europe-guide', key: 'guidesEurope' },
  { href: '/articles/how-does-esim-work', key: 'guidesHowTo' },
  { href: '/articles/esim-vs-physical-sim-vs-roaming', key: 'guidesVsRoaming' },
];

function parseJsonArray<T>(raw: string | undefined): T[] | null {
  if (!raw?.trim()) return null;
  try {
    const arr = JSON.parse(raw) as unknown;
    return Array.isArray(arr) ? arr : null;
  } catch {
    return null;
  }
}

/** Get navigation config from DB. Returns null for sections that have no override. */
export async function getNavigationConfig(): Promise<NavigationConfig> {
  const settings = await prisma.siteSetting.findMany({
    where: {
      key: {
        in: [
          NAV_KEYS.navMenu,
          NAV_KEYS.footerProduct,
          NAV_KEYS.footerCompany,
          NAV_KEYS.footerLegal,
          NAV_KEYS.footerGuides,
        ],
      },
    },
  });
  const map = Object.fromEntries(settings.map((s: SiteSetting) => [s.key, s.value]));

  const navMenu = parseJsonArray<NavLink>(map[NAV_KEYS.navMenu]);
  const footerProduct = parseJsonArray<NavLink>(map[NAV_KEYS.footerProduct]);
  const footerCompany = parseJsonArray<NavLink>(map[NAV_KEYS.footerCompany]);
  const footerLegal = parseJsonArray<NavLink>(map[NAV_KEYS.footerLegal]);
  const footerGuides = parseJsonArray<NavLink>(map[NAV_KEYS.footerGuides]);

  return {
    navMenu,
    footer: {
      product: footerProduct,
      company: footerCompany,
      legal: footerLegal,
      guides: footerGuides,
    },
  };
}

export const DEFAULT_NAVIGATION: NavigationConfig = {
  navMenu: DEFAULT_NAV_MENU,
  footer: {
    product: DEFAULT_FOOTER_PRODUCT,
    company: DEFAULT_FOOTER_COMPANY,
    legal: DEFAULT_FOOTER_LEGAL,
    guides: DEFAULT_FOOTER_GUIDES,
  },
};
