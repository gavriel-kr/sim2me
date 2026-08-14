import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

type Locale = (typeof routing.locales)[number];

const LOCALE_COOKIE = 'NEXT_LOCALE';

function isLocale(value: string | undefined): value is Locale {
  return routing.locales.includes(value as Locale);
}

/**
 * Hindi is offered, never imposed.
 *
 * `localeDetection` applies to every locale at once, so listing `hi` in the routing table would send a
 * Hindi-preferring browser straight to `/hi`. Ticket 038 requires the opposite: English first, then an
 * explicit accept through the language banner. Switching detection off would take Hebrew and Arabic
 * auto-detection down with it, so the header is filtered instead of the feature.
 *
 * Deliberately narrow. It only runs before the visitor has chosen anything, only on a plain navigation,
 * and only when there is no locale in the path — the one case where detection decides where they land.
 * Once `NEXT_LOCALE` exists it wins, `hi` included.
 */
function requestForDetection(request: NextRequest): NextRequest {
  if (request.method !== 'GET' && request.method !== 'HEAD') return request;
  if (request.cookies.has(LOCALE_COOKIE)) return request;
  if (isLocale(request.nextUrl.pathname.split('/')[1])) return request;

  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage || !/(^|,)\s*hi\b/i.test(acceptLanguage)) return request;

  const withoutHindi = acceptLanguage
    .split(',')
    .filter((entry) => !/^\s*hi(-[A-Za-z]+)?\s*(;|$)/.test(entry))
    .join(',')
    .trim();

  const headers = new Headers(request.headers);
  if (withoutHindi) headers.set('accept-language', withoutHindi);
  else headers.delete('accept-language');

  return new NextRequest(request, { headers });
}

export default function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(requestForDetection(request));

  // For redirects (e.g. bare paths without locale prefix → /en/...), return as-is
  if (intlResponse.headers.get('location')) {
    return intlResponse;
  }

  // Inject the current pathname as a request header so Server Components
  // (and generateMetadata in the root layout) can read it via headers()
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  // Re-inject the locale header that intlMiddleware set internally —
  // creating a new NextResponse.next() would otherwise lose it, causing
  // getTranslations() to fall back to the default (English) locale.
  const pathLocale = request.nextUrl.pathname.split('/')[1];
  if (isLocale(pathLocale)) {
    requestHeaders.set('x-next-intl-locale', pathLocale);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Preserve locale cookie and any other response headers set by next-intl
  intlResponse.cookies.getAll().forEach(({ name, value, ...opts }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.cookies.set({ name, value, ...(opts as any) });
  });

  return response;
}

export const config = {
  matcher: ['/', '/(en|he|ar|hi)/:path*', '/((?!_next|_vercel|api|admin|app|manifest|sw|.*\\..*).*)'],
};
