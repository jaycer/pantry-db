import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocation, type Location } from "@/lib/db";
import { REGION_LABELS, DAY_ORDER, DAY_LABELS_FULL } from "../../components/constants";

export const dynamic = "force-dynamic";

export default async function LocationPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  const loc = getLocation(id);
  if (!loc) notFound();

  // JS getDay(): 0=Sunday..6=Saturday; DAY_ORDER starts at Monday.
  const jsDay = new Date().getDay();
  const todayIndex = (jsDay + 6) % 7;
  const today = DAY_ORDER[todayIndex];

  const mapsHref = `https://maps.google.com/?q=${encodeURIComponent(`${loc.address}, ${loc.city}, OH ${loc.zip}`)}`;
  // Preserves whatever filters/sort were active on the dashboard when the
  // user navigated here (see LocationsTable's `from` param), so "back" is
  // idempotent regardless of whether you use this link or the browser's
  // back button.
  const backHref = from ? `/?${from}` : "/";

  return (
    <div className="space-y-6">
      <div>
        <Link href={backHref} className="text-sm opacity-60 hover:opacity-100">
          ← All locations
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-bold sm:text-2xl">{loc.title}</h1>
          <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-800 dark:bg-slate-700 dark:text-slate-100">
            {loc.category}
          </span>
          {loc.region && (
            <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
              {REGION_LABELS[loc.region]}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-70">
          <a href={mapsHref} target="_blank" className="text-blue-600 hover:underline">
            {loc.address}, {loc.city}, OH {loc.zip} ↗
          </a>
          {loc.phone && (
            <a href={`tel:${loc.phone}`} className="text-blue-600 hover:underline">
              {loc.phone}
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Hours">
          <ul className="space-y-1 text-sm">
            {DAY_ORDER.map((d) => {
              const hours = loc[`${d}_hours` as keyof Location] as string | null;
              const isToday = d === today;
              return (
                <li
                  key={d}
                  className={`flex justify-between gap-4 rounded px-2 py-1 ${
                    isToday ? "bg-emerald-50 dark:bg-emerald-950/40" : ""
                  }`}
                >
                  <span className={`font-medium ${isToday ? "" : "opacity-70"}`}>
                    {DAY_LABELS_FULL[d]}
                    {isToday && <span className="ml-1 text-xs opacity-60">(today)</span>}
                  </span>
                  <span className={hours ? "" : "opacity-30"}>{hours || "Closed"}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card title="Notes">
          {loc.notes ? (
            <p className="whitespace-pre-wrap text-sm">{loc.notes}</p>
          ) : (
            <p className="text-sm opacity-50">No notes.</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 p-4">
      <h2 className="mb-3 text-sm font-bold uppercase tracking-wide opacity-70">{title}</h2>
      {children}
    </div>
  );
}
