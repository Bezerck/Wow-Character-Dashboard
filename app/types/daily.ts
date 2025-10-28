export interface DailyTask {
  id: string;
  name: string;
  createdAt: number; // epoch ms
}

export interface DailyState {
  region: "us" | "eu";
  tasks: DailyTask[];
  // completions keyed by cycleKey -> Set of task ids completed in that daily cycle
  completions: Record<string, string[]>; // store arrays for JSON friendliness
}

// Base key; per-character we append :<characterId>
export const DAILY_STORAGE_KEY = "wow_daily_tracker_state_v1";
