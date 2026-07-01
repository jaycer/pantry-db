import type { Category, Day, Region } from "@/lib/db";

export const CATEGORY_ORDER: Category[] = ["Pantry", "Mobile Pantry", "Hot Meals"];

// URL-safe slug <-> DB category value.
export const CATEGORY_SLUGS: Record<string, Category> = {
  pantry: "Pantry",
  "mobile-pantry": "Mobile Pantry",
  "hot-meals": "Hot Meals",
};
export const CATEGORY_TO_SLUG: Record<Category, string> = {
  Pantry: "pantry",
  "Mobile Pantry": "mobile-pantry",
  "Hot Meals": "hot-meals",
};

export const REGION_ORDER: Region[] = ["east", "west"];
export const REGION_LABELS: Record<Region, string> = {
  east: "East Side",
  west: "West Side",
};

export const DAY_ORDER: Day[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];
export const DAY_LABELS: Record<Day, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};
export const DAY_LABELS_FULL: Record<Day, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

export function isRegion(v: string | undefined): v is Region {
  return !!v && (REGION_ORDER as string[]).includes(v);
}

export function isDay(v: string | undefined): v is Day {
  return !!v && (DAY_ORDER as string[]).includes(v);
}
