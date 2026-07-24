// Fetches the Greater Cleveland Food Bank's food locator page and extracts
// the embedded `locations_json` array (the page has no separate API — the
// full location dataset is server-rendered directly into a <script> tag).
// Writes the result to data/gcfb-locations.json, which scripts/seed.mjs
// then reads to populate the database.
//
// Refuses to overwrite existing data if the scrape looks broken (page
// structure changed, empty/malformed result, or a suspicious drop in
// location count) — better to keep known-good data than silently replace
// it with garbage.
import fs from "node:fs";
import path from "node:path";

const URL = "https://www.greaterclevelandfoodbank.org/get-help/find-food";
const OUT_PATH = path.join(process.cwd(), "data", "gcfb-locations.json");

// If the new scrape has fewer than this fraction of the previous count,
// treat it as suspicious rather than real turnover.
const MIN_COUNT_RATIO = 0.5;

function fail(message) {
  console.error(`ETL aborted: ${message}`);
  console.error("Existing data/gcfb-locations.json left untouched.");
  process.exit(1);
}

console.log(`Fetching ${URL} ...`);
const res = await fetch(URL, {
  headers: { "User-Agent": "Mozilla/5.0 (compatible; pantry-db-scraper/1.0)" },
});
if (!res.ok) fail(`HTTP ${res.status} fetching the GCFB page.`);
const html = await res.text();

const match = html.match(/var locations_json = (\[.*?\]);/s);
if (!match) {
  fail(
    "Could not find `locations_json` in the page — GCFB may have changed their page structure. " +
      "This scraper will need updating (see the regex in scripts/scrape.mjs)."
  );
}

let data;
try {
  data = JSON.parse(match[1]);
} catch (err) {
  fail(`Found locations_json but couldn't parse it as JSON: ${err.message}`);
}

if (!Array.isArray(data) || data.length === 0) {
  fail("Parsed locations_json is empty or not an array.");
}

const sample = data[0];
if (!sample || typeof sample.id === "undefined" || typeof sample.title === "undefined" || !sample.hours) {
  fail("Parsed data doesn't look like location records (missing id/title/hours) — likely extracted the wrong data.");
}

let previousCount = null;
if (fs.existsSync(OUT_PATH)) {
  try {
    previousCount = JSON.parse(fs.readFileSync(OUT_PATH, "utf8")).length;
  } catch {
    previousCount = null;
  }
}

if (previousCount != null && data.length < previousCount * MIN_COUNT_RATIO) {
  fail(
    `New scrape has ${data.length} locations vs. ${previousCount} previously — ` +
      `a drop of more than ${Math.round((1 - MIN_COUNT_RATIO) * 100)}% looks like a broken scrape, not real turnover.`
  );
}

fs.writeFileSync(OUT_PATH, JSON.stringify(data, null, 2) + "\n");

// Stamp the freshness date so the UI/export/PDFs can say how current the data
// is (see lib/meta.ts). Only the date is kept — that's the useful granularity.
const META_PATH = path.join(process.cwd(), "data", "gcfb-meta.json");
fs.writeFileSync(
  META_PATH,
  JSON.stringify(
    {
      _comment:
        "When the GCFB source (data/gcfb-locations.json) was last pulled. Overwritten automatically by scripts/scrape.mjs.",
      scrapedAt: new Date().toISOString().slice(0, 10),
    },
    null,
    2
  ) + "\n"
);

console.log(
  `Scraped ${data.length} locations` +
    (previousCount != null ? ` (was ${previousCount})` : "") +
    ` — wrote ${OUT_PATH}`
);
console.log('Run "npm run seed -- --reset" (or "npm run etl") to load this into the database.');
