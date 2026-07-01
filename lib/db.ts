import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const DB_DIR = path.join(process.cwd(), "db");
const DB_PATH = path.join(DB_DIR, "pantry.db");
const SCHEMA_PATH = path.join(DB_DIR, "schema.sql");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    db.exec(fs.readFileSync(SCHEMA_PATH, "utf8"));
  }
  return db;
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
  filters: { category?: Category; region?: Region; day?: Day } = {}
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

export function updateLocation(id: number, fields: Partial<Location>): Location | undefined {
  const allowed = ["notes"];
  const prev = getLocation(id);
  if (!prev) return undefined;
  const sets: string[] = [];
  const params: Record<string, unknown> = { id };
  for (const key of allowed) {
    if (key in fields) {
      sets.push(`${key} = @${key}`);
      params[key] = (fields as Record<string, unknown>)[key];
    }
  }
  if (!sets.length) return prev;
  sets.push("updated_at = datetime('now')");
  getDb()
    .prepare(`UPDATE locations SET ${sets.join(", ")} WHERE id = @id`)
    .run(params);
  return getLocation(id);
}
