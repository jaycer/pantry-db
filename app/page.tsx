import Link from "next/link";
import { listLocations, type Location } from "@/lib/db";
import {
  CATEGORY_ORDER,
  CATEGORY_SLUGS,
  CATEGORY_TO_SLUG,
  REGION_ORDER,
  REGION_LABELS,
  DAY_ORDER,
  DAY_LABELS,
  isRegion,
  isDay,
} from "./components/constants";
import LocationsTable from "./components/LocationsTable";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; region?: string; day?: string }>;
}) {
  const { category, region, day } = await searchParams;
  const activeCategory = category ? CATEGORY_SLUGS[category] : undefined;
  const activeRegion = isRegion(region) ? region : undefined;
  const activeDay = isDay(day) ? day : undefined;

  const locations = listLocations({
    category: activeCategory,
    region: activeRegion,
    day: activeDay,
  });

  const byCategory = new Map<string, Location[]>();
  for (const c of CATEGORY_ORDER) byCategory.set(c, []);
  for (const loc of locations) byCategory.get(loc.category)?.push(loc);

  function qs(overrides: { category?: string; region?: string; day?: string }) {
    const params = new URLSearchParams();
    const next = {
      category: overrides.category !== undefined ? overrides.category : category,
      region: overrides.region !== undefined ? overrides.region : region,
      day: overrides.day !== undefined ? overrides.day : day,
    };
    if (next.category) params.set("category", next.category);
    if (next.region) params.set("region", next.region);
    if (next.day) params.set("day", next.day);
    const s = params.toString();
    return s ? `/?${s}` : "/";
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <FilterRow label="Category">
          <FilterLink href={qs({ category: "" })} label="All" active={!activeCategory} />
          {CATEGORY_ORDER.map((c) => (
            <FilterLink
              key={c}
              href={qs({ category: CATEGORY_TO_SLUG[c] })}
              label={c}
              active={activeCategory === c}
            />
          ))}
        </FilterRow>
        <FilterRow label="Region">
          <FilterLink href={qs({ region: "" })} label="All" active={!activeRegion} />
          {REGION_ORDER.map((r) => (
            <FilterLink
              key={r}
              href={qs({ region: r })}
              label={REGION_LABELS[r]}
              active={activeRegion === r}
            />
          ))}
        </FilterRow>
        <FilterRow label="Day">
          <FilterLink href={qs({ day: "" })} label="All" active={!activeDay} />
          {DAY_ORDER.map((d) => (
            <FilterLink key={d} href={qs({ day: d })} label={DAY_LABELS[d]} active={activeDay === d} />
          ))}
        </FilterRow>
      </div>

      {locations.length === 0 && (
        <p className="opacity-60">No locations match these filters. Try clearing one of them.</p>
      )}

      {CATEGORY_ORDER.map((c) => {
        const rows = byCategory.get(c)!;
        if (!rows.length) return null;
        return (
          <section key={c}>
            <h2 className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wide opacity-70">
              {c}
              <span className="opacity-50">{rows.length}</span>
            </h2>
            <LocationsTable rows={rows} />
          </section>
        );
      })}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide opacity-50">
        {label}
      </span>
      {children}
    </div>
  );
}

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1 text-xs ${
        active
          ? "bg-blue-600 text-white"
          : "border border-slate-300 dark:border-slate-700 opacity-70 hover:opacity-100"
      }`}
    >
      {label}
    </Link>
  );
}
