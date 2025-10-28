// Utility functions for WoW daily reset cycles.
// Americas/Oceania reset: 15:00 UTC
// Europe reset: 07:00 UTC
// We compute a cycle key used to segregate daily completion state in localStorage.

export type RegionCode = "us" | "eu";

// Returns the Date (UTC) of the current reset boundary for given region.
// If now is after today's reset time, boundary is today's reset; else yesterday's.
export function getCurrentResetBoundary(
  region: RegionCode,
  now: Date = new Date()
): Date {
  const resetHour = region === "us" ? 15 : 7; // UTC hours
  const reset = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      resetHour,
      0,
      0
    )
  );
  if (now.getTime() < reset.getTime()) {
    // Use previous day
    reset.setUTCDate(reset.getUTCDate() - 1);
  }
  return reset;
}

// Returns next reset time (UTC) as Date
export function getNextReset(region: RegionCode, now: Date = new Date()): Date {
  const currentBoundary = getCurrentResetBoundary(region, now);
  const next = new Date(currentBoundary.getTime());
  next.setUTCDate(next.getUTCDate() + 1);
  return next;
}

// Cycle key for localStorage: region|YYYY-MM-DD (of boundary date)
export function getDailyCycleKey(
  region: RegionCode,
  now: Date = new Date()
): string {
  const boundary = getCurrentResetBoundary(region, now);
  const y = boundary.getUTCFullYear();
  const m = String(boundary.getUTCMonth() + 1).padStart(2, "0");
  const d = String(boundary.getUTCDate()).padStart(2, "0");
  return `${region}|${y}-${m}-${d}`;
}

export function formatCountdown(target: Date, now: Date = new Date()): string {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "Reset passed";
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${hours}h ${mins}m ${secs}s`;
}

// Realm -> region inference (Classic realms list used earlier in code). Default to 'eu' if not found.
const US_REALMS = [
  "Angerforge",
  "Arugal",
  "Ashkandi",
  "Atiesh",
  "Azuresong",
  "Benediction",
  "Bloodsail",
  "Earthfury",
  "Eranikus",
  "Faerlina",
  "Galakras",
  "Grobbulus",
  "Immerseus",
  "Lei",
  "Maladath",
  "Mankrik",
  "Myzrael",
  "Nazgrim",
  "Old",
  "Pagle",
  "Ra-den",
  "Remulos",
  "Skyfury",
  "Sulfuras",
  "Westfall",
  "Whitemane",
  "Windseeker",
  "Yojamba",
];

export function inferRegionFromRealm(realm?: string): RegionCode {
  if (!realm) return "us"; // fallback
  return US_REALMS.includes(realm) ? "us" : "eu";
}
