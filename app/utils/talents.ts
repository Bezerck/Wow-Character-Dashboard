// Utility helpers for converting compact talent strings (e.g. "113132")
// into human-readable talent names per class. MoP style: 6 rows, 3 choices each.
// The mapping below is ordered by rows. Each inner array = one row of choices.
// Digits in the talent string are 1-based indexes into each row's 3 options.

export const TALENT_ROWS: Record<string, string[][]> = {
  warrior: [
    ["juggernaut", "doubleTime", "warbringer"],
    ["enragedRegeneration", "secondWind", "impendingVictory"],
    ["staggeringShout", "piercingHowl", "disruptingShout"],
    ["bladestorm", "shockwave", "dragonRoar"],
    ["massSpellReflection", "safeguard", "vigilance"],
    ["avatar", "bloodbath", "stormBolt"],
  ],
  mage: [
    ["presenceOfMind", "blazingSpeed", "iceFloes"],
    ["temporalShield", "flameglow", "iceBarrier"],
    ["ringOfFrost", "iceWard", "frostjaw"],
    ["greaterInvisibility", "cauterize", "coldSnap"],
    ["netherTempest", "livingBomb", "frostBomb"],
    ["invocation", "runeOfPower", "incantersWard"],
  ],
  druid: [
    ["felineSwiftness", "displacerBeast", "wildCharge"],
    ["yserasGift", "renewal", "cenarionWard"],
    ["faerieSwarm", "massEntanglement", "typhoon"],
    ["soulOfTheForest", "incarnation", "forceOfNature"],
    ["disorientingRoar", "ursolsVortex", "mightyBash"],
    ["heartOfTheWild", "dreamOfCenarius", "naturesVigil"],
  ],
  hunter: [
    ["posthaste", "narrowEscape", "crouchingTigerHiddenChimera"],
    ["bindingShot", "wyvernSting", "intimidation"],
    ["exhilaration", "aspectOfTheIronHawk", "spiritBond"],
    ["fervor", "direBeast", "thrillOfTheHunt"],
    ["aMurderOfCrows", "blinkStrikes", "lynxRush"],
    ["glaiveToss", "powershot", "barrage"],
  ],
  rogue: [
    ["nightstalker", "subterfuge", "shadowFocus"],
    ["deadlyThrow", "nerveStrike", "combatReadiness"],
    ["cheatDeath", "leechingPoison", "elusiveness"],
    ["cloakAndDagger", "shadowstep", "burstOfSpeed"],
    ["preyOnTheWeak", "paralyticPoison", "dirtyTricks"],
    ["shurikenToss", "markedForDeath", "anticipation"],
  ],
  priest: [
    ["voidTendrils", "psyfiend", "dominateMind"],
    ["bodyAndSoul", "angelicFeather", "phantasm"],
    ["fromDarknessComesLight", "mindbender", "solaceAndInsanity"],
    ["desperatePrayer", "spectralGuise", "angelicBulwark"],
    ["twistOfFate", "powerInfusion", "divineInsight"],
    ["cascade", "divineStar", "halo"],
  ],
  paladin: [
    ["speedOfLight", "longArmOfTheLaw", "pursuitOfJustice"],
    ["fistOfJustice", "repentance", "evilIsAPointOfView"],
    ["selflessHealer", "eternalFlame", "sacredShield"],
    ["handOfPurity", "unbreakableSpirit", "clemency"],
    ["holyAvenger", "sanctifiedWrath", "divinePurpose"],
    ["holyPrism", "lightsHammer", "executionSentence"],
  ],
  death_knight: [
    ["roilingBlood", "plagueLeech", "unholyBlight"],
    ["lichborne", "antimagicZone", "purgatory"],
    ["deathsAdvance", "chilblains", "asphyxiate"],
    ["deathPact", "deathSiphon", "conversion"],
    ["bloodTap", "runicEmpowerment", "runicCorruption"],
    ["gorefiendsGrasp", "remorselessWinter", "desecratedGround"],
  ],
  monk: [
    ["celerity", "tigersLust", "momentum"],
    ["chiWave", "zenSphere", "chiBurst"],
    ["powerStrikes", "ascension", "chiBrew"],
    ["ringOfPeace", "chargingOxWave", "legSweep"],
    ["healingElixirs", "dampenHarm", "diffuseMagic"],
    ["rushingJadeWind", "invokeXuenTheWhiteTiger", "chiTorpedo"],
  ],
  shaman: [
    ["naturesGuardian", "stoneBulwarkTotem", "astralShift"],
    ["frozenPower", "earthgrabTotem", "windwalkTotem"],
    ["callOfTheElements", "totemicPersistence", "totemicProjection"],
    ["elementalMastery", "ancestralSwiftness", "echoOfTheElements"],
    ["rushingStreams", "ancestralGuidance", "conductivity"],
    ["unleashedFury", "primalElementalist", "elementalBlast"],
  ],
  warlock: [
    ["darkRegeneration", "soulLeech", "harvestLife"],
    ["demonicBreath", "mortalCoil", "shadowfury"],
    ["soulLink", "sacrificialPact", "darkBargain"],
    ["bloodHorror", "burningRush", "unboundWill"],
    ["grimoireOfSupremacy", "grimoireOfService", "grimoireOfSacrifice"],
    ["archimondesDarkness", "kiljaedensCunning", "mannorothsFury"],
  ],
};

// Map of key -> display name. In production we could import locale JSON; duplicating here for simplicity.
export const TALENT_NAMES: Record<string, Record<string, string>> = {
  warrior: {
    juggernaut: "Juggernaut",
    doubleTime: "Double Time",
    warbringer: "Warbringer",
    enragedRegeneration: "Enraged Regeneration",
    secondWind: "Second Wind",
    impendingVictory: "Impending Victory",
    staggeringShout: "Staggering Shout",
    piercingHowl: "Piercing Howl",
    disruptingShout: "Disrupting Shout",
    bladestorm: "Bladestorm",
    shockwave: "Shockwave",
    dragonRoar: "Dragon Roar",
    massSpellReflection: "Mass Spell Reflection",
    safeguard: "Safeguard",
    vigilance: "Vigilance",
    avatar: "Avatar",
    bloodbath: "Bloodbath",
    stormBolt: "Storm Bolt",
  },
  // For brevity we can fall back to key->camelCase transform for other classes if not explicitly defined.
};

// Simple fallback name generator: convert camelCase to spaced words.
const camelCaseToWords = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z])([0-9])/g, "$1 $2")
    .replace(/([0-9])([a-zA-Z])/g, "$1 $2")
    .replace(/([a-z])([A-Z][a-z])/g, "$1 $2")
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/([A-Z])/g, (m, i) => (i === 0 ? m : m));

export interface ParsedTalentRow {
  row: number;
  choiceIndex: number; // 0-based
  key: string;
  name: string;
}

export function parseTalentString(
  className: string,
  talentString: string
): ParsedTalentRow[] {
  const cls = (className || "").toLowerCase();
  const rows = TALENT_ROWS[cls];
  if (!rows || !talentString) return [];
  return rows.map((choices, rowIdx) => {
    const digit = talentString[rowIdx];
    const choiceNum = digit ? parseInt(digit, 10) : 0; // 1..3 usually
    const choiceIndex = Math.max(
      0,
      Math.min(choices.length - 1, choiceNum - 1)
    );
    const key = choices[choiceIndex];
    const nameMap = TALENT_NAMES[cls];
    const name = nameMap?.[key] || camelCaseToWords(key);
    return { row: rowIdx + 1, choiceIndex, key, name };
  });
}
