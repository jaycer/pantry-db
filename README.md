# Pantry DB

A filterable directory of free food sources — pantries, mobile pantries, and
hot meal sites — in the Greater Cleveland, Ohio area. Filter by category,
geography (City / East Side / West Side), and day of the week to find what's
open when you need it.

## Data source

Location data (name, address, phone, category, and weekly hours) is scraped
from the [Greater Cleveland Food Bank's food locator](https://www.greaterclevelandfoodbank.org/get-help/find-food),
which publishes it publicly to help people find food assistance. It's
included here in `data/gcfb-locations.json` for the same purpose. Hours and
availability can change — call ahead before visiting, and consider the data
a starting point rather than a live source of truth. If you want fresher
data, re-scrape the locator page and re-run `npm run seed`.

Any freeform text you add to a location's Notes field is preserved across
re-seeds.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4
- SQLite via `better-sqlite3`, no ORM — raw parameterized SQL
- Local-only: everything runs against a local SQLite file, no external services

## Getting started

```bash
npm install
npm run seed   # populate db/pantry.db from data/gcfb-locations.json
npm run dev    # http://localhost:3001
```

Re-running `npm run seed` is safe — it's an idempotent upsert that refreshes
scraped fields but never overwrites notes you've added. Pass `--reset` to
wipe and reload from scratch.

## Project layout

- `app/` — pages, API routes, and UI components
- `lib/db.ts` — SQLite access layer (`listLocations`, `getLocation`, `updateLocation`)
- `lib/regions.ts` — zip code → City/East Side/West Side classification
- `db/schema.sql` — table schema
- `scripts/seed.mjs` — imports `data/gcfb-locations.json` into the database

## License

MIT — see [LICENSE](LICENSE).
