// Utility functions for WoW weekly reset cycles.
// Reset schedule (UTC):
//  - North America / Latin America / Oceanic: Tuesday 15:00 UTC (08:00 Pacific)
//  - Europe: Wednesday 04:00 UTC (08:00 CET)
// We expose helpers mirroring dailyReset.ts so the tracker component can stay parallel.

export type WeeklyRegionCode = "us" | "eu";

// Determine current weekly boundary start (the most recent reset moment).
export function getCurrentWeeklyResetBoundary(
  region: WeeklyRegionCode,
  now: Date = new Date()
): Date {
  // Define weekday index (0=Sunday ... 6=Saturday). Resets occur Tuesday or Wednesday.
  // We'll compute the Date for this week's reset and if now is before it, subtract 7 days.
  const resetWeekday = region === "us" ? 2 : 3; // Tuesday=2, Wednesday=3
  const resetHourUTC = region === "us" ? 15 : 4; // hours UTC

  // Start from 'now' but with hour set to the reset hour; then shift to target weekday.
  const boundary = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      resetHourUTC,
      0,
      0
    )
  );
  const currentWeekday = now.getUTCDay();

  // Adjust boundary date to this week's target weekday.
  const diffDays = resetWeekday - currentWeekday;
  boundary.setUTCDate(boundary.getUTCDate() + diffDays);

  // After adjustment, if now precedes the calculated boundary, we are still before this week's reset so use previous week's boundary (subtract 7 days).
  if (now.getTime() < boundary.getTime()) {
    boundary.setUTCDate(boundary.getUTCDate() - 7);
  }
  return boundary;
}

export function getNextWeeklyReset(
  region: WeeklyRegionCode,
  now: Date = new Date()
): Date {
  const boundary = getCurrentWeeklyResetBoundary(region, now);
  const next = new Date(boundary.getTime());
  next.setUTCDate(next.getUTCDate() + 7);
  return next;
}

// Cycle key for weekly storage segregation: weekly|region|YYYY-MM-DD
export function getWeeklyCycleKey(
  region: WeeklyRegionCode,
  now: Date = new Date()
): string {
  const boundary = getCurrentWeeklyResetBoundary(region, now);
  const y = boundary.getUTCFullYear();
  const m = String(boundary.getUTCMonth() + 1).padStart(2, "0");
  const d = String(boundary.getUTCDate()).padStart(2, "0");
  return `weekly|${region}|${y}-${m}-${d}`;
}

export function formatWeeklyCountdown(
  target: Date,
  now: Date = new Date()
): string {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return "Reset passed";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  return `${days}d ${hours}h ${mins}m`;
}
