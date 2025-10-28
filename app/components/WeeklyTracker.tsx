"use client";
import React, { useEffect, useState, useCallback } from "react";
import { inferRegionFromRealm } from "../utils/dailyReset"; // reuse realm inference
import {
  getWeeklyCycleKey,
  getNextWeeklyReset,
  formatWeeklyCountdown,
} from "../utils/weeklyReset";

// Types kept local; could be hoisted to a shared types file if re-used.
interface WeeklyTask {
  id: string;
  name: string;
  createdAt: number;
}
interface WeeklyState {
  region: "us" | "eu";
  tasks: WeeklyTask[];
  completions: Record<string, string[]>; // cycleKey -> taskIds completed that week
}

const WEEKLY_STORAGE_KEY = "wow_weekly_tracker";

// Default starter state with a sample weekly objective.
const defaultWeeklyState: WeeklyState = {
  region: "us",
  tasks: [
    { id: crypto.randomUUID(), name: "Sha of Anger", createdAt: Date.now() },
  ],
  completions: {},
};

// Load persisted weekly state.
function loadWeeklyState(storageKey: string): WeeklyState {
  if (typeof window === "undefined") return { ...defaultWeeklyState };
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { ...defaultWeeklyState };
    const parsed: WeeklyState = JSON.parse(raw);
    if (!parsed.tasks) parsed.tasks = [];
    if (!parsed.completions) parsed.completions = {};
    if (parsed.region !== "us" && parsed.region !== "eu") parsed.region = "us";
    return parsed;
  } catch {
    return { ...defaultWeeklyState };
  }
}

// Persist weekly state -> localStorage.
function persistWeekly(state: WeeklyState, storageKey: string) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {}
}

export const WeeklyTracker: React.FC<{
  realm?: string;
  characterId?: string;
}> = ({ realm, characterId }) => {
  const storageKey = characterId
    ? `${WEEKLY_STORAGE_KEY}:${characterId}`
    : WEEKLY_STORAGE_KEY;
  const [state, setState] = useState<WeeklyState>(() =>
    loadWeeklyState(storageKey)
  );
  // Reload when storage key changes (tab switch)
  useEffect(() => {
    setState(loadWeeklyState(storageKey));
  }, [storageKey]);

  const derivedRegion = inferRegionFromRealm(realm);
  const [cycleKey, setCycleKey] = useState<string>(() =>
    getWeeklyCycleKey(derivedRegion)
  );
  const [newTaskName, setNewTaskName] = useState("");
  const [countdown, setCountdown] = useState<string>("");

  // Update region in state if derivation changes
  useEffect(() => {
    setState((prev) =>
      prev.region === derivedRegion ? prev : { ...prev, region: derivedRegion }
    );
  }, [derivedRegion]);

  // Recompute cycle key when region changes
  useEffect(() => {
    const key = getWeeklyCycleKey(derivedRegion);
    setCycleKey(key);
  }, [derivedRegion]);

  // Countdown timer + cycle rollover detection
  useEffect(() => {
    function tick() {
      const next = getNextWeeklyReset(derivedRegion);
      setCountdown(formatWeeklyCountdown(next));
      const latestKey = getWeeklyCycleKey(derivedRegion);
      if (latestKey !== cycleKey) setCycleKey(latestKey);
    }
    tick();
    const id = setInterval(tick, 1000 * 60); // minute granularity enough for weekly
    return () => clearInterval(id);
  }, [derivedRegion, cycleKey]);

  // Persist on state change
  useEffect(() => {
    persistWeekly(state, storageKey);
  }, [state, storageKey]);

  const toggleCompletion = useCallback(
    (taskId: string) => {
      setState((prev) => {
        const list = prev.completions[cycleKey]
          ? [...prev.completions[cycleKey]]
          : [];
        const idx = list.indexOf(taskId);
        if (idx >= 0) list.splice(idx, 1);
        else list.push(taskId);
        const completions = { ...prev.completions, [cycleKey]: list };
        return { ...prev, completions };
      });
    },
    [cycleKey]
  );

  const addTask = useCallback(() => {
    const name = newTaskName.trim();
    if (!name) return;
    setState((prev) => ({
      ...prev,
      tasks: [
        ...prev.tasks,
        { id: crypto.randomUUID(), name, createdAt: Date.now() },
      ],
    }));
    setNewTaskName("");
  }, [newTaskName]);

  const removeTask = useCallback((taskId: string) => {
    setState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
      completions: Object.fromEntries(
        Object.entries(prev.completions).map(([k, arr]) => [
          k,
          arr.filter((id) => id !== taskId),
        ])
      ),
    }));
  }, []);

  const completedIds = state.completions[cycleKey] || [];
  const completionPct = state.tasks.length
    ? Math.round((completedIds.length / state.tasks.length) * 100)
    : 0;

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-lg font-semibold whitespace-nowrap flex-shrink-0">
          Weekly Tracker
        </h2>
        <div className="flex flex-wrap gap-3 items-center text-xs ml-auto md:ml-0">
          <div className="text-gray-400">
            Next Reset:{" "}
            <span className="text-indigo-400 font-mono">{countdown}</span>
          </div>
          <div className="text-gray-400">
            Progress:{" "}
            <span className="text-green-400 font-semibold">
              {completedIds.length}/{state.tasks.length} ({completionPct}%)
            </span>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Add a weekly task..."
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          onClick={addTask}
          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded border border-indigo-500"
        >
          Add
        </button>
      </div>
      {state.tasks.length === 0 && (
        <p className="text-xs text-gray-400">No tasks yet. Add one above.</p>
      )}
      <ul className="divide-y divide-gray-700">
        {state.tasks.map((task) => {
          const done = completedIds.includes(task.id);
          return (
            <li
              key={task.id}
              className="py-2 flex items-center justify-between gap-4"
            >
              <button
                onClick={() => toggleCompletion(task.id)}
                className={`flex-1 text-left text-sm transition-colors rounded px-2 py-1 ${
                  done
                    ? "bg-green-700/50 text-green-200 border border-green-600"
                    : "bg-gray-900 text-gray-300 border border-gray-700 hover:border-indigo-500"
                }`}
              >
                {done ? "✅ " : ""}
                {task.name}
              </button>
              <button
                onClick={() => removeTask(task.id)}
                className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white"
                aria-label="Remove weekly task"
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default WeeklyTracker;
