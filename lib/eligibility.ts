// Eligibility overlay — supplemental, hand-curated data that is NOT in the GCFB
// source (residency restrictions and other requirements a facility imposes).
// Keyed by GCFB location id, merged during seeding exactly like city-overrides
// and phone-overrides. See data/eligibility.json for the shape and the
// important open-to-all-by-default rule.
//
// Keys beginning with "_" in the JSON (e.g. _comment, _example) are metadata
// and are ignored here, so the file can document itself.
import fs from "node:fs";
import path from "node:path";

export interface Eligibility {
  residentsOf: string[] | null; // cities the location restricts service to; null = none
  residentsOfZips: string[] | null; // ZIP codes the location restricts service to; null = none
  note: string | null; // free-text requirement, e.g. "Bring photo ID"
}

const OPEN_TO_ALL: Eligibility = { residentsOf: null, residentsOfZips: null, note: null };

function load(): Record<number, Eligibility> {
  const file = path.join(process.cwd(), "data", "eligibility.json");
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
  const out: Record<number, Eligibility> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith("_")) continue; // metadata (_comment/_example/etc.)
    const id = Number(key);
    if (!Number.isInteger(id) || value == null || typeof value !== "object") continue;
    const v = value as { residentsOf?: unknown; residentsOfZips?: unknown; note?: unknown };
    const toList = (x: unknown) =>
      Array.isArray(x) && x.length ? x.map((c) => String(c).trim()).filter(Boolean) : null;
    const residentsOf = toList(v.residentsOf);
    const residentsOfZips = toList(v.residentsOfZips);
    const note = typeof v.note === "string" && v.note.trim() ? v.note.trim() : null;
    out[id] = {
      residentsOf: residentsOf?.length ? residentsOf : null,
      residentsOfZips: residentsOfZips?.length ? residentsOfZips : null,
      note,
    };
  }
  return out;
}

const OVERLAY = load();

export function eligibilityFor(id: number): Eligibility {
  return OVERLAY[id] ?? OPEN_TO_ALL;
}

/** Count of entries that carry a real restriction or note — for the seed report. */
export function eligibilityCoverage(): { restricted: number; noted: number } {
  let restricted = 0;
  let noted = 0;
  for (const e of Object.values(OVERLAY)) {
    if (e.residentsOf || e.residentsOfZips) restricted++;
    if (e.note) noted++;
  }
  return { restricted, noted };
}
