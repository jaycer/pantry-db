// Emit the cleansed dataset as a single static JSON for the read-only portfolio
// sub-app. The portfolio has no server/SQLite, so it consumes this file and does
// all filtering, detail, and PDF generation client-side. Run after a seed (the
// `export:portfolio` npm script reseeds first, so the export is deterministic).
import fs from "node:fs";
import path from "node:path";
import { listLocations, listCities } from "../lib/db.ts";

// Drop the bookkeeping timestamps; keep everything the UI + PDFs need
// (residency_cities is already hydrated to a string[] by listLocations).
const locations = listLocations().map((loc) => {
  const { created_at, updated_at, ...rest } = loc;
  void created_at;
  void updated_at;
  return rest;
});

const payload = {
  source: "Greater Cleveland Food Bank",
  note: "Cleansed and enriched from GCFB's public food locator. Hours change — call ahead.",
  count: locations.length,
  cities: listCities(),
  locations,
};

const outDir = path.join(process.cwd(), "out");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "pantry-portfolio.json");
fs.writeFileSync(outFile, JSON.stringify(payload));

console.log(
  `wrote ${outFile} — ${locations.length} locations, ${payload.cities.length} cities, ${(fs.statSync(outFile).size / 1024).toFixed(0)} KB`
);
