"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import type { Location } from "@/lib/db";
import { REGION_LABELS, DAY_ORDER, DAY_LABELS } from "./constants";

type SortKey = "title" | "region" | "days" | "phone";
type Dir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "title", label: "Name" },
  { key: "region", label: "Area" },
  { key: "days", label: "Days Open" },
  { key: "phone", label: "Phone" },
];

function openDays(loc: Location): string[] {
  return DAY_ORDER.filter((d) => {
    const val = loc[`${d}_hours` as keyof Location] as string | null;
    return !!val && val.trim() !== "";
  });
}

function sortValue(loc: Location, key: SortKey): string {
  switch (key) {
    case "title":
      return loc.title.toLowerCase();
    case "region":
      return REGION_LABELS[loc.region];
    case "days":
      return openDays(loc).join(",");
    case "phone":
      return loc.phone ?? "";
  }
}

export default function LocationsTable({ rows }: { rows: Location[] }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: Dir }>({ key: "title", dir: "asc" });

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const c = sortValue(a, sort.key).localeCompare(sortValue(b, sort.key));
      return sort.dir === "asc" ? c : -c;
    });
  }, [rows, sort]);

  function toggle(key: SortKey) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
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
          {sorted.map((loc) => (
            <tr key={loc.id} className="align-middle">
              <td className="px-4 py-2">
                <Link href={`/locations/${loc.id}`} className="hover:underline">
                  <span className="font-medium">{loc.title}</span>
                </Link>
                <div className="text-xs opacity-60">
                  {loc.address}, {loc.city}
                </div>
              </td>
              <td className="px-4 py-2 text-xs opacity-70">{REGION_LABELS[loc.region]}</td>
              <td className="px-4 py-2 text-xs">
                {openDays(loc).length ? (
                  openDays(loc)
                    .map((d) => DAY_LABELS[d])
                    .join(", ")
                ) : (
                  <span className="opacity-30">—</span>
                )}
              </td>
              <td className="px-4 py-2 text-xs opacity-70">
                {loc.phone ?? <span className="opacity-30">—</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
