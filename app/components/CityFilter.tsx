"use client";
import { useRouter } from "next/navigation";

export default function CityFilter({
  cities,
  value,
  category,
  region,
  day,
}: {
  cities: string[];
  value?: string;
  category?: string;
  region?: string;
  day?: string;
}) {
  const router = useRouter();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (region) params.set("region", region);
    if (day) params.set("day", day);
    if (e.target.value) params.set("city", e.target.value);
    const qs = params.toString();
    router.push(qs ? `/?${qs}` : "/");
  }

  return (
    <select
      value={value ?? ""}
      onChange={onChange}
      className="rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-xs"
    >
      <option value="">All</option>
      {cities.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
