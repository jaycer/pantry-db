"use client";
import { useRouter } from "next/navigation";

export default function CityFilter({
  cities,
  value,
  category,
  region,
  day,
  lat,
  lng,
  radius,
  addr,
  sort,
  dir,
}: {
  cities: string[];
  value?: string;
  category?: string;
  region?: string;
  day?: string;
  lat?: string;
  lng?: string;
  radius?: string;
  addr?: string;
  sort?: string;
  dir?: string;
}) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (region) params.set("region", region);
    if (day) params.set("day", day);
    if (e.target.value) params.set("city", e.target.value);
    if (lat) params.set("lat", lat);
    if (lng) params.set("lng", lng);
    if (radius) params.set("radius", radius);
    if (addr) params.set("addr", addr);
    if (sort) params.set("sort", sort);
    if (dir) params.set("dir", dir);
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <div className="relative inline-block">
      <select
        value={value ?? ""}
        onChange={onChange}
        className="appearance-none rounded border border-slate-300 dark:border-slate-700 bg-transparent py-1 pl-2 pr-6 text-xs"
      >
        <option value="">All</option>
        {cities.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] opacity-60">
        ▾
      </span>
    </div>
  );
}
