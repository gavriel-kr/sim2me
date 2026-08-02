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

/*
  Must stay identical to `defaultNavLinks` in `components/layout/Header.tsx`.

  Ticket 031. The two had drifted: the Header rendered six entries and this list, which is what the
  admin navigation screen loads and saves, had five — missing the calculator. Since no `nav_menu`
  row exists yet, visitors were getting the Header's six, and the first time anyone opened that
  screen and pressed save, the shorter list would have been written to the database and the
  calculator would have vanished from the site with nothing to show it had ever been there.
*/
const DEFAULT_NAV_MENU: NavLink[] = [
  { href: '/', key: 'home' },
  { href: '/destinations', key: 'destinations' },
  { href: '/how-it-works', key: 'howItWorks' },
  { href: '/data-calculator', key: 'calculator' },
  { href: '/help', key: 'help' },
  { href: '/contact', key: 'contact' },
];

const DEFAULT_FOOTER_PRODUCT: NavLink[] = [
  { href: '/destinations', key: 'destinations' },
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

/** Strip retired app-marketing links from DB-stored nav overrides. */
function withoutAppPromoLinks(links: NavLink[] | null): NavLink[] | null {
  if (!links) return null;
  const filtered = links.filter((l) => {
    const href = (l.href || '').trim().replace(/\/$/, '');
    if (l.key === 'app') return false;
    if (href === '/app') return false;
    return true;
  });
  return filtered;
}

/** Compatible-devices stays in footer; strip from header/nav menu only. */
function withoutDevicesFromHeader(links: NavLink[] | null): NavLink[] | null {
  if (!links) return null;
  return links.filter((l) => {
    const href = (l.href || '').trim().replace(/\/$/, '');
    if (l.key === 'devices') return false;
    if (href === '/compatible-devices') return false;
    return true;
  });
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
    navMenu: withoutDevicesFromHeader(withoutAppPromoLinks(navMenu)),
    footer: {
      product: withoutAppPromoLinks(footerProduct),
      company: withoutAppPromoLinks(footerCompany),
      legal: withoutAppPromoLinks(footerLegal),
      guides: withoutAppPromoLinks(footerGuides),
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
