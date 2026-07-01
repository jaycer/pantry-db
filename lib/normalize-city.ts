// The scraped `city` field has inconsistent casing/abbreviations for the
// same place (e.g. "CLEVELAND" vs "Cleveland", "Cleveland Hts" vs
// "Cleveland Heights"). This maps each known raw variant (after trimming)
// to one canonical spelling.
const CITY_NORMALIZE: Record<string, string> = {
  CLEVELAND: "Cleveland",

  "CLEVELAND HTS": "Cleveland Heights",
  "Cleveland Hts": "Cleveland Heights",
  "Cleveland Hts.": "Cleveland Heights",

  BEDFORD: "Bedford",
  "CHAGRIN FALLS": "Chagrin Falls",
  EUCLID: "Euclid",
  GENEVA: "Geneva",
  KIRTLAND: "Kirtland",
  MENTOR: "Mentor",
  PAINESVILLE: "Painesville",
  Painsville: "Painesville", // typo in source data
  SHELBY: "Shelby",
  SOLON: "Solon",

  "Broadview Hts": "Broadview Heights",
  "Garfield Hts": "Garfield Heights",
  "Mayfield Hts": "Mayfield Heights",
};

export function normalizeCity(city: string): string {
  const trimmed = city.trim();
  return CITY_NORMALIZE[trimmed] ?? trimmed;
}
