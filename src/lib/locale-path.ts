/**
 * Build locale-switched URL path for language switcher.
 * Must only strip locale when it's a complete path segment (not e.g. /ar in /articles).
 * Must add slash between locale and path to avoid /hearticles.
 */
const LOCALE_REGEX = /^\/(en|he|ar)(?:\/|$)/;

export function buildLocalePath(pathname: string, localeCode: string): string {
  const strippedPath = pathname.replace(LOCALE_REGEX, '') || '/';
  const pathWithoutLeadingSlash = strippedPath.replace(/^\//, '');
  return `/${localeCode}${!pathWithoutLeadingSlash ? '' : '/' + pathWithoutLeadingSlash}`;
}
