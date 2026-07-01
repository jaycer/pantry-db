import fs from "node:fs";
import path from "node:path";
import { getWritableDb } from "../lib/db.ts";
import { regionForZip } from "../lib/regions.ts";
import { normalizeCity } from "../lib/normalize-city.ts";
import { normalizePhone } from "../lib/normalize-phone.ts";
import { overrideCity } from "../lib/city-overrides.ts";
import { overridePhone } from "../lib/phone-overrides.ts";

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

const upsert = db.prepare(`
  INSERT INTO locations (
    id, category, title, address, city, zip, lat, lng, phone, region,
    monday_hours, tuesday_hours, wednesday_hours, thursday_hours,
    friday_hours, saturday_hours, sunday_hours, notes
  ) VALUES (
    @id, @category, @title, @address, @city, @zip, @lat, @lng, @phone, @region,
    @monday_hours, @tuesday_hours, @wednesday_hours, @thursday_hours,
    @friday_hours, @saturday_hours, @sunday_hours, @notes
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
    updated_at = datetime('now')
    -- notes deliberately excluded: preserves user edits across re-seeds
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
      notes: buildNotes(record.hours ?? {}),
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
