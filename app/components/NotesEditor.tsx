"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function NotesEditor({ id, notes }: { id: number; notes: string | null }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(notes ?? "");
  const [saved, setSaved] = useState(false);

  async function save() {
    await fetch(`/api/locations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes: value || null }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-3">
      <textarea
        className="w-full min-h-24 rounded border border-slate-300 dark:border-slate-700 bg-transparent px-2 py-1 text-sm"
        value={value}
        placeholder="Add notes about this location…"
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        onClick={save}
        disabled={pending}
        className="rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
      >
        {saved ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}
