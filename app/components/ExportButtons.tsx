"use client";
import { useState } from "react";
import type { PantryRecord } from "@/lib/pdf/model";

// Client-side PDF export. The pdf-lib-backed builders are dynamically imported
// on click so they stay out of the initial bundle. Both PDFs cover the whole
// directory (not the current filter), matching the "all ~400 locations" intent.
export default function ExportButtons({
  records,
  scrapedAt,
}: {
  records: PantryRecord[];
  scrapedAt?: string | null;
}) {
  const [busy, setBusy] = useState<null | "full" | "booklet">(null);

  async function make(kind: "full" | "booklet") {
    setBusy(kind);
    try {
      const meta = { scrapedAt };
      const bytes =
        kind === "full"
          ? await (await import("@/lib/pdf/full-pager")).buildFullPagerPdf(records, meta)
          : await (await import("@/lib/pdf/booklet")).buildBookletPdf(records, meta);
      const blob = new Blob([bytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        kind === "full"
          ? "cleveland-food-resources.pdf"
          : "cleveland-food-resources-booklet.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export failed", err);
      alert("Sorry — the PDF couldn't be generated. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  const cls =
    "rounded border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" className={cls} disabled={busy !== null} onClick={() => make("full")}>
        {busy === "full" ? "Building…" : "↓ Full-pager PDF"}
      </button>
      <button type="button" className={cls} disabled={busy !== null} onClick={() => make("booklet")}>
        {busy === "booklet" ? "Building…" : "↓ Booklet PDF"}
      </button>
      <span className="text-xs opacity-50">all {records.length} locations</span>
    </div>
  );
}
