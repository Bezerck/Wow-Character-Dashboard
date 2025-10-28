// Regex patterns to identify set items by class
export const setPatterns: Record<string, RegExp[]> = {
  warrior: [/Resounding Rings/, /Dragonplate/, /Colossal/],
  druid: [/Eternal Blossom/, /Dreamwalker/, /Runetotem/],
  warlock: [/Lost Catacomb/, /Sha-Skin/, /of the Lost Catacomb/],
  mage: [/Firehawk/, /Time Lord/, /Frostfire/],
  paladin: [/White Tiger/, /Battlegear/, /Radiant Glory/],
  priest: [/Guardian Serpent/, /Regalia/, /Soulcloth/],
  rogue: [/Blackfang/, /Nightblade/, /Shadowblade/],
  shaman: [/Spiritwalker/, /Firebird/, /Earthshatter/],
  hunter: [/Yaungol Slayer/, /Wyrmstalker/, /Beast Lord/],
  deathknight: [/Dreadnaught/, /Scourgelord/, /of the Lost Catacomb/],
  monk: [/Red Crane/, /Shado-Pan/, /Windwalker/],
};
