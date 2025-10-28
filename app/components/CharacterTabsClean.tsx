"use client";
import React, { useMemo } from "react";

export interface CharacterTabMeta {
  id: string;
  name: string; // Display name from character JSON
  json: string; // Raw character JSON
}

interface CharacterTabsProps {
  characters: CharacterTabMeta[];
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
}

// Mapping from class/spec to wowhead icon slug
// Key format: `${class}:${spec}` all lowercase
const CLASS_SPEC_ICONS: Record<string, string> = {
  "warrior:arms": "ability_warrior_savageblow",
  "warrior:fury": "ability_warrior_bloodbath",
  "warrior:protection": "ability_warrior_defensivestance",
  "death knight:blood": "spell_deathknight_bloodpresence",
  "death knight:frost": "spell_deathknight_frostpresence",
  "death knight:unholy": "spell_deathknight_unholyblight",
  "paladin:holy": "spell_holy_holybolt",
  "paladin:protection": "ability_paladin_shieldofthetemplar",
  "paladin:retribution": "spell_holy_auraoflight",
  "hunter:beast mastery": "ability_hunter_beastwithin",
  "hunter:marksmanship": "ability_hunter_focusedaim",
  "hunter:survival": "ability_hunter_camouflage",
  "rogue:assassination": "ability_rogue_eviscerate",
  "rogue:combat": "ability_backstab",
  "rogue:subtlety": "ability_stealth",
  "priest:discipline": "spell_holy_powerwordshield",
  "priest:holy": "spell_holy_guardianspirit",
  "priest:shadow": "spell_shadow_shadowwordpain",
  "shaman:elemental": "spell_nature_lightning",
  "shaman:enhancement": "spell_shaman_maelstromweapon",
  "shaman:restoration": "spell_nature_magicimmunity",
  "mage:arcane": "spell_holy_magicalsentry",
  "mage:fire": "spell_fire_firebolt02",
  "mage:frost": "spell_frost_frostbolt02",
  "warlock:affliction": "spell_shadow_curseofsargeras",
  "warlock:demonology": "spell_shadow_metamorphosis",
  "warlock:destruction": "spell_shadow_rainoffire",
  "monk:brewmaster": "spell_monk_brewmaster_spec",
  "monk:mistweaver": "spell_monk_mistweaver_spec",
  "monk:windwalker": "spell_monk_windwalker_spec",
  "druid:balance": "spell_nature_starfall",
  "druid:feral": "ability_druid_catform",
  "druid:guardian": "ability_racial_bearform",
  "druid:restoration": "spell_nature_healingtouch",
};

function getDisplayMeta(raw: CharacterTabMeta) {
  let parsed: any = null;
  try {
    parsed = JSON.parse(raw.json);
  } catch {
    // ignore parse errors
  }
  const charName = parsed?.name || raw.name || "Unnamed";
  const cls = (parsed?.class || "") as string;
  const spec = (parsed?.spec || "") as string;
  const key = `${cls.toLowerCase()}:${spec.toLowerCase()}`;
  const iconSlug = CLASS_SPEC_ICONS[key];
  const iconUrl = iconSlug
    ? `https://wow.zamimg.com/images/wow/icons/small/${iconSlug}.jpg`
    : undefined;
  return { name: charName, iconUrl, className: cls, specName: spec };
}

const CharacterTabsClean: React.FC<CharacterTabsProps> = ({
  characters,
  activeId,
  onSelect,
  onAdd,
  onDelete,
}) => {
  // Memoize parsed results to avoid re-parsing each render
  const parsedMeta = useMemo(
    () =>
      characters.reduce<Record<string, ReturnType<typeof getDisplayMeta>>>(
        () => {
          const map: Record<string, ReturnType<typeof getDisplayMeta>> = {};
          for (const c of characters) map[c.id] = getDisplayMeta(c);
          return map;
        },
        {}
      ),
    [characters]
  );

  return (
    <div className="flex flex-wrap items-center gap-1 bg-gray-900/70 p-1 rounded-md border border-gray-700">
      {characters.map((c) => {
        const isActive = c.id === activeId;
        const meta = parsedMeta[c.id];
        return (
          <div
            key={c.id}
            className={`group flex items-center max-w-[220px] ${
              isActive
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-300 hover:bg-gray-700"
            } rounded px-2 py-1 text-xs cursor-pointer relative`}
            onClick={() => onSelect(c.id)}
            title={`${meta?.name} – ${meta?.className || ""} ${
              meta?.specName || ""
            }`}
          >
            {meta?.iconUrl ? (
              <span
                className="w-4 h-4 mr-1 rounded-sm bg-cover bg-center shrink-0"
                style={{ backgroundImage: `url(${meta.iconUrl})` }}
              />
            ) : (
              <span className="w-4 h-4 mr-1 rounded-sm bg-gray-600 text-[8px] flex items-center justify-center font-bold">
                ?
              </span>
            )}
            <span className="truncate flex-1">{meta?.name || "Unnamed"}</span>
            {characters.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="ml-1 opacity-0 group-hover:opacity-70 hover:opacity-100 transition text-[10px]"
                title="Delete character"
              >
                ×
              </button>
            )}
          </div>
        );
      })}
      <button
        onClick={onAdd}
        className="flex items-center gap-1 bg-green-700 hover:bg-green-600 text-white rounded px-2 py-1 text-xs font-medium"
        title="Add new character"
      >
        + Add Character
      </button>
    </div>
  );
};

export default CharacterTabsClean;
