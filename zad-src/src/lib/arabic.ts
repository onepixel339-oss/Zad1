/* ZAD — small Arabic language helpers */

/** الصفحات بالعربية الصحيحة: ١ صفحة واحدة، ٢ صفحتين، ٣–١٠ صفحات، ١١+ صفحة */
export function pagesLabel(n: number): string {
  if (n === 1) return 'صفحة واحدة'
  if (n === 2) return 'صفحتين'
  if (n >= 3 && n <= 10) return `${n} صفحات`
  return `${n} صفحة`
}
