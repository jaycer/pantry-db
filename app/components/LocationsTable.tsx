"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Day, Location } from "@/lib/db";
import { REGION_LABELS, DAY_ORDER, DAY_LABELS } from "./constants";
import { occursThisWeek } from "@/lib/parse-schedule";
import { haversineMiles, formatMiles } from "@/lib/distance";

type SortKey = "title" | "region" | "distance" | "days" | "today" | "phone";
type Dir = "asc" | "desc";

function openDays(loc: Location): Day[] {
  return DAY_ORDER.filter((d) => {
    const val = loc[`${d}_hours` as keyof Location] as string | null;
    return !!val && val.trim() !== "";
  });
}

// Returns this location's hours text for `today`, but only if it actually
// applies this week — e.g. a "Fourth Wednesday" entry returns null on any
// Wednesday that isn't the month's fourth.
function hoursToday(loc: Location, today: Day, todayWeekNum: number, todayIsLastWeek: boolean): string | null {
  const text = loc[`${today}_hours` as keyof Location] as string | null;
  if (!text) return null;
  return occursThisWeek(text, todayWeekNum, todayIsLastWeek) ? text : null;
}

function distanceMiles(loc: Location, originLat?: number, originLng?: number): number | null {
  if (originLat == null || originLng == null || loc.lat == null || loc.lng == null) return null;
  return haversineMiles(originLat, originLng, loc.lat, loc.lng);
}

function sortValue(
  loc: Location,
  key: SortKey,
  today: Day,
  todayWeekNum: number,
  todayIsLastWeek: boolean,
  originLat?: number,
  originLng?: number
): string | number {
  switch (key) {
    case "title":
      return loc.title.toLowerCase();
    case "region":
      return loc.region ? REGION_LABELS[loc.region] : "";
    case "distance":
      return distanceMiles(loc, originLat, originLng) ?? Number.POSITIVE_INFINITY;
    case "days":
      return openDays(loc).join(",");
    case "today":
      return hoursToday(loc, today, todayWeekNum, todayIsLastWeek) ?? "";
    case "phone":
      return loc.phone ?? "";
  }
}

export default function LocationsTable({
  rows,
  today,
  todayWeekNum,
  todayIsLastWeek,
  originLat,
  originLng,
}: {
  rows: Location[];
  today: Day;
  todayWeekNum: number;
  todayIsLastWeek: boolean;
  originLat?: number;
  originLng?: number;
}) {
  const hasOrigin = originLat != null && originLng != null;
  const [sort, setSort] = useState<{ key: SortKey; dir: Dir }>({ key: "title", dir: "asc" });

  // A distance search is submitted via URL navigation, which re-renders this
  // same component instance (not a remount) — a plain useState initializer
  // wouldn't notice. Adjust the sort during render when the origin changes
  // (new search, new radius, or cleared), per React's documented pattern for
  // resetting state on a prop change without an Effect.
  const [prevOrigin, setPrevOrigin] = useState([originLat, originLng]);
  if (prevOrigin[0] !== originLat || prevOrigin[1] !== originLng) {
    setPrevOrigin([originLat, originLng]);
    setSort({ key: hasOrigin ? "distance" : "title", dir: "asc" });
  }

  const COLUMNS: { key: SortKey; label: string }[] = [
    { key: "title", label: "Name" },
    { key: "region", label: "Area" },
    ...(hasOrigin ? ([{ key: "distance", label: "Distance" }] as { key: SortKey; label: string }[]) : []),
    { key: "days", label: "Days Open" },
    { key: "today", label: "Hours Today" },
    { key: "phone", label: "Phone" },
  ];

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const va = sortValue(a, sort.key, today, todayWeekNum, todayIsLastWeek, originLat, originLng);
      const vb = sortValue(b, sort.key, today, todayWeekNum, todayIsLastWeek, originLat, originLng);
      const c = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sort.dir === "asc" ? c : -c;
    });
  }, [rows, sort, today, todayWeekNum, todayIsLastWeek, originLat, originLng]);

  function toggle(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  return (
    <>
      {/* Mobile: stacked cards. Sortable table below md instead of a
          horizontally-scrolling table, which is a poor fit for a small
          screen someone's checking on the go. */}
      <div className="grid gap-3 sm:hidden">
        {sorted.map((loc) => {
          const today_ = hoursToday(loc, today, todayWeekNum, todayIsLastWeek);
          const dist = distanceMiles(loc, originLat, originLng);
          return (
            <div key={loc.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
              <Link href={`/locations/${loc.id}`} className="font-medium text-blue-600 hover:underline">
                {loc.title}
              </Link>
              <div className="mt-0.5 text-xs opacity-60">
                {loc.address}, {loc.city}, OH {loc.zip}
                {dist != null && ` — ${formatMiles(dist)} away`}
              </div>
              <div className="mt-2 text-xs">
                <span className="font-semibold opacity-70">Today: </span>
                {today_ || <span className="opacity-30">Closed</span>}
              </div>
              <div className="mt-1 text-xs opacity-60">
                Open:{" "}
                {openDays(loc).length ? (
                  openDays(loc)
                    .map((d) => DAY_LABELS[d])
                    .join(", ")
                ) : (
                  <span className="opacity-30">—</span>
                )}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {loc.region && <span className="opacity-70">{REGION_LABELS[loc.region]}</span>}
                {loc.phone && (
                  <a href={`tel:${loc.phone}`} className="text-blue-600 hover:underline">
                    {loc.phone}
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop/tablet: sortable table */}
      <div className="hidden overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-left text-xs uppercase tracking-wide opacity-60">
              {COLUMNS.map((col) => (
                <th key={col.key} className="px-4 py-2 font-semibold">
                  <button
                    type="button"
                    onClick={() => toggle(col.key)}
                    className="inline-flex items-center gap-1 hover:opacity-100"
                  >
                    {col.label}
                    <span className="w-2">{sort.key === col.key ? (sort.dir === "asc" ? "▲" : "▼") : ""}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {sorted.map((loc) => {
              const dist = distanceMiles(loc, originLat, originLng);
              return (
                <tr key={loc.id} className="align-middle">
                  <td className="px-4 py-2">
                    <Link href={`/locations/${loc.id}`} className="text-blue-600 hover:underline">
                      <span className="font-medium">{loc.title}</span>
                    </Link>
                    <div className="text-xs opacity-60">
                      {loc.address}, {loc.city}, OH {loc.zip}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-xs opacity-70">
                    {loc.region ? REGION_LABELS[loc.region] : <span className="opacity-30">—</span>}
                  </td>
                  {hasOrigin && (
                    <td className="px-4 py-2 text-xs opacity-70">
                      {dist != null ? formatMiles(dist) : <span className="opacity-30">—</span>}
                    </td>
                  )}
                  <td className="px-4 py-2 text-xs">
                    {openDays(loc).length ? (
                      openDays(loc)
                        .map((d) => DAY_LABELS[d])
                        .join(", ")
                    ) : (
                      <span className="opacity-30">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs">
                    {hoursToday(loc, today, todayWeekNum, todayIsLastWeek) || (
                      <span className="opacity-30">Closed</span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs opacity-70">
                    {loc.phone ?? <span className="opacity-30">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
