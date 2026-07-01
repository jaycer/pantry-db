// The scraped `phone` field mixes formats: (216) 256-6412, 216.781.8262,
// 2162216174, 440 599 8908, extensions written as "x122" / "x 266" /
// "ext 361" / "ext. 1" / "extension 6", and occasional junk — a second
// (often truncated/malformed) number after a ";", or a parenthetical label
// like "(home)". This normalizes to "XXX-XXX-XXXX" (plus " xNNN" for a
// real extension), using only the primary number and dropping labels and
// unparseable trailing numbers. If the primary number isn't exactly 10
// digits (11 with a leading country-code 1), the original string is
// returned unchanged rather than guessing.
const EXTENSION = /(?:(?:ext\.?|extension)\.?\s*(\d+)|x\s*(\d+))\s*$/i;

export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;

  const primaryRaw = s.split(";")[0].trim();
  const extMatch = primaryRaw.match(EXTENSION);
  const ext = extMatch ? extMatch[1] ?? extMatch[2] : null;
  const beforeExt = extMatch ? primaryRaw.slice(0, extMatch.index) : primaryRaw;

  const digits = beforeExt.replace(/\D/g, "");
  let tenDigits: string | null = null;
  if (digits.length === 10) tenDigits = digits;
  else if (digits.length === 11 && digits[0] === "1") tenDigits = digits.slice(1);

  if (!tenDigits) return s;

  const formatted = `${tenDigits.slice(0, 3)}-${tenDigits.slice(3, 6)}-${tenDigits.slice(6)}`;
  return ext ? `${formatted} x${ext}` : formatted;
}
