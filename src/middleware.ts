import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

type Locale = (typeof routing.locales)[number];

function isLocale(value: string | undefined): value is Locale {
  return routing.locales.includes(value as Locale);
}

/*
  Hindi is auto-detected, exactly like Hebrew and Arabic.

  Ticket 038 shipped the opposite: a filter that stripped `hi` out of `accept-language` before
  detection ran, so a Hindi-preferring browser landed on English and was offered the switch through
  a banner. Gabriel reversed that decision — a Hindi speaker should get Hindi on arrival, the same
  way a Hebrew speaker gets Hebrew. With the filter gone, `localeDetection` treats all four locales
  alike, and `NEXT_LOCALE` still overrides it for anyone who has chosen for themselves.
*/
export default function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

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
