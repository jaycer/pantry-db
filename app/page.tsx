import Link from "next/link";
import { listLocations, listCities, type Location } from "@/lib/db";
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
  isRadiusValue,
} from "./components/constants";
import LocationsTable from "./components/LocationsTable";
import CityFilter from "./components/CityFilter";
import DistanceFilter from "./components/DistanceFilter";
import { weekOfMonth, isLastOccurrenceOfWeekdayInMonth } from "@/lib/parse-schedule";
import { haversineMiles } from "@/lib/distance";

export const dynamic = "force-dynamic";

function parseFiniteInRange(v: string | undefined, min: number, max: number): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    region?: string;
    day?: string;
    city?: string;
    lat?: string;
    lng?: string;
    radius?: string;
    addr?: string;
  }>;
}) {
  const { category, region, day, city, lat, lng, radius, addr } = await searchParams;
  const activeCategory = category ? CATEGORY_SLUGS[category] : undefined;
  const activeRegion = isRegion(region) ? region : undefined;
  const activeDay = isDay(day) ? day : undefined;
  const cities = listCities();
  const activeCity = city && cities.includes(city) ? city : undefined;

  const activeLat = parseFiniteInRange(lat, -90, 90);
  const activeLng = parseFiniteInRange(lng, -180, 180);
  const activeRadius = isRadiusValue(radius) ? radius : undefined;
  const hasDistanceFilter = activeLat !== undefined && activeLng !== undefined && activeRadius !== undefined;

  const rawLocations = listLocations({
    category: activeCategory,
    region: activeRegion,
    day: activeDay,
    city: activeCity,
  });

  const locations = hasDistanceFilter
    ? rawLocations.filter((loc) => {
        if (loc.lat == null || loc.lng == null) return false;
        if (activeRadius === "any") return true;
        return haversineMiles(activeLat!, activeLng!, loc.lat, loc.lng) <= Number(activeRadius);
      })
    : rawLocations;

  const byCategory = new Map<string, Location[]>();
  for (const c of CATEGORY_ORDER) byCategory.set(c, []);
  for (const loc of locations) byCategory.get(loc.category)?.push(loc);

  // JS getDay(): 0=Sunday..6=Saturday; DAY_ORDER starts at Monday.
  const now = new Date();
  const jsDay = now.getDay();
  const today = DAY_ORDER[(jsDay + 6) % 7];
  const todayWeekNum = weekOfMonth(now);
  const todayIsLastWeek = isLastOccurrenceOfWeekdayInMonth(now);

  function qs(overrides: { category?: string; region?: string; day?: string; clearDistance?: boolean }) {
    const params = new URLSearchParams();
    const next = {
      category: overrides.category !== undefined ? overrides.category : category,
      region: overrides.region !== undefined ? overrides.region : region,
      day: overrides.day !== undefined ? overrides.day : day,
    };
    if (next.category) params.set("category", next.category);
    if (next.region) params.set("region", next.region);
    if (next.day) params.set("day", next.day);
    if (activeCity) params.set("city", activeCity);
    if (!overrides.clearDistance) {
      if (lat) params.set("lat", lat);
      if (lng) params.set("lng", lng);
      if (radius) params.set("radius", radius);
      if (addr) params.set("addr", addr);
    }
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
        <FilterRow label="City">
          <CityFilter
            cities={cities}
            value={activeCity}
            category={category}
            region={region}
            day={day}
            lat={lat}
            lng={lng}
            radius={radius}
            addr={addr}
          />
        </FilterRow>
        <FilterRow label="Distance">
          <DistanceFilter
            category={category}
            region={region}
            day={day}
            city={activeCity}
            addr={addr}
            radius={radius}
          />
          {hasDistanceFilter && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-3 py-1 text-xs text-white">
              Within {activeRadius === "any" ? "any distance" : `${activeRadius} mi`} of {addr || "location"}
              <Link href={qs({ clearDistance: true })} aria-label="Clear distance filter" className="ml-1">
                ×
              </Link>
            </span>
          )}
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
            <LocationsTable
              rows={rows}
              today={today}
              todayWeekNum={todayWeekNum}
              todayIsLastWeek={todayIsLastWeek}
              originLat={activeLat}
              originLng={activeLng}
            />
          </section>
        );
      })}
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <span className="text-xs font-semibold uppercase tracking-wide opacity-50 sm:w-20 sm:shrink-0">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
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
