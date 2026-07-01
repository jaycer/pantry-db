import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_DIR = path.join(process.cwd(), "db");
const DB_PATH = path.join(DB_DIR, "pantry.db");
const SCHEMA_PATH = path.join(DB_DIR, "schema.sql");

let db: Database.Database | null = null;

// Read-only connection used by the app itself. The database is fully
// pre-seeded before the app runs (see scripts/seed.mjs, run as part of
// `npm run build`) and the app never writes to it. Opening read-only
// avoids setting WAL journal mode, which creates -wal/-shm sidecar files
// on open and needs a writable filesystem — Vercel's (and most serverless
// platforms') deployment filesystem is read-only outside /tmp, so a
// read-write connection here would throw on every request.
export function getDb(): Database.Database {
  if (!db) {
    if (!fs.existsSync(DB_PATH)) {
      throw new Error(`Database not found at ${DB_PATH}. Run "npm run seed" first.`);
    }
    db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
  }
  return db;
}

// Read-write connection used only by scripts/seed.mjs to create/populate
// the database. Not used by the app itself. No WAL mode — see schema.sql.
export function getWritableDb(): Database.Database {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const wdb = new Database(DB_PATH);
  wdb.pragma("foreign_keys = ON");
  wdb.exec(fs.readFileSync(SCHEMA_PATH, "utf8"));
  return wdb;
}

export const CATEGORIES = ["Pantry", "Mobile Pantry", "Hot Meals"] as const;
export type Category = (typeof CATEGORIES)[number];

export const REGIONS = ["east", "west"] as const;
export type Region = (typeof REGIONS)[number];

export const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const;
export type Day = (typeof DAYS)[number];

// Whitelist mapping from a query-string `day` value to its DB column — never
// interpolate the raw searchParams value directly into SQL.
const DAY_COLUMN: Record<Day, string> = {
  monday: "monday_hours",
  tuesday: "tuesday_hours",
  wednesday: "wednesday_hours",
  thursday: "thursday_hours",
  friday: "friday_hours",
  saturday: "saturday_hours",
  sunday: "sunday_hours",
};

export interface Location {
  id: number;
  category: Category;
  title: string;
  address: string;
  city: string;
  zip: string;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  region: Region | null;
  monday_hours: string | null;
  tuesday_hours: string | null;
  wednesday_hours: string | null;
  thursday_hours: string | null;
  friday_hours: string | null;
  saturday_hours: string | null;
  sunday_hours: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function listLocations(
  filters: { category?: Category; region?: Region; day?: Day; city?: string } = {}
): Location[] {
  const where: string[] = [];
  const params: Record<string, unknown> = {};
  if (filters.category) {
    where.push("category = @category");
    params.category = filters.category;
  }
  if (filters.region) {
    where.push("region = @region");
    params.region = filters.region;
  }
  if (filters.day) {
    const col = DAY_COLUMN[filters.day];
    where.push(`(${col} IS NOT NULL AND TRIM(${col}) != '')`);
  }
  if (filters.city) {
    where.push("city = @city");
    params.city = filters.city;
  }
  const sql = `
    SELECT * FROM locations
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY title COLLATE NOCASE`;
  return getDb().prepare(sql).all(params) as Location[];
}

export function getLocation(id: number | string): Location | undefined {
  return getDb().prepare("SELECT * FROM locations WHERE id = ?").get(Number(id)) as
    | Location
    | undefined;
}

export function listCities(): string[] {
  return (
    getDb().prepare("SELECT DISTINCT city FROM locations ORDER BY city COLLATE NOCASE").all() as {
      city: string;
    }[]
  ).map((r) => r.city);
}
