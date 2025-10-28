import React from "react";
import { parseTalentString } from "../utils/talents";
import { getTalentSpellId } from "../utils/talentSpellIds";
import { WowheadGlyphLink } from "./WowheadLink";

interface TalentDisplayProps {
  className: string;
  talentString: string;
  spellIcons?: { id: number; name: string; icon: string; hasBuff?: boolean }[];
}

export const TalentDisplay: React.FC<TalentDisplayProps> = ({
  className,
  talentString,
  spellIcons,
}) => {
  const parsed = parseTalentString(className, talentString);
  const items = parsed
    .map((p) => {
      const spellId = getTalentSpellId(className, p.key);
      if (!spellId) return null;
      const icon = spellIcons?.find((s) => s.id === spellId)?.icon;
      const iconUrl = icon
        ? `https://wow.zamimg.com/images/wow/icons/large/${icon}.jpg`
        : undefined;
      return { key: p.key, name: p.name, spellId, iconUrl };
    })
    .filter(Boolean) as {
    key: string;
    name: string;
    spellId: number;
    iconUrl?: string;
  }[];

  if (!items.length) return <span className="text-gray-500">N/A</span>;

  return (
    <ul className="flex flex-row flex-wrap gap-4 list-none p-0 m-0">
      {items.map((it, idx) => (
        <li key={`${it.key}-${idx}`} className="inline-flex">
          <WowheadGlyphLink
            spellID={it.spellId}
            name={it.name}
            iconUrl={it.iconUrl}
          />
        </li>
      ))}
    </ul>
  );
};

export default TalentDisplay;
