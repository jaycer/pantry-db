// Cleveland-area zip → geography-filter bucket, derived from the `city` field
// of every zip actually present in the Greater Cleveland Food Bank scrape.
// Downtown/Flats/Warehouse District/CSU is carved out as "city"; everything
// else is bucketed by which side of the Cuyahoga River it falls on, including
// distant exurbs (Mansfield, Ashtabula, etc.) which still get a river-relative
// East/West bucket even though they're well outside the metro core.
export const ZIP_REGION: Record<string, "city" | "east" | "west"> = {
  // City — downtown/Flats/Warehouse District/CSU
  "44113": "city",
  "44114": "city",
  "44115": "city",

  // West Side — Cleveland proper + inner/outer west suburbs
  "44017": "west",
  "44070": "west",
  "44102": "west",
  "44107": "west",
  "44109": "west",
  "44111": "west",
  "44126": "west",
  "44129": "west",
  "44130": "west",
  "44133": "west",
  "44134": "west",
  "44135": "west",
  "44138": "west",
  "44140": "west",
  "44142": "west",
  "44144": "west",
  "44145": "west",
  "44147": "west",

  // Far west/southwest exurbs (Richland/Ashland county area)
  "44805": "west",
  "44813": "west",
  "44827": "west",
  "44842": "west",
  "44843": "west",
  "44866": "west",
  "44875": "west",
  "44902": "west",
  "44903": "west",
  "44905": "west",
  "44906": "west",
  "44907": "west",

  // East Side — Cleveland proper + inner/outer east suburbs
  "44103": "east",
  "44104": "east",
  "44105": "east",
  "44106": "east",
  "44108": "east",
  "44110": "east",
  "44112": "east",
  "44117": "east",
  "44118": "east",
  "44119": "east",
  "44120": "east",
  "44121": "east",
  "44122": "east",
  "44123": "east",
  "44124": "east",
  "44125": "east",
  "44127": "east",
  "44128": "east",
  "44132": "east",
  "44137": "east",
  "44139": "east",
  "44143": "east",
  "44146": "east",

  // Far east exurbs (Lake/Geauga/Ashtabula county area)
  "44092": "east",
  "44094": "east",
  "44095": "east",
  "44060": "east",
  "44057": "east",
  "44081": "east",
  "44077": "east",
  "44024": "east",
  "44021": "east",
  "44065": "east",
  "44026": "east",
  "44023": "east",
  "44062": "east",
  "44003": "east",
  "44004": "east",
  "44030": "east",
  "44041": "east",
  "44084": "east",
  "44047": "east",
};

// Approx. longitude of the Cuyahoga River's path near Cleveland — used only
// as a defensive fallback for a zip not present in ZIP_REGION above (every
// zip actually seen in the scraped data is already mapped).
const FALLBACK_LNG_THRESHOLD = -81.69;

export function regionForZip(zip: string, lng?: number): "city" | "east" | "west" {
  if (zip in ZIP_REGION) return ZIP_REGION[zip];
  if (typeof lng === "number") return lng < FALLBACK_LNG_THRESHOLD ? "west" : "east";
  return "east";
}
