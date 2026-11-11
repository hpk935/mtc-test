/**
 * Index of the product a keyboard "accept" (Tab / Enter) should pick from a
 * product search: an exact item-number match if there is one, otherwise the
 * first result. Returns -1 when there are no results.
 *
 * The search API does a contains-match ordered by item number, so typing a
 * full item number like "100" can list "0100" ahead of "100" itself.
 */
export function bestProductMatchIndex(
  results: ReadonlyArray<{ itemNumber: string }>,
  query: string,
): number {
  if (results.length === 0) return -1;
  const q = query.trim().toLowerCase();
  const exact = results.findIndex((p) => p.itemNumber.toLowerCase() === q);
  return exact >= 0 ? exact : 0;
}
