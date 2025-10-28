import GlyphDb from "../../glyphs.json";

type ClassName =
  | "warrior"
  | "paladin"
  | "hunter"
  | "rogue"
  | "priest"
  | "deathknight"
  | "shaman"
  | "mage"
  | "warlock"
  | "druid";

type Glyph = {
  enumName: string;
  id: number;
  name: string;
  description: string;
  iconUrl: string;
  spellId: number;
};

type GlyphDbType = {
  [K in ClassName]: {
    majorGlyphs: Glyph[];
    minorGlyphs: Glyph[];
  };
};

export const getGlyphInfo = (
  spellID: number,
  className: string,
  type: "major" | "minor"
) => {
  const classKey = className.toLowerCase() as ClassName;
  //console.log(spellID);

  const db = GlyphDb as unknown as GlyphDbType;
  const glyphsArr =
    type === "major" ? db[classKey]?.majorGlyphs : db[classKey]?.minorGlyphs;
  // Data objects use `id` field, match against provided `spellID`.
  return glyphsArr?.find((g: Glyph) => g.spellId === spellID) || null;
};
