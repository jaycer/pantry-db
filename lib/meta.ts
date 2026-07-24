// Data-freshness metadata. `scrapedAt` is when the GCFB source was last pulled
// (maintained in data/gcfb-meta.json by scripts/scrape.mjs); `compiledAt` is
// when this database/export was built. Both are surfaced in the UI, the static
// export, and the PDFs so a viewer can judge how current the data is.
import fs from "node:fs";
import path from "node:path";

export interface DataMeta {
  source: string;
  scrapedAt: string | null; // ISO date the source was last fetched
  compiledAt: string; // ISO datetime this build ran
}

export function dataMeta(): DataMeta {
  let scrapedAt: string | null = null;
  try {
    const raw = JSON.parse(fs.readFileSync(path.join(process.cwd(), "data", "gcfb-meta.json"), "utf8"));
    if (typeof raw.scrapedAt === "string") scrapedAt = raw.scrapedAt;
  } catch {
    scrapedAt = null;
  }
  return { source: "Greater Cleveland Food Bank", scrapedAt, compiledAt: new Date().toISOString() };
}

/** A short, human "as of" string for a footer/subtitle. */
export function freshnessLine(meta: { scrapedAt: string | null; compiledAt: string }): string {
  const d = (s: string) => new Date(s).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const src = meta.scrapedAt ? `source as of ${d(meta.scrapedAt)}` : "source date unknown";
  return `Data from Greater Cleveland Food Bank · ${src} · compiled ${d(meta.compiledAt)}. Hours change — call ahead.`;
}
