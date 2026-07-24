"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RADIUS_OPTIONS, RADIUS_LABELS } from "./constants";

export default function DistanceFilter({
  category,
  region,
  day,
  city,
  reside,
  addr,
  radius,
}: {
  category?: string;
  region?: string;
  day?: string;
  city?: string;
  reside?: string;
  addr?: string;
  radius?: string;
}) {
  const router = useRouter();
  const [address, setAddress] = useState(addr ?? "");
  const [radiusValue, setRadiusValue] = useState(radius ?? "10");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = address.trim();
    if (!trimmed) return;
    setStatus("loading");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) throw new Error("bad response");
      const results = await res.json();
      if (!Array.isArray(results) || results.length === 0) {
        setStatus("error");
        setErrorMsg("Couldn't find that address — try adding city and zip.");
        return;
      }
      const { lat, lon } = results[0];
      const params = new URLSearchParams();
      if (category) params.set("category", category);
      if (region) params.set("region", region);
      if (day) params.set("day", day);
      if (city) params.set("city", city);
      if (reside) params.set("reside", reside);
      params.set("lat", lat);
      params.set("lng", lon);
      params.set("radius", radiusValue);
      params.set("addr", trimmed);
      // A new search defaults to nearest-first, overriding whatever sort
      // (if any) was previously active.
      params.set("sort", "distance");
      params.set("dir", "asc");
      setStatus("idle");
      router.push(`/?${params.toString()}`);
    } catch {
      setStatus("error");
      setErrorMsg("Something went wrong looking up that address. Please try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 55 Public Square, Cleveland, OH 44113"
          className="w-full rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-xs sm:w-64"
        />
        <div className="flex items-center gap-2">
          <div className="relative inline-block">
            <select
              value={radiusValue}
              onChange={(e) => setRadiusValue(e.target.value)}
              className="appearance-none rounded border border-slate-300 dark:border-slate-700 bg-transparent py-1 pl-2 pr-6 text-xs"
            >
              {RADIUS_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {RADIUS_LABELS[String(r)]}
                </option>
              ))}
              <option value="any">{RADIUS_LABELS.any}</option>
            </select>
            <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] opacity-60">
              ▾
            </span>
          </div>
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {status === "loading" ? "Searching…" : "Search"}
          </button>
        </div>
      </div>
      {status === "error" && <p className="text-xs text-rose-600 dark:text-rose-400">{errorMsg}</p>}
    </form>
  );
}
