// Per-location city corrections, for cases where the scraped `city` field is
// wrong for that specific address (e.g. zip 44130 spans Cleveland, Parma,
// and Parma Heights, and the source data mislabels some addresses within
// it). Keyed by the GCFB source id, applied after general city
// normalization.
const CITY_OVERRIDES: Record<number, string> = {
  389: "Parma", // All Saints Episcopal Church, 8911 W Ridgewood Dr — is Parma, not Cleveland
};

export function overrideCity(id: number, city: string): string {
  return CITY_OVERRIDES[id] ?? city;
}
