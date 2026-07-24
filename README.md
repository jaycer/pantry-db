# Pantry DB

A filterable directory of free food sources — pantries, mobile pantries, and
hot meal sites — in the Greater Cleveland, Ohio area. Filter by category,
geography (East Side / West Side), day of the week, city, and distance from
an address to find what's open when you need it, near where you need it.

## Data source

Location data (name, address, phone, category, and weekly hours) is scraped
from the [Greater Cleveland Food Bank's food locator](https://www.greaterclevelandfoodbank.org/get-help/find-food),
which publishes it publicly to help people find food assistance. It's
included here in `data/gcfb-locations.json` for the same purpose. Hours and
availability can change — call ahead before visiting, and consider the data
a starting point rather than a live source of truth.

To pull fresh data:

```bash
npm run scrape   # re-fetch GCFB's page, overwrite data/gcfb-locations.json
npm run seed -- --reset   # normalize + load it into db/pantry.db
# or, in one step:
npm run etl
```

`scripts/scrape.mjs` refuses to overwrite existing data if the scrape looks
broken (GCFB changed their page structure, the result is empty/malformed, or
the location count dropped by more than half) — it exits with an error
instead, leaving `data/gcfb-locations.json` untouched.

### The cleanse is fully repeatable

Normalization (trimming, city-name cleanup, phone formatting, East/West Side
classification, per-location corrections, and the eligibility overlay) all
happens in `scripts/seed.mjs`. Every column is rebuilt from committed inputs
on every seed — the source JSON plus the overlay files
(`lib/city-overrides.ts`, `lib/phone-overrides.ts`, `data/notes-overrides.json`,
`data/eligibility.json`) — so **the database is a pure, deterministic function
of what's in git**. A `--reset` rebuild always produces byte-identical data;
nothing depends on hand-edits to the generated DB (which is git-ignored). Any
one-off correction lives in an overlay file, keyed by GCFB id, so it survives
a full rebuild.

Every seed also prints a **validation report** (unclassified regions, cities
that still look un-normalized, missing coordinates/phones, eligibility
coverage) so drift in the upstream data is visible immediately rather than
discovered later in the UI.

### Eligibility overlay

Eligibility requirements (e.g. "Parma residents only") are **not** in the GCFB
source, so they live in `data/eligibility.json`, keyed by GCFB id and merged at
seed time. The safe default is **open to all** — a location with no entry is
treated as serving everyone. Only add a `residentsOf` restriction after
confirming it with the facility; a false restriction can wrongly turn people
away from food they qualify for. This structured field powers the "city you
reside in" filter and the eligibility badge in the UI.

The site is fully read-only in production — there's no editing UI, so
`npm run seed -- --reset` (implied by `npm run build`'s build step) always
reflects exactly what's in the committed data + overlays.

## Stack

- Next.js (App Router) + TypeScript, deployed on Vercel
- Tailwind CSS v4
- SQLite via `better-sqlite3`, no ORM — raw parameterized SQL. The database
  is seeded once at build time and opened read-only at runtime (the app has
  no editing UI or write path)
- The only external service called at runtime is
  [Nominatim](https://nominatim.org/) (OpenStreetMap's free geocoder), used
  client-side for the "distance from an address" filter

## Getting started

```bash
npm install
npm run seed   # populate db/pantry.db from data/gcfb-locations.json
npm run dev    # http://localhost:3001
```

Re-running `npm run seed` is safe and idempotent — pass `--reset` to wipe
and reload from scratch (this is what `npm run build` and `npm run etl` do).

## Project layout

- `app/` — pages and UI components
- `lib/db.ts` — SQLite access layer (`listLocations`, `getLocation`, `listCities`)
- `lib/regions.ts` — zip code → East/West Side classification
- `lib/distance.ts` — Haversine distance for the address-search filter
- `lib/normalize-city.ts`, `lib/normalize-phone.ts` — cleansing applied at seed time
- `lib/city-overrides.ts`, `lib/phone-overrides.ts`, `lib/notes-overrides.ts` — manually-verified per-location corrections (overlays keyed by GCFB id)
- `lib/eligibility.ts`, `data/eligibility.json` — structured eligibility overlay (residency restrictions + notes)
- `lib/pdf/` — framework-agnostic PDF builders (full-pager + booklet) shared by the app and the static portfolio export
- `db/schema.sql` — table schema
- `scripts/scrape.mjs` — fetches GCFB's page and refreshes `data/gcfb-locations.json`
- `scripts/seed.mjs` — normalizes and loads `data/gcfb-locations.json` into the database, then prints a validation report
- `scripts/export-portfolio.mjs` — emits the cleansed dataset as static JSON for the portfolio sub-app

## License

MIT — see [LICENSE](LICENSE).
