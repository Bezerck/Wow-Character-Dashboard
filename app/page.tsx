"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-toastify";
import CharacterTabsClean, {
  CharacterTabMeta,
} from "./components/CharacterTabsClean";
import { WowheadLink, WowheadGlyphLink } from "./components/WowheadLink";
import { CharacterData, GameDB, DBItem, DBEnchant, DBGem } from "./types/wow";
import { SLOT_LABELS } from "./constants";
import { getBisListForSpec, evaluateBisForSlot } from "./utils/bis";
import { setPatterns } from "./utils/setPatterns";
import { getGlyphInfo } from "./utils/glyphs";
import TalentDisplay from "./components/TalentDisplay";
import DailyTracker from "./components/DailyTracker";
import WeeklyTracker from "./components/WeeklyTracker";

export default function Page() {
  // Multi-character support
  const [characters, setCharacters] = useState<CharacterTabMeta[]>([]);
  const [activeCharId, setActiveCharId] = useState<string>("");
  const [rawInput, setRawInput] = useState<string>("");
  const [character, setCharacter] = useState<CharacterData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameDb, setGameDb] = useState<GameDB | null>(null);
  const [loadingDb, setLoadingDb] = useState<boolean>(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [wowSimsUrl, setWowSimsUrl] = useState<string>("");
  const [showWowsims, setShowWowsims] = useState<boolean>(false);
  const backgroundUrl = `https://render.worldofwarcraft.com/eu/profile-backgrounds/v2/armory_bg_class_${character?.class}.jpg`;
  // Id is on this format: "Player-4454-0519C305"
  // Take the last number "0519C305" and convert it to decimal
  const characterId = character?.id
    ? parseInt(character.id.split("-").pop() || "0", 16)
    : 0;
  // Normalize realm for URLs:
  // - replace spaces with hyphens
  // - insert hyphen between camelCase / PascalCase boundaries (e.g. MirageRaceway -> Mirage-Raceway)
  // - lowercase the result
  const formatRealmForUrl = (r?: string) =>
    (r || "")
      .replace(/\s+/g, "-")
      .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
      .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
      .toLowerCase();

  const avatarUrl = character?.id
    ? `https://render.worldofwarcraft.com/classic-eu/character/${formatRealmForUrl(
        character?.realm
      )}/${characterId % 256}/${characterId}-avatar.jpg`
    : "https://render.worldofwarcraft.com/shadow/avatar/9-1.jpg";

  // Lookup maps
  const [itemMap, setItemMap] = useState<Map<number, DBItem>>(new Map());
  const [enchantMap, setEnchantMap] = useState<Map<number, DBEnchant>>(
    new Map()
  );
  const [gemMap, setGemMap] = useState<Map<number, DBGem>>(new Map());

  // Load multi-characters from localStorage
  useEffect(() => {
    try {
      const savedArr = localStorage.getItem("wow_characters_multi");
      let loaded: CharacterTabMeta[] = [];
      if (savedArr) {
        loaded = JSON.parse(savedArr);
      }
      if (!loaded || !Array.isArray(loaded) || loaded.length === 0) {
        loaded = [{ id: crypto.randomUUID(), name: "Character 1", json: "" }];
      }
      setCharacters(loaded);
      const savedActive = localStorage.getItem("wow_char_active");
      const activeId =
        savedActive && loaded.find((c) => c.id === savedActive)
          ? savedActive
          : loaded[0].id;
      setActiveCharId(activeId);
      const activeChar = loaded.find((c) => c.id === activeId)!;
      setRawInput(activeChar.json);
      try {
        setCharacter(JSON.parse(activeChar.json));
      } catch {}
    } catch (e) {
      // If localStorage retrieval fails, start with an empty JSON input (no character shown)
      const fallback: CharacterTabMeta = {
        id: crypto.randomUUID(),
        name: "Character 1",
        json: "",
      };
      setCharacters([fallback]);
      setActiveCharId(fallback.id);
      setRawInput(fallback.json); // empty string
      setCharacter(null); // Do not attempt to parse empty string
    }
  }, []);

  // Persist characters array
  const persistCharacters = (arr: CharacterTabMeta[], activeId?: string) => {
    setCharacters(arr);
    localStorage.setItem("wow_characters_multi", JSON.stringify(arr));
    if (activeId) {
      setActiveCharId(activeId);
      localStorage.setItem("wow_char_active", activeId);
    }
  };

  // Tab actions
  const addCharacter = () => {
    const newChar: CharacterTabMeta = {
      id: crypto.randomUUID(),
      name: `Character ${characters.length + 1}`,
      json: "",
    };
    const newArr = [...characters, newChar];
    persistCharacters(newArr, newChar.id);
    setRawInput(newChar.json);
    try {
      setCharacter(JSON.parse(newChar.json));
    } catch {}
  };
  const selectCharacter = (id: string) => {
    const found = characters.find((c) => c.id === id);
    if (!found) return;
    setActiveCharId(id);
    localStorage.setItem("wow_char_active", id);
    setRawInput(found.json);
    try {
      setCharacter(JSON.parse(found.json));
    } catch {}
  };
  const deleteCharacter = (id: string) => {
    if (characters.length <= 1) return; // keep at least one
    const idx = characters.findIndex((c) => c.id === id);
    if (idx === -1) return;
    const newArr = characters.filter((c) => c.id !== id);
    let newActive = activeCharId;
    if (activeCharId === id) {
      const replacement = newArr[Math.max(0, idx - 1)] || newArr[0];
      newActive = replacement.id;
    }
    persistCharacters(newArr, newActive);
    const current = newArr.find((c) => c.id === newActive)!;
    setRawInput(current.json);
    try {
      setCharacter(JSON.parse(current.json));
    } catch {}
  };

  useEffect(() => {
    setLoadingDb(true);
    // Try dynamic import first (bundled). Fallback to fetch if fails (e.g., comments in JSON).
    (async () => {
      try {
        const mod: any = await import("../db.json");
        const data: GameDB = mod.default || mod;
        setGameDb(data);
        setLoadingDb(false);
      } catch (e) {
        try {
          const res = await fetch("/db.json");
          if (!res.ok) throw new Error("HTTP " + res.status);
          const text = await res.text();
          // Strip any leading // comment lines to allow non-pure JSON first-line annotations.
          const cleaned = text.replace(/^\s*\/\/.*$/m, (m, offset) =>
            offset === 0 ? "" : m
          );
          const data: GameDB = JSON.parse(cleaned);
          setGameDb(data);
        } catch (err: any) {
          setDbError("Failed to load item database: " + err.message);
        } finally {
          setLoadingDb(false);
        }
      }
    })();
  }, []);

  // Build maps when db loads
  useEffect(() => {
    if (!gameDb) return;
    const im = new Map<number, DBItem>();
    gameDb.items?.forEach((i) => im.set(i.id, i));
    const em = new Map<number, DBEnchant>();
    gameDb.enchants?.forEach((e) => em.set(e.effectId, e));
    const gm = new Map<number, DBGem>();
    gameDb.gems?.forEach((g) => gm.set(g.id, g));
    setItemMap(im);
    setEnchantMap(em);
    setGemMap(gm);
  }, [gameDb]);

  const parseInput = useCallback(() => {
    // If input is blank or only whitespace, treat as "waiting" state: no character loaded, no error.
    if (rawInput.trim() === "") {
      setCharacter(null);
      setError(null);
      // Still persist empty string for the active tab so it survives reloads.
      setCharacters((prev) => {
        const updated = prev.map((c) =>
          c.id === activeCharId ? { ...c, json: "" } : c
        );
        localStorage.setItem("wow_characters_multi", JSON.stringify(updated));
        return updated;
      });
      return;
    }
    try {
      const parsed = JSON.parse(rawInput) as CharacterData;
      // Normalize potentially missing arrays/objects to avoid runtime map errors
      const normalized: CharacterData = {
        ...parsed,
        professions: Array.isArray(parsed.professions)
          ? parsed.professions
          : [],
        glyphs: {
          major: Array.isArray(parsed.glyphs?.major) ? parsed.glyphs.major : [],
          minor: Array.isArray(parsed.glyphs?.minor) ? parsed.glyphs.minor : [],
        },
        gear: {
          version: parsed.gear?.version || "",
          items: Array.isArray(parsed.gear?.items) ? parsed.gear.items : [],
        },
      };
      setCharacter(normalized);
      setError(null);
      // Update active character's stored json
      setCharacters((prev) => {
        const updated = prev.map((c) =>
          c.id === activeCharId ? { ...c, json: rawInput } : c
        );
        localStorage.setItem("wow_characters_multi", JSON.stringify(updated));
        return updated;
      });
    } catch (e: any) {
      setError(e.message);
    }
  }, [rawInput, activeCharId]);

  useEffect(() => {
    parseInput();
  }, [rawInput, parseInput]);

  // Build WoWSims URL when character changes
  useEffect(() => {
    let cancelled = false;
    async function build() {
      if (!character) {
        setWowSimsUrl("");
        return;
      }
      const cls = character.class?.toLowerCase() || "warrior";
      const spec = character.spec?.toLowerCase().replace(/\s+/g, "") || "arms";
      const link = `https://www.wowsims.com/mop/${cls}/${spec}/`;
      if (!cancelled) setWowSimsUrl(link || "");
    }
    build();
    return () => {
      cancelled = true;
    };
  }, [character]);

  // Prevent background scrolling while the WoWSims modal is open
  useEffect(() => {
    if (showWowsims) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev || "";
      };
    }
    return;
  }, [showWowsims]);

  // Apply profile background (if any) to body
  useEffect(() => {
    if (!backgroundUrl) return;
    const prevBg = document.body.style.backgroundImage;
    const prevBgSize = document.body.style.backgroundSize;
    const prevBgPos = document.body.style.backgroundPosition;
    const prevBgRepeat = document.body.style.backgroundRepeat;
    document.body.style.backgroundImage = `url(${backgroundUrl})`;
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center center";
    document.body.style.backgroundRepeat = "repeat";
    return () => {
      document.body.style.backgroundImage = prevBg || "";
      document.body.style.backgroundSize = prevBgSize || "";
      document.body.style.backgroundPosition = prevBgPos || "";
      document.body.style.backgroundRepeat = prevBgRepeat || "";
    };
  }, [backgroundUrl]);

  const bisList = character
    ? getBisListForSpec(character.class, character.spec)
    : [];

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Character Tabs */}
      <CharacterTabsClean
        characters={characters}
        activeId={activeCharId}
        onAdd={addCharacter}
        onSelect={selectCharacter}
        onDelete={deleteCharacter}
      />
      <header className="bg-gray-800 rounded-lg p-6 shadow flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          {/* Relative path so asset resolves under GitHub Pages subdirectory */}
          <img src="assets/logo.png" alt="WoW Logo" className="w-20 h-20" />
          <div>
            <h1 className="text-2xl font-bold">WoW MoP Character Dashboard</h1>
            <p className="text-sm text-gray-400">
              Keep track of all your WoW characters
            </p>
          </div>
        </div>
        <div />
      </header>
      {/* WoWSims modal iframe */}
      {showWowsims && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowWowsims(false)}
          />
          <div className="relative w-[95%] max-w-5xl h-[80%] bg-gray-900 rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center justify-between p-2 bg-gray-800">
              <div className="text-sm font-medium text-white">WoWSims</div>
              <div className="flex items-center gap-2">
                <a
                  href={wowSimsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Open in new tab
                </a>
                <button
                  onClick={() => setShowWowsims(false)}
                  className="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-500 text-white"
                  aria-label="Close WoWSims"
                >
                  Close
                </button>
              </div>
            </div>
            <iframe
              src={wowSimsUrl}
              className="w-full h-full"
              title="WoWSims"
              sandbox="allow-forms allow-scripts allow-same-origin allow-popups"
            />
          </div>
        </div>
      )}

      <section className="flex flex-col lg:flex-row gap-6">
        {/* Left: Character JSON / instructions */}
        <div className="w-full lg:w-1/3 space-y-4">
          <div className="bg-gray-800 p-4 rounded-lg shadow space-y-2">
            <h2 className="font-semibold tracking-wide text-sm uppercase text-gray-300">
              Character JSON
            </h2>
            <textarea
              className="w-full h-64 text-sm font-mono bg-gray-900 border border-gray-700 rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-vertical"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <p className="text-xs text-gray-500">
              Data stored locally in browser.
            </p>
          </div>
          {character && (
            <DailyTracker realm={character?.realm} characterId={activeCharId} />
          )}
          {character && (
            <WeeklyTracker
              realm={character?.realm}
              characterId={activeCharId}
            />
          )}
          {!character && (
            <div className="bg-gray-800 p-4 rounded-lg shadow">
              <h2 className="font-semibold tracking-wide text-sm uppercase text-gray-300 mb-2">
                Instructions
              </h2>
              <ol className="list-decimal list-inside text-xs space-y-1 text-gray-400">
                <li>
                  Export your character JSON from the WoWSims exporter addon
                </li>
                <li>Paste the JSON into the textbox on the left.</li>
                <li>
                  View your character summary and gear details on the right.
                </li>
                <li>Compare your gear to the BiS list for your class/spec.</li>
                <li>Keep track of your daily and weekly resets</li>
              </ol>
            </div>
          )}
        </div>
        {/* Right: Overview & Gear */}
        <div className="flex-1 space-y-6">
          {!character && (
            <div className="bg-gray-800 p-6 rounded-lg shadow text-center text-sm text-gray-400">
              <p className="mb-2 font-medium text-gray-300">
                No character loaded
              </p>
              <p>
                Paste a valid character JSON in the textbox on the left or use
                Import JSON. Once parsed successfully, character summary and
                gear details will appear here.
              </p>
            </div>
          )}
          {character && (
            <div className="space-y-6">
              {/* Character Summary */}
              <div className="bg-gray-800 p-4 rounded-lg shadow">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-semibold mb-3">
                    Character Summary
                  </h2>
                  <div className="flex gap-2 items-center ml-4">
                    {character && (
                      <button
                        onClick={() => {
                          // Copy saved json to clipboard
                          navigator.clipboard.writeText(rawInput);
                          // Show green toast message saying json copied to clipboard
                          toast.success("JSON copied to clipboard");
                          setShowWowsims(true);
                        }}
                        className={`text-xs px-3 py-1 rounded font-medium transition-colors border bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500`}
                        title={"Open current character in WoWSims"}
                      >
                        <img
                          src="/assets/WoW-Simulator-Icon.png"
                          alt="Warcraft Logs"
                          className="w-5 h-5 inline-block mr-2"
                        />
                        WoWSims
                      </button>
                    )}
                    {character &&
                      (() => {
                        const usRealms = [
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
                        const rawRealm = character.realm || "";
                        const isUS = usRealms.includes(rawRealm);
                        const region = isUS ? "us" : "eu";
                        const realmForUrl = formatRealmForUrl(rawRealm);
                        const charName = character.name;
                        const warcraftLogsUrl = `https://classic.warcraftlogs.com/character/${region}/${realmForUrl}/${charName}`;
                        const isDisabled = !charName;
                        return (
                          <a
                            href={isDisabled ? undefined : warcraftLogsUrl}
                            onClick={(e) => {
                              if (isDisabled) e.preventDefault();
                            }}
                            className={`flex items-center gap-2 text-xs px-3 py-1 rounded font-medium transition-colors border ${
                              isDisabled
                                ? "cursor-not-allowed bg-gray-700/40 text-gray-500 border-gray-600"
                                : "bg-orange-600 hover:bg-orange-500 text-white border-orange-500"
                            }`}
                            title={
                              isDisabled
                                ? "Character name required"
                                : "Open current character in Warcraft Logs"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-disabled={isDisabled}
                          >
                            <img
                              src="/assets/WCL_Icon.png"
                              alt="Warcraft Logs"
                              className="w-5 h-5 inline-block"
                            />
                            Warcraft Logs
                          </a>
                        );
                      })()}
                  </div>
                </div>
                {/* Responsive flex layout: avatar + details */}
                <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6 mb-4">
                  <div className="flex md:flex-col items-center md:items-start gap-3 md:gap-0">
                    <img
                      src={avatarUrl}
                      alt="Character Avatar"
                      className="rounded-lg shadow w-36 h-36 md:w-40 md:h-40 object-cover mx-auto"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Name:</span>{" "}
                        {character.name}
                      </div>
                      <div>
                        <span className="text-gray-400">Class:</span>{" "}
                        {character.class}
                      </div>
                      <div>
                        <span className="text-gray-400">Spec:</span>{" "}
                        {character.spec}
                      </div>
                      <div>
                        <span className="text-gray-400">Race:</span>{" "}
                        {character.race}
                      </div>
                      <div>
                        <span className="text-gray-400">Realm:</span>{" "}
                        {character.realm}
                      </div>
                      <div>
                        <span className="text-gray-400">Level:</span>{" "}
                        {character.level}
                      </div>
                      <div className="basis-full space-y-1 mt-2">
                        <h3 className="font-medium mb-1 text-sm uppercase text-gray-400">
                          Talents
                        </h3>
                        <TalentDisplay
                          className={character.class}
                          talentString={character.talents}
                          spellIcons={gameDb?.spellIcons}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-2 flex flex-col xl:flex-row gap-6">
                  <div className="flex flex-row gap-4 flex-1">
                    <div className="min-w-[120px] max-w-[160px] flex-1">
                      <h3 className="font-medium mb-1 text-sm uppercase text-gray-400">
                        Professions
                      </h3>
                      <ul className="space-y-1 text-sm">
                        {character?.professions &&
                          character.professions.map((p) => (
                            <li key={p.name} className="flex justify-between">
                              <span>{p.name}</span>
                              <span className="text-gray-400">{p.level}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1 text-sm uppercase text-gray-400">
                        Glyphs
                      </h3>
                      <div className="flex flex-row gap-4 text-xs w-full flex-wrap">
                        <div className="flex-1 min-w-[160px]">
                          <p className="text-indigo-400 font-semibold mb-1">
                            Major
                          </p>
                          <ul className="flex flex-row flex-wrap gap-3">
                            {character?.glyphs?.major &&
                              character.glyphs.major.map((g) => {
                                const info = getGlyphInfo(
                                  g.spellID,
                                  character.class,
                                  "major"
                                );
                                return (
                                  <li key={g.spellID} className="inline-flex">
                                    <WowheadGlyphLink
                                      spellID={g.spellID}
                                      name={info?.name}
                                      iconUrl={info?.iconUrl}
                                    />
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                        <div className="flex-1 min-w-[180px]">
                          <p className="text-indigo-400 font-semibold mb-1">
                            Minor
                          </p>
                          <ul className="flex flex-row flex-wrap gap-3">
                            {character?.glyphs?.minor &&
                              character.glyphs.minor.map((g, idx) => {
                                const info = getGlyphInfo(
                                  g.spellID,
                                  character.class,
                                  "minor"
                                );

                                return (
                                  <li
                                    key={g.spellID + "-" + idx}
                                    className="inline-flex"
                                  >
                                    <WowheadGlyphLink
                                      spellID={g.spellID}
                                      name={info?.name}
                                      iconUrl={info?.iconUrl}
                                    />
                                  </li>
                                );
                              })}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 p-4 rounded-lg shadow md:col-span-2">
                <h2 className="text-lg font-semibold mb-3">Gear</h2>
                {loadingDb && (
                  <p className="text-xs text-gray-400">Loading item DB...</p>
                )}
                {dbError && <p className="text-xs text-red-400">{dbError}</p>}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm align-top">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-gray-700">
                        <th className="py-1 pr-2">Slot</th>
                        <th className="py-1 pr-2">Item</th>
                        <th className="py-1 pr-2">Gems</th>
                        <th className="py-1 pr-2">Enchant</th>
                        <th className="py-1 pr-2">Reforge</th>
                        <th className="py-1 pr-2">Upg</th>
                        <th className="py-1 pr-2">BiS</th>
                        <th className="py-1 pr-2">BiS Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {character?.gear?.items.map((it, idx) => {
                        const {
                          bis,
                          bisItem,
                          bisInfoId: bisId,
                          missingBisId,
                          missingBisName,
                          missingBisSource,
                        } = evaluateBisForSlot(
                          idx,
                          it.id,
                          character.gear.items,
                          bisList
                        );
                        const info = itemMap.get(it.id);
                        const bisInfo = bisId ? itemMap.get(bisId) : undefined;
                        const enchInfo = it.enchant
                          ? enchantMap.get(it.enchant)
                          : undefined;
                        // Tinker slots: Back (3), Waist (7), Hands (6)
                        const tinkerSlots = [6];
                        // Enchant slots: Shoulder (2), Back (3), Chest (4), Waist (7), Hands (6), Legs (8), Feet (9), Weapon (14)
                        const enchantSlots = [2, 3, 4, 6, 8, 9, 14];
                        const isEngineer = character.professions.some(
                          (p) => p.name.toLowerCase() === "engineering"
                        );
                        const needsTinker =
                          isEngineer && tinkerSlots.includes(idx);
                        const needsEnchant = enchantSlots.includes(idx);
                        const hasTinker =
                          it.tinker !== undefined && it.tinker !== null;
                        const hasEnchant = !!it.enchant;
                        const hasGems = !!(it.gems && it.gems.length);
                        // Determine background and warning
                        let rowBg = "";
                        let warning = "";
                        const gemsApplicable =
                          it.gems !== undefined &&
                          Array.isArray(it.gems) &&
                          it.gems.length > 0;
                        if (
                          (needsEnchant && !hasEnchant) ||
                          (needsTinker && !hasTinker)
                        ) {
                          rowBg = "bg-red-950/60";
                          if (needsEnchant && !hasEnchant)
                            warning += "Missing enchant. ";
                          if (needsTinker && !hasTinker)
                            warning += "Missing tinker. ";
                        } else if (
                          bis &&
                          ((needsEnchant && hasEnchant) || !needsEnchant) &&
                          ((gemsApplicable && hasGems) || !gemsApplicable) &&
                          (!needsTinker || hasTinker)
                        ) {
                          rowBg = "bg-green-900/60";
                        }

                        // Set bonuses detection
                        let setBonuses: number[] | undefined;
                        if (info?.name && character.class) {
                          const patterns =
                            setPatterns[character.class.toLowerCase()] || [];
                          const matchedPattern = patterns.find((pat) =>
                            pat.test(info.name)
                          );
                          if (matchedPattern) {
                            const equippedSetPieces =
                              character.gear.items.filter((i) => {
                                const iInfo = itemMap.get(i.id);
                                return iInfo?.name
                                  ? matchedPattern.test(iInfo.name)
                                  : false;
                              });
                            if (equippedSetPieces.length > 1)
                              setBonuses = equippedSetPieces.map((i) => i.id);
                          }
                        }

                        return (
                          <tr
                            key={it.id + "-" + idx}
                            className={`border-b border-gray-800 ${rowBg}`}
                          >
                            <td className="py-2 pr-2 font-medium text-gray-300 whitespace-nowrap align-top">
                              {SLOT_LABELS[idx] || idx}
                            </td>
                            <td className="py-2 pr-2 align-top">
                              <WowheadLink
                                id={it.id}
                                type="item"
                                name={info?.name}
                                icon={info?.icon}
                                quality={info?.quality}
                                upgrade_step={it.upgrade_step}
                                enchant={it.enchant}
                                reforging={it.reforging}
                                gems={it.gems}
                                setBonuses={setBonuses}
                                ilvl={
                                  info?.scalingOptions?.[it.upgrade_step ?? 0]
                                }
                              />
                              <div className="text-[10px] text-gray-500">
                                ID: {it.id}
                              </div>
                            </td>
                            <td className="py-2 pr-2 text-xs max-w-[160px]">
                              <div className="flex flex-wrap gap-1">
                                {it.gems?.length ? (
                                  it.gems.map((g, gemIdx) => {
                                    const gInfo = gemMap.get(g);
                                    return (
                                      <WowheadLink
                                        key={g + "-" + gemIdx}
                                        id={g}
                                        type="gem"
                                        name={gInfo?.name}
                                        icon={gInfo?.icon}
                                        quality={3}
                                      />
                                    );
                                  })
                                ) : (
                                  <span className="text-gray-500">—</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 pr-2 text-xs">
                              {enchInfo ? (
                                <WowheadLink
                                  id={enchInfo.itemId}
                                  type="item"
                                  name={enchInfo.name.replace("Enchant: ", "")}
                                  icon={enchInfo.icon}
                                  quality={enchInfo.quality}
                                  ilvl={90}
                                />
                              ) : it.enchant ? (
                                <span>#{it.enchant}</span>
                              ) : (
                                <span className="text-gray-500">—</span>
                              )}
                            </td>
                            <td className="py-2 pr-2">{it.reforging || "-"}</td>
                            <td className="py-2 pr-2">
                              {it.upgrade_step ?? "-"}
                            </td>
                            <td className="py-2 pr-2">
                              {bis ? (
                                "✅"
                              ) : (
                                <span className="flex items-center gap-1">
                                  <WowheadLink
                                    id={missingBisId ?? bisId ?? 0}
                                    type="item"
                                    name={
                                      missingBisName ||
                                      bisInfo?.name ||
                                      bisItem?.item
                                    }
                                    icon={bisInfo?.icon}
                                    quality={bisInfo?.quality}
                                  />
                                </span>
                              )}
                              {warning && (
                                <div className="text-xs text-red-400 font-bold">
                                  {warning.trim()}
                                </div>
                              )}
                            </td>
                            <td className="py-2 pr-2 text-xs">
                              {missingBisSource
                                ? missingBisSource
                                : bisItem?.source ||
                                  (bisInfo ? "Unknown source" : "—")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
