"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Day, Location } from "@/lib/db";
import { REGION_LABELS, DAY_ORDER, DAY_LABELS, type SortKey, type SortDir } from "./constants";
import { occursThisWeek } from "@/lib/parse-schedule";
import { haversineMiles, formatMiles } from "@/lib/distance";
import { residencyLabel } from "@/lib/eligibility-format";

function EligibilityBadge({ loc }: { loc: Location }) {
  const label = residencyLabel(loc.residency_cities);
  if (!label) return null;
  return (
    <span
      title={loc.eligibility_note ?? undefined}
      className="ml-2 inline-block whitespace-nowrap rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-950/50 dark:text-amber-300"
    >
      {label}
    </span>
  );
}

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
  sort,
  dir,
}: {
  rows: Location[];
  today: Day;
  todayWeekNum: number;
  todayIsLastWeek: boolean;
  originLat?: number;
  originLng?: number;
  sort: SortKey;
  dir: SortDir;
}) {
  const hasOrigin = originLat != null && originLng != null;
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sort lives in the URL (like every other filter on this site), not local
  // component state — that's what makes "click a sort header, open a
  // location, hit back" idempotent: the sort is part of the page's address,
  // not state that resets on remount.
  function toggle(key: SortKey) {
    const nextDir: SortDir = sort === key && dir === "asc" ? "desc" : "asc";
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", key);
    params.set("dir", nextDir);
    router.push(`/?${params.toString()}`);
  }

  // Carries the current filters/sort along to the detail page as `from`, so
  // its "← All locations" link can return to this exact view.
  const currentQuery = searchParams.toString();
  function detailHref(id: number) {
    return currentQuery ? `/locations/${id}?from=${encodeURIComponent(currentQuery)}` : `/locations/${id}`;
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
      const va = sortValue(a, sort, today, todayWeekNum, todayIsLastWeek, originLat, originLng);
      const vb = sortValue(b, sort, today, todayWeekNum, todayIsLastWeek, originLat, originLng);
      const c = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return dir === "asc" ? c : -c;
    });
  }, [rows, sort, dir, today, todayWeekNum, todayIsLastWeek, originLat, originLng]);

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
              <Link href={detailHref(loc.id)} className="font-medium text-blue-600 hover:underline">
                {loc.title}
              </Link>
              <EligibilityBadge loc={loc} />
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
                    <span className="w-2">{sort === col.key ? (dir === "asc" ? "▲" : "▼") : ""}</span>
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
                    <Link href={detailHref(loc.id)} className="text-blue-600 hover:underline">
                      <span className="font-medium">{loc.title}</span>
                    </Link>
                    <EligibilityBadge loc={loc} />
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
