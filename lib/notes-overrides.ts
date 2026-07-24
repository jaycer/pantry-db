// Optional per-location notes corrections, keyed by GCFB id. The base `notes`
// is derived deterministically from the source hours comments on every seed;
// an entry here replaces it so a hand-curated note survives a full rebuild.
// This keeps the cleanse a pure function of committed inputs (source JSON +
// overlays) rather than depending on in-place DB edits. Keys starting with "_"
// are metadata and ignored.
import fs from "node:fs";
import path from "node:path";

function load(): Record<number, string> {
  const file = path.join(process.cwd(), "data", "notes-overrides.json");
  let raw: Record<string, unknown>;
  try {
    raw = JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return {};
  }
  const out: Record<number, string> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith("_")) continue;
    const id = Number(key);
    if (Number.isInteger(id) && typeof value === "string" && value.trim()) {
      out[id] = value.trim();
    }
  }
  return out;
}

const OVERRIDES = load();

export function overrideNotes(id: number, notes: string | null): string | null {
  return OVERRIDES[id] ?? notes;
}
