// Deterministic parser for the residency/service-area restrictions that GCFB
// bakes into its free-text hours comments (e.g. "Restricted Service Area-
// 44105, 44127", "*PARMA RESIDENTS ONLY", "Lakewood residents only"). Turns
// them into structured eligibility so they can drive badges and the residence
// filter — all from the source, so it re-derives on every ETL with no manual
// upkeep. Anything it can't confidently structure is preserved as a note.

export interface ParsedRestriction {
  zips: string[]; // 5-digit ZIP codes the location restricts to
  cities: string[]; // city names the location restricts to
  note: string | null; // the human phrasing, cleaned (carries anything unstructured)
}

// Lines that signal a restriction. Kept broad; extraction below is conservative.
const SIGNAL = /restricted|residents?\s+only|must\s+live|service area|zip\s*code|proof of address|school district/i;

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\bHts\b/, "Heights")
    .trim();
}

/** Strip the "Monday: " day prefix and the "Restricted Service Area-" lead-in. */
function cleanLine(line: string): string {
  return line
    .replace(/^[A-Za-z]+:\s*/, "") // day prefix
    .replace(/^\*+\s*/, "") // leading asterisks
    .replace(/restricted service area[-:\s]*/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseRestriction(notes: string | null): ParsedRestriction | null {
  if (!notes) return null;
  const relevant = notes
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && SIGNAL.test(l));
  if (!relevant.length) return null;

  const blob = relevant.join("  ");

  // ZIP codes: Ohio ZIPs only (43xxx–45xxx). Constraining to the state's range
  // skips the 4-digit typos, m/d/yy dates, AND 5-digit street numbers that would
  // otherwise be mistaken for ZIPs (e.g. "10462 Detroit Ave"). A number right
  // before a street-type word is dropped for the same reason.
  const zips = [
    ...new Set(
      (blob.match(/\b4[3-5]\d{3}\b(?!\s+\w+\s+(?:Ave|Avenue|St|Street|Blvd|Rd|Road|Dr|Drive|Ln|Lane|Way|Ct|Pl))/gi) ?? [])
    ),
  ];

  // Cities: "<City> residents only" and "<City> School District". The optional
  // second word catches "Parma Heights", "Chagrin Falls", etc.
  const cities = new Set<string>();
  for (const m of blob.matchAll(
    /\b([A-Za-z][A-Za-z.]+(?:\s+(?:Heights|Hts|Falls|Village|Hills|Park))?)\s+residents?\s+only/gi
  )) {
    cities.add(titleCase(m[1]));
  }
  for (const m of blob.matchAll(/\b([A-Za-z]+)\s+School District/gi)) {
    cities.add(titleCase(m[1]));
  }

  // Note: cleaned, de-duplicated restriction phrasing (GCFB repeats it per day).
  const note =
    [...new Set(relevant.map(cleanLine))].filter(Boolean).join(" ").trim() || null;

  if (!zips.length && !cities.size && !note) return null;
  return { zips, cities: [...cities], note };
}
