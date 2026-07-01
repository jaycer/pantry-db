// Cleveland-area zip → East/West Side, for the geography filter.
//
// Deliberately narrow: only Cleveland's own east/west neighborhoods and the
// small, non-distinct inner-ring suburbs that locals actually fold into
// "East Side"/"West Side" get bucketed here. Zips left unmapped fall through
// to `null` (no region tag — the location still shows under "All").
// Unmapped on purpose:
//   - Suburbs with a strong standalone identity (Parma, Shaker Heights,
//     Beachwood, Westlake, Solon, North Royalton, Broadview Heights, Berea,
//     North Olmsted, Olmsted Falls, Bay Village). Cleveland Heights and
//     Euclid are bucketed East despite also having a distinct identity, per
//     request.
//   - Far exurbs that aren't really "Cleveland" colloquially (Mentor,
//     Chagrin Falls, Chardon, Painesville, Willoughby/Eastlake/Willowick/
//     Wickliffe, Madison, Perry, Ashtabula, Mansfield, Ashland, etc.)
// Downtown/Flats zips (44113/44114/44115) are folded into East/West by which
// side of the Cuyahoga River they're on, rather than kept as a separate
// "City" bucket.
export const ZIP_REGION: Record<string, "east" | "west"> = {
  // West Side — Cleveland's west-side neighborhoods + small inner-ring suburbs
  "44102": "west", // Detroit-Shoreway/Cudell
  "44107": "west", // Lakewood
  "44109": "west", // Old Brooklyn
  "44111": "west", // West Blvd
  "44113": "west", // Ohio City / west Flats
  "44126": "west", // West Park/Fairview area
  "44135": "west", // Puritas-Longmead
  "44142": "west", // Brook Park
  "44144": "west", // Brooklyn

  // East Side — Cleveland's east-side neighborhoods + small inner-ring suburbs
  "44103": "east", // AsiaTown/St Clair-Superior
  "44104": "east", // Kinsman/Central
  "44105": "east", // Slavic Village
  "44106": "east", // University Circle/Hough
  "44108": "east", // Glenville
  "44110": "east", // Collinwood
  "44112": "east", // East Cleveland (zip also touches Cleveland Hts — zip-level granularity limit)
  "44114": "east", // Downtown core/Warehouse District/CSU
  "44115": "east", // Campus District/south downtown
  "44117": "east", // Euclid
  "44118": "east", // Cleveland Heights / University Heights
  "44119": "east", // Cleveland (Nottingham/Collinwood) / Euclid
  "44120": "east", // Shaker Square/Buckeye
  "44121": "east", // South Euclid
  "44123": "east", // Euclid
  "44124": "east", // Mayfield Hts
  "44125": "east", // Garfield Hts
  "44127": "east", // Central/Kinsman
  "44128": "east", // Highland Hills
  "44132": "east", // Euclid
  "44137": "east", // Maple Heights
  "44143": "east", // Richmond Hts
  "44146": "east", // Bedford/Bedford Hts
};

export function regionForZip(zip: string): "east" | "west" | null {
  return ZIP_REGION[zip] ?? null;
}
