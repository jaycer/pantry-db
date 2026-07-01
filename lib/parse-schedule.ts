// A day's hours text often carries a "which week of the month" qualifier
// before the weekday name — "Third Saturday 10:00 AM - 12:00 PM",
// "Second and Fourth Thursday...", "Second and Last Thursday...". Roughly
// half of all day-entries in the scraped data have one of these. Without
// parsing them, a "Hours Today" display would claim a location is open
// every Wednesday when it's really only open the 4th Wednesday.
const ORDINAL_WORDS: Record<string, number> = {
  first: 1,
  second: 2,
  third: 3,
  thrid: 3, // typo present in the source data
  fourth: 4,
  fifth: 5,
};

const WEEKDAY_NAMES = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

// 1-indexed: dates 1-7 are week 1, 8-14 are week 2, etc. A month can have a
// week 5 for weekdays that land on the 29th-31st.
export function weekOfMonth(date: Date): number {
  return Math.floor((date.getDate() - 1) / 7) + 1;
}

// True if `date` is the last occurrence of its weekday in its month (i.e.
// adding 7 days rolls into the next month).
export function isLastOccurrenceOfWeekdayInMonth(date: Date): boolean {
  const next = new Date(date);
  next.setDate(date.getDate() + 7);
  return next.getMonth() !== date.getMonth();
}

// Does this day's hours text apply on a date with the given week-of-month
// (1-5) and last-occurrence status? Text with no recognized qualifier
// (including formats we don't understand) is treated as applying every
// week — we'd rather show hours that might not apply today than hide
// hours that do.
export function occursThisWeek(hoursText: string, weekNum: number, isLast: boolean): boolean {
  const lower = hoursText.toLowerCase();
  const weekdayIdx = WEEKDAY_NAMES.findIndex((w) => new RegExp(`\\b${w}\\b`).test(lower));
  if (weekdayIdx === -1) return true;

  const prefix = lower.slice(0, lower.indexOf(WEEKDAY_NAMES[weekdayIdx])).trim();
  if (!prefix) return true;

  const words = prefix.split(/[\s,]+/).filter((w) => w && w !== "and");
  const ordinals = words.map((w) => ORDINAL_WORDS[w]).filter((n): n is number => n !== undefined);
  const hasLast = words.includes("last");
  if (!ordinals.length && !hasLast) return true;

  return ordinals.includes(weekNum) || (hasLast && isLast);
}
