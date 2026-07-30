/** Strip HTML and count words (Latin + Arabic letters). */
export function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordCount(html) {
  const t = stripHtml(html);
  if (!t) return 0;
  return t.split(/\s+/).filter(Boolean).length;
}

/** Returns ratio target/source (1.0 = match). Typical OK band: 0.82–1.18 for cross-language. */
export function ratio(targetHtml, sourceHtml) {
  const s = wordCount(sourceHtml);
  if (s === 0) return 1;
  return wordCount(targetHtml) / s;
}
