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
instead, leaving `data/gcfb-locations.json` untouched. Normalization
(trimming, city-name cleanup, phone formatting, East/West Side
classification, and a couple of manually-verified corrections) all happens
in `scripts/seed.mjs`, so any fresh scrape gets the same cleansing applied
automatically.

The site is fully read-only in production — there's no editing UI, so
`npm run seed --reset` (implied by `npm run build`'s build step) always
reflects exactly what's in `data/gcfb-locations.json`.

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
- `lib/city-overrides.ts`, `lib/phone-overrides.ts` — manually-verified per-location corrections
- `db/schema.sql` — table schema
- `scripts/scrape.mjs` — fetches GCFB's page and refreshes `data/gcfb-locations.json`
- `scripts/seed.mjs` — normalizes and loads `data/gcfb-locations.json` into the database

## License

MIT — see [LICENSE](LICENSE).
