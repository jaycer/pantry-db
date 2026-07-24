import fs from "node:fs";
import path from "node:path";
import { getWritableDb } from "../lib/db.ts";
import { regionForZip } from "../lib/regions.ts";
import { normalizeCity } from "../lib/normalize-city.ts";
import { normalizePhone } from "../lib/normalize-phone.ts";
import { overrideCity } from "../lib/city-overrides.ts";
import { overridePhone } from "../lib/phone-overrides.ts";
import { overrideNotes } from "../lib/notes-overrides.ts";
import { eligibilityFor } from "../lib/eligibility.ts";
import { parseRestriction } from "../lib/restricted-area.ts";

const DATA_PATH = path.join(process.cwd(), "data", "gcfb-locations.json");
const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const db = getWritableDb();

if (process.argv.includes("--reset")) {
  db.exec("DELETE FROM locations");
  console.log("Reset: cleared existing locations.");
}

const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

function buildNotes(hours) {
  const lines = [];
  for (const day of DAYS) {
    const comments = hours[day]?.comments;
    if (comments && comments.trim()) {
      const label = day[0].toUpperCase() + day.slice(1);
      lines.push(`${label}: ${comments.trim()}`);
    }
  }
  return lines.length ? lines.join("\n") : null;
}

// Every column is rebuilt from committed inputs (the source JSON + the overlay
// files) on every seed, so the DB is a pure, deterministic function of what's
// in git — a full rebuild (`--reset` / `build`) always produces the same data.
const upsert = db.prepare(`
  INSERT INTO locations (
    id, category, title, address, city, zip, lat, lng, phone, region,
    monday_hours, tuesday_hours, wednesday_hours, thursday_hours,
    friday_hours, saturday_hours, sunday_hours, notes,
    residency_cities, residency_zips, eligibility_note, eligibility_source
  ) VALUES (
    @id, @category, @title, @address, @city, @zip, @lat, @lng, @phone, @region,
    @monday_hours, @tuesday_hours, @wednesday_hours, @thursday_hours,
    @friday_hours, @saturday_hours, @sunday_hours, @notes,
    @residency_cities, @residency_zips, @eligibility_note, @eligibility_source
  )
  ON CONFLICT(id) DO UPDATE SET
    category = excluded.category,
    title = excluded.title,
    address = excluded.address,
    city = excluded.city,
    zip = excluded.zip,
    lat = excluded.lat,
    lng = excluded.lng,
    phone = excluded.phone,
    region = excluded.region,
    monday_hours = excluded.monday_hours,
    tuesday_hours = excluded.tuesday_hours,
    wednesday_hours = excluded.wednesday_hours,
    thursday_hours = excluded.thursday_hours,
    friday_hours = excluded.friday_hours,
    saturday_hours = excluded.saturday_hours,
    sunday_hours = excluded.sunday_hours,
    notes = excluded.notes,
    residency_cities = excluded.residency_cities,
    residency_zips = excluded.residency_zips,
    eligibility_note = excluded.eligibility_note,
    eligibility_source = excluded.eligibility_source,
    updated_at = datetime('now')
`);

let inserted = 0;
let updated = 0;
let skipped = 0;

const run = db.transaction((records) => {
  for (const record of records) {
    if (!record.category_title) {
      skipped++;
      continue;
    }
    const id = Number(record.id);
    const lat = record.lat != null ? parseFloat(record.lat) : null;
    const lng = record.lng != null ? parseFloat(record.lng) : null;
    const baseNotes = buildNotes(record.hours ?? {});

    // Eligibility, two tiers. The hand-curated overlay (data/eligibility.json)
    // is authoritative when present — it holds facts not in GCFB (e.g. a flyer).
    // Otherwise, parse GCFB's own "Restricted Service Area" notes into structure
    // deterministically. Either way the provenance is recorded so the UI/export
    // can say where a restriction came from. Open-to-all is the default.
    const overlay = eligibilityFor(id);
    const parsed = parseRestriction(baseNotes);
    let elig = { cities: null, zips: null, note: null, source: null };
    if (overlay.residentsOf || overlay.residentsOfZips || overlay.note) {
      elig = { cities: overlay.residentsOf, zips: overlay.residentsOfZips, note: overlay.note, source: "overlay" };
    } else if (parsed && (parsed.cities.length || parsed.zips.length || parsed.note)) {
      elig = {
        cities: parsed.cities.length ? parsed.cities : null,
        zips: parsed.zips.length ? parsed.zips : null,
        note: parsed.note,
        source: "gcfb-parsed",
      };
    }

    const row = {
      id,
      category: record.category_title.trim(),
      title: record.title.trim(),
      address: record.address.trim(),
      city: overrideCity(id, normalizeCity(record.city)),
      zip: record.zip.trim(),
      lat,
      lng,
      phone: overridePhone(id, normalizePhone(record.phone)),
      region: regionForZip(record.zip),
      notes: overrideNotes(id, baseNotes),
      residency_cities: elig.cities ? JSON.stringify(elig.cities) : null,
      residency_zips: elig.zips ? JSON.stringify(elig.zips) : null,
      eligibility_note: elig.note,
      eligibility_source: elig.source,
    };
    for (const day of DAYS) {
      row[`${day}_hours`] = record.hours?.[day]?.text?.trim() || null;
    }

    const before = db.prepare("SELECT id FROM locations WHERE id = ?").get(row.id);
    upsert.run(row);
    if (before) updated++;
    else inserted++;
  }
});

run(raw);

console.log(
  `${raw.length} processed, ${inserted} inserted, ${updated} updated, ${skipped} skipped (uncategorized)`
);

// ---- Validation report -----------------------------------------------------
// A repeatable cleanse should be observable: surface the things that silently
// pass through (unclassified regions, un-normalized-looking cities, missing
// coordinates) plus eligibility coverage, so drift in the source is visible on
// every rebuild rather than discovered later in the UI.
function report() {
  const total = db.prepare("SELECT COUNT(*) c FROM locations").get().c;
  const nullRegion = db.prepare("SELECT COUNT(*) c FROM locations WHERE region IS NULL").get().c;
  const noCoords = db
    .prepare("SELECT COUNT(*) c FROM locations WHERE lat IS NULL OR lng IS NULL")
    .get().c;
  const noPhone = db.prepare("SELECT COUNT(*) c FROM locations WHERE phone IS NULL OR phone = ''").get().c;
  const cities = db
    .prepare("SELECT city, COUNT(*) c FROM locations GROUP BY city ORDER BY c DESC")
    .all();
  // Cities that look like they still need a normalization rule: ALL CAPS,
  // abbreviated "Hts", or a trailing period.
  const suspicious = cities
    .map((r) => r.city)
    .filter((c) => /\bHts\b/.test(c) || /\.$/.test(c) || (/[A-Za-z]/.test(c) && c === c.toUpperCase()));
  const restricted = db
    .prepare("SELECT COUNT(*) c FROM locations WHERE residency_cities IS NOT NULL OR residency_zips IS NOT NULL")
    .get().c;
  const parsedN = db.prepare("SELECT COUNT(*) c FROM locations WHERE eligibility_source = 'gcfb-parsed'").get().c;
  const overlayN = db.prepare("SELECT COUNT(*) c FROM locations WHERE eligibility_source = 'overlay'").get().c;

  console.log("\n--- validation report ---");
  console.log(`locations:            ${total}`);
  console.log(`unclassified region:  ${nullRegion}${nullRegion ? "  (region IS NULL — zip not in lib/regions.ts)" : ""}`);
  console.log(`missing lat/lng:      ${noCoords}`);
  console.log(`missing phone:        ${noPhone}`);
  console.log(`distinct cities:      ${cities.length}`);
  if (suspicious.length) {
    console.log(`cities to review:     ${suspicious.join(", ")}  (add to lib/normalize-city.ts)`);
  }
  console.log(`eligibility:          ${restricted} with a service-area restriction (${parsedN} parsed from GCFB notes, ${overlayN} from overlay)`);
  console.log("-------------------------\n");
}
report();
