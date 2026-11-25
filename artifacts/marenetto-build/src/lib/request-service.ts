/** Query preselection carries a service code, never visitor data.
 * property_care retains its broad existing meaning; the new service uses it
 * without renaming maintenance/property care or extending the API contract. */
export function requestServiceSelection(search: string): string | undefined {
  const values = new URLSearchParams(search).getAll('service');
  if (values.length !== 1) return undefined;
  switch (values[0]) {
    case 'property_care': return 'property_care';
    case 'bespoke-furniture': return 'bespoke-furniture';
    case 'local-building': return 'renovation';
    default: return undefined;
  }
}
