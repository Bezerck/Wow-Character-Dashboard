"use client";
import React from "react";

export interface WowheadLinkProps {
  id: number;
  type: "item" | "gem" | "enchant";
  name?: string;
  icon?: string;
  quality?: number;
  upgrade_step?: number;
  enchant?: number;
  reforging?: number;
  setBonuses?: number[];
  gems?: number[];
  ilvl?: number;
  children?: React.ReactNode;
}

export function WowheadLink(props: WowheadLinkProps) {
  const {
    id,
    type,
    name,
    icon,
    quality,
    upgrade_step,
    enchant,
    reforging,
    setBonuses,
    gems,
    ilvl,
    children,
  } = props;
  const qualityClass = quality ? `q${quality}` : "";
  const iconUrl = icon
    ? `https://wow.zamimg.com/images/wow/icons/tiny/${icon}.gif`
    : undefined;
  let href = "";
  if (type === "item" || type === "gem")
    href = `https://www.wowhead.com/mop-classic/item=${id}?level=90&rand=0${
      upgrade_step ? `&upgd=${upgrade_step}` : ""
    }`;
  else if (type === "enchant")
    href = `https://www.wowhead.com/mop-classic/spell=${id}`;

  let wowheadData = `domain=mop-classic&dataEnv=15&lvl=90&item=${id}`;
  if (type === "item") {
    wowheadData += `&ilvl=${ilvl}`;
    if (gems && gems.length) wowheadData += `&gems=${gems.join(":")}`;
    if (enchant) wowheadData += `&ench=${enchant}`;
    if (reforging) wowheadData += `&forg=${reforging}`;
    if (upgrade_step) wowheadData += `&upgd=${upgrade_step}`;
    if (setBonuses && setBonuses.length)
      wowheadData += `&pcs=${setBonuses.join(":")}`;
  }

  return (
    <a
      href={href}
      className={`${qualityClass} icontinyl`}
      data-game="wow"
      data-type={type}
      style={iconUrl ? { backgroundImage: `url('${iconUrl}')` } : undefined}
      target="_blank"
      rel="noopener noreferrer"
      data-wowhead={wowheadData}
    >
      {children || name || `${type} #${id}`}
    </a>
  );
}

export interface WowheadGlyphLinkProps {
  spellID: number;
  name?: string;
  iconUrl?: string;
}
export function WowheadGlyphLink({
  spellID,
  name,
  iconUrl,
}: WowheadGlyphLinkProps) {
  const href = `https://www.wowhead.com/mop-classic/spell=${spellID}`;
  return (
    <a
      href={href}
      className=""
      data-game="wow"
      data-type="glyph"
      style={iconUrl ? { backgroundImage: `url('${iconUrl}')` } : undefined}
      target="_blank"
      rel="noopener noreferrer"
      data-wowhead={`domain=mop-classic&dataEnv=15&spell=${spellID}`}
      title={name || `Glyph #${spellID}`}
    >
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={name || `Glyph #${spellID}`}
          className="inline-block w-12 h-12 rounded"
        />
      ) : (
        name || `Glyph #${spellID}`
      )}
    </a>
  );
}
