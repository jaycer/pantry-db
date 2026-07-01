// Per-location phone corrections, for cases where the scraped `phone`
// field is corrupted or unparseable and the correct number was verified
// against an external source. Keyed by the GCFB source id, applied after
// normalizePhone().
const PHONE_OVERRIDES: Record<number, string> = {
  // Source data was two numbers smashed together ("216.351.63760/216.789.244").
  // Verified via plcparma.org (Parma Lutheran Church's own site), which lists
  // this as the number for scheduling appointments/inquiries at the Hunger
  // Center specifically — preferred over third-party directories that all
  // list the older 216-351-6376.
  223: "216-316-5772", // Parma Hunger Center
};

export function overridePhone(id: number, phone: string | null): string | null {
  return PHONE_OVERRIDES[id] ?? phone;
}
