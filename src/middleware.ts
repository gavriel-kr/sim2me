import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(en|he|ar)/:path*', '/((?!_next|_vercel|api|admin|app|.*\\..*).*)'],
};
