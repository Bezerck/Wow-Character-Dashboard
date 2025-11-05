// Shared World of Warcraft related types
export interface Glyph {
  spellID: number;
}
export interface GlyphsData {
  minor: Glyph[];
  major: Glyph[];
}
export interface TalentsData {
  talents: string;
}
export interface Profession {
  name: string;
  level: number;
}
export interface GearItem {
  id: number;
  reforging?: number;
  upgrade_step?: number;
  gems?: number[];
  enchant?: number;
  tinker?: number;
}
export interface CharacterData {
  talents: string;
  glyphs: GlyphsData;
  class: string;
  unit: string;
  gear: { items: GearItem[]; version: string };
  race: string;
  name: string;
  spec: string;
  professions: Profession[];
  level: number;
  version: string;
  realm: string;
  id: string;
}
export interface DBItem {
  id: number;
  name: string;
  icon?: string;
  quality?: number;
  scalingOptions?: number[];
}
export interface DBEnchant {
  spellId: number;
  effectId: number;
  itemId: number;
  name: string;
  icon?: string;
  type: number;
  extraTypes?: number[];
  enchantType: number;
  stats: number[];
  quality: number;
}
export interface DBGem {
  id: number;
  name: string;
  icon?: string;
}
export interface GameDB {
  items?: DBItem[];
  enchants?: DBEnchant[];
  gems?: DBGem[];
  spellIcons?: { id: number; name: string; icon: string; hasBuff?: boolean }[];
}
export interface BisItem {
  slot: string;
  item: string;
  source: string;
  id: number;
}
export interface BisListJson {
  [key: string]: BisItem[];
}
