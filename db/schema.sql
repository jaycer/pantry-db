-- No WAL mode: the DB is written once at seed/build time, then opened
-- read-only by the app forever after. WAL needs writable -wal/-shm
-- sidecar files even to open for reading, which breaks on read-only
-- serverless filesystems (Vercel etc) — the default rollback-journal
-- mode is fully self-contained in this one file.
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS locations (
  id INTEGER PRIMARY KEY,             -- reuses GCFB's own numeric id; stable across re-scrapes, enables idempotent upsert
  category TEXT NOT NULL CHECK (category IN ('Pantry','Mobile Pantry','Hot Meals')),
  title TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  zip TEXT NOT NULL,
  lat REAL,
  lng REAL,
  phone TEXT,
  region TEXT CHECK (region IN ('east','west')),  -- NULL = unclassified (distinct-identity suburb or exurb)
  monday_hours TEXT,
  tuesday_hours TEXT,
  wednesday_hours TEXT,
  thursday_hours TEXT,
  friday_hours TEXT,
  saturday_hours TEXT,
  sunday_hours TEXT,
  notes TEXT,                         -- derived from hours.<day>.comments (+ optional notes-overrides); rebuilt every seed
  residency_cities TEXT,              -- JSON array of cities a location restricts service to; NULL = open to all. From data/eligibility.json
  eligibility_note TEXT,              -- free-text eligibility requirement (e.g. "Bring photo ID"); from data/eligibility.json
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_locations_category ON locations(category);
CREATE INDEX IF NOT EXISTS idx_locations_region ON locations(region);
