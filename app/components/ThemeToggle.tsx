"use client";
import { useSyncExternalStore } from "react";

type Theme = "system" | "light" | "dark";
const ORDER: Theme[] = ["system", "light", "dark"];
const ICONS: Record<Theme, string> = { system: "◐", light: "☀", dark: "☾" };

function apply(theme: Theme) {
  const dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

function read(): Theme {
  const stored = localStorage.getItem("theme") as Theme | null;
  return stored && ORDER.includes(stored) ? stored : "system";
}

const listeners = new Set<() => void>();
function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onMedia = () => apply(read());
  mq.addEventListener("change", onMedia);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    mq.removeEventListener("change", onMedia);
    window.removeEventListener("storage", onChange);
  };
}

export default function ThemeToggle() {
  // getServerSnapshot returns null so SSR and hydration render a placeholder,
  // then the client re-renders with the stored theme — no mismatch.
  const theme = useSyncExternalStore(subscribe, read, () => null);

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme ?? "system") + 1) % ORDER.length];
    if (next === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", next);
    apply(next);
    listeners.forEach((cb) => cb());
  }

  // Render a fixed-width placeholder until mounted so the label never mismatches.
  return (
    <button
      onClick={cycle}
      title={theme ? `Theme: ${theme} (click to change)` : "Theme"}
      className="ml-auto w-20 rounded-full border border-slate-300 dark:border-slate-700 px-2 py-1 text-xs opacity-70 hover:opacity-100"
    >
      {theme ? `${ICONS[theme]} ${theme}` : "…"}
    </button>
  );
}
