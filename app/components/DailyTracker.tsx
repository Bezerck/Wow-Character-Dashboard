"use client";
import React, { useEffect, useState, useCallback } from "react";
import { DAILY_STORAGE_KEY, DailyState, DailyTask } from "../types/daily";
import {
  getDailyCycleKey,
  getNextReset,
  formatCountdown,
  inferRegionFromRealm,
} from "../utils/dailyReset";

const defaultState: DailyState = {
  region: "us", // will be overridden by realm inference
  tasks: [
    {
      id: crypto.randomUUID(),
      name: "Tillers Farm",
      createdAt: Date.now(),
    },
  ],
  completions: {},
};

function loadState(storageKey: string): DailyState {
  if (typeof window === "undefined") return { ...defaultState };
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { ...defaultState };
    const parsed: DailyState = JSON.parse(raw);
    if (!parsed.tasks) parsed.tasks = [];
    if (!parsed.completions) parsed.completions = {};
    if (parsed.region !== "us" && parsed.region !== "eu") parsed.region = "us";
    return parsed;
  } catch {
    return { ...defaultState };
  }
}

function persist(state: DailyState, storageKey: string) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {}
}

export const DailyTracker: React.FC<{
  realm?: string;
  characterId?: string;
}> = ({ realm, characterId }) => {
  const storageKey = characterId
    ? `${DAILY_STORAGE_KEY}:${characterId}`
    : DAILY_STORAGE_KEY;
  const [state, setState] = useState<DailyState>(() => loadState(storageKey));
  // Reload when storageKey changes (tab switch)
  useEffect(() => {
    setState(loadState(storageKey));
  }, [storageKey]);
  // Derive region from realm whenever realm changes.
  const derivedRegion = inferRegionFromRealm(realm);
  const [cycleKey, setCycleKey] = useState<string>(() =>
    getDailyCycleKey(derivedRegion)
  );
  const [newTaskName, setNewTaskName] = useState("");
  const [countdown, setCountdown] = useState<string>("");

  // Recompute cycle key when region changes or at reset boundary
  // Update region in state if derived differs
  useEffect(() => {
    setState((prev) =>
      prev.region === derivedRegion ? prev : { ...prev, region: derivedRegion }
    );
  }, [derivedRegion]);

  useEffect(() => {
    const key = getDailyCycleKey(derivedRegion);
    setCycleKey(key);
  }, [derivedRegion]);

  // Countdown timer
  useEffect(() => {
    function tick() {
      const next = getNextReset(derivedRegion);
      setCountdown(formatCountdown(next));
      const latestKey = getDailyCycleKey(derivedRegion);
      if (latestKey !== cycleKey) setCycleKey(latestKey);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [derivedRegion, cycleKey]);

  // Persist on change
  useEffect(() => {
    persist(state, storageKey);
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
          Daily Tracker
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
          placeholder="Add a daily task..."
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
                aria-label="Remove task"
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

export default DailyTracker;
