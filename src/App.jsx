import React, { useState, useMemo, useEffect } from 'react';
import { 
  useLootStore,
  useKioskStore, 
  formatGoldCost,
  parseCostToGold
} from './store/useKioskStore';
import { 
  Globe2, 
  Store, 
  UtensilsCrossed, 
  ShoppingBag, 
  Dices, 
  Trash2, 
  ChevronRight, 
  BookOpen, 
  Weight, 
  Lock, 
  Unlock,
  ShieldAlert,
  Eye,
  Hand,
  Sparkles,
  Layers,
  X,
  Coins,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';

// --- COSMIC ATLAS DATA ---
const PLANETS = [
  { id: 'Toril', name: 'Toril', sphere: 'Realmspace', active: true, desc: 'The cradle of the Forgotten Realms. A vibrant world of high magic, vast oceans, and ancient kingdoms.' },
  { id: 'Krynn', name: 'Krynn', sphere: 'Krynnspace', active: false, desc: 'The world of Dragonlance, knights of Solamnia, and the war of the lance.' },
  { id: 'Oerth', name: 'Oerth', sphere: 'Greyspace', active: false, desc: 'The gritty, sorcerous world of Greyhawk and the Flanaess.' },
  { id: 'Eberron', name: 'Eberron', sphere: 'Progenitor Dragons', active: false, desc: 'A noir realm of magic-fueled industry, lightning rails, and airships.' },
  { id: 'Athas', name: 'Athas', sphere: 'The Dark Sun', active: false, desc: 'A scorched, savage desert world ruled by immortal sorcerer-kings.' },
];

const CONTINENTS = [
  { id: 'Faerun', name: 'Faerûn', active: true, desc: 'The heart of adventure. Home to legendary frontiers, city-states, and elven empires.' },
  { id: 'Kara-Tur', name: 'Kara-Tur', active: false, desc: 'The eastern lands of celestial bureaucracy, martial monasteries, and ancient empires.' },
  { id: 'Zakhara', name: 'Zakhara', active: false, desc: 'The Land of Fate, vast deserts, genie courts, and enchanted coastal cities.' },
  { id: 'Maztica', name: 'Maztica', active: false, desc: 'The True World across the Trackless Sea, lands of jungles and feathered serpents.' },
];

const REGIONS = [
  { id: 'Sword Coast', name: 'The Sword Coast', active: true, desc: 'The rugged coastal frontier spanning from the Cloudpeaks north to the Sea of Moving Ice.' },
  { id: 'Heartlands', name: 'The Heartlands', active: false, desc: 'The civilized, fertile lands of Cormyr, Sembia, and the Dragonmere.' },
  { id: 'Calimshan', name: 'Calimshan & Amn', active: false, desc: 'The wealthy southern merchant nations of spices, desert pearls, and privateers.' },
  { id: 'Icewind Dale', name: 'Icewind Dale', active: false, desc: 'The frozen tundra beyond the Spine of the World and the Ten-Towns.' },
];

const SETTLEMENTS = [
  { id: 'Waterdeep', name: 'Waterdeep', subtitle: 'The City of Splendors', active: true, desc: 'Population 130,000+. 9 Districts, 159 Canonical Storefronts, 70 Eateries, and direct access to Undermountain.' },
  { id: 'Neverwinter', name: 'Neverwinter', subtitle: 'The Jewel of the North', active: true, desc: 'City of Skilled Hands. Starter City Pack pre-loaded with 6 Districts, artisan storefronts, and riverfront taverns.' },
  { id: 'Baldurs Gate', name: 'Baldur\'s Gate', subtitle: 'City of Ambition', active: false, desc: 'The cutthroat port of the Flaming Fist, Upper City patriars, and the Undercellar. Ready for custom City Pack upload.' },
  { id: 'Candlekeep', name: 'Candlekeep', subtitle: 'The Great Library Citadel', active: false, desc: 'The towering seaside monastery housing the greatest repository of lore in Toril. Ready for custom City Pack upload.' },
];

const WARDS = [
  { id: 'Castle', name: 'Castle Ward', tier: '4', desc: 'Seat of government, palaces, veteran taprooms & secure magic academies.' },
  { id: 'Sea', name: 'Sea Ward', tier: '5', desc: 'Palatial villas of nobility, opulent salons & ultra-exclusive haute cuisine.' },
  { id: 'North', name: 'North Ward', tier: '4', desc: 'Affluent residences, hunting clubs, and prestigious carriage taverns.' },
  { id: 'Trades', name: 'Trades Ward', tier: '3', desc: 'Commercial epicenter, merchant guildhalls, 24/7 markets & busy diners.' },
  { id: 'South', name: 'South Ward', tier: '3', desc: 'Caravan stables, teamsters, spice markets, and bustling traveler inns.' },
  { id: 'Dock', name: 'Dock Ward', tier: '2', desc: 'Salty harbor piers, sailor dives, shipwrights, and cheap seafood trenchers.' },
  { id: 'Field', name: 'Field Ward', tier: '1', desc: 'Unregulated shantytowns, slaughterhouse alleys & desperate barter.' },
  { id: 'Dead', name: 'City of the Dead', tier: '2', desc: 'Solemn necropolis park, gravedigger taverns & mourners\' tearooms.' },
  { id: 'Skullport', name: 'Skullport (BM)', tier: 'BM', desc: 'Subterranean smuggler haven, contraband fencing & caustic fire-liquor.' },
];

// Contextual Section Mapper (Shop Departments vs Tavern Menu Courses)
function getSectionForItem(item, isFood) {
  if (isFood) {
    const sub = item['Subcategory'] || '';
    if (sub.includes('Street')) return '🍢 Bar Bites & Skewers';
    if (sub.includes('Fine') || sub.includes('Feast')) return '🍗 Grand Feasts & Specialties';
    if (sub.includes('Tavern') || sub.includes('Sit-Down')) return '🍲 Hearth Trenchers & Stews';
    if (sub.includes('Wine') || sub.includes('Spirit')) return '🍷 From the Cellar: Fine Spirits';
    if (sub.includes('Warm') || sub.includes('Tea') || sub.includes('Coffee')) return '☕ The Kettle: Warm Brews & Teas';
    if (sub.includes('Rations') || sub.includes('Jerky')) return '🍞 Provisions for the Road';
    return '🍺 On Tap: Ales, Stouts & Grogs';
  }

  const sub = item['Subcategory'] || '';
  const rarity = item['Rarity'] || 'Common';

  // Only Rare, Very Rare, and Legendary items are locked in The Vault.
  // Common and Uncommon goods (including magic items) appear on the open storefront shelves!
  if (rarity === 'Rare' || rarity === 'Very Rare' || rarity === 'Legendary') {
    return '🔒 The Vault: Rare Goods & Arcana';
  }
  if (['Sword', 'Dagger', 'Rapier', 'Scimitar'].includes(sub)) {
    return '⚔️ Weapons Rack: Blades & Daggers';
  }
  if (['Axe', 'Hammer', 'Pick', 'War Pick', 'Mace', 'Club', 'Flail', 'Bludgeon'].includes(sub)) {
    return '🪓 Heavy Impact: Axes, Hammers & Mauls';
  }
  if (['Polearm', 'Spear', 'Halberd', 'Pike', 'Whip', 'Sickle', 'Thrown Weapon'].includes(sub)) {
    return '🔱 Polearm Stand: Spears & Reach';
  }
  if (['Bow', 'Crossbow', 'Firearm', 'Ammunition', 'Sling', 'Blowgun'].includes(sub)) {
    return '🏹 Ranged Arsenal: Bows & Munitions';
  }
  if (sub.includes('Armor') || sub === 'Shield') {
    return '🛡️ The Armory: Plate, Mail & Shields';
  }
  if (['Potion', 'Poison', 'Alchemy', 'Pyrotechnic', 'Explosive'].includes(sub)) {
    return '🧪 Apothecary Bench: Alchemical Reagents';
  }
  if (['Tool', 'Lighting', 'Container', 'Mount', 'Vehicle', 'Spellcasting Focus', 'Adventuring Gear', 'Gear'].includes(sub)) {
    return '🎒 Field Equipment & Toolkits';
  }

  return '📦 General Goods & Sundries';
}

// --- FILTER CATEGORY GROUPS ---
const TRADE_GROUPS = [
  { id: 'All', label: 'All Trades' },
  { id: 'Weapons', label: '⚔️ Smithies & Blades', matches: ['Smithy & Weaponsmith'] },
  { id: 'Armor', label: '🛡️ Armor & Shields', matches: ['Armorer & Shieldmaker'] },
  { id: 'Apothecary', label: '🧪 Apothecaries & Potions', matches: ['Apothecary & Herbalist'] },
  { id: 'Arcane', label: '📜 Arcane & Scribes', matches: ['Arcane Emporium & Scribe'] },
  { id: 'Outfitters', label: '🎒 Outfitters & Sundries', matches: ['General Outfitter & Provisions'] },
  { id: 'Stables', label: '🐴 Stables & Mounts', matches: ['Stablemaster & Shipwright'] },
  { id: 'Jewelers', label: '💎 Jewelers & Gems', matches: ['Jeweler & Gemcutter'] },
  { id: 'Tailors', label: '🧵 Tailors & Clothiers', matches: ['Tailor & Haberdasher'] },
  { id: 'Crafts', label: '🔨 Locksmiths & Crafts', matches: ['Locksmith & Security', 'Glassblower & Glazier', 'Woodcarver & Bowyer', 'Woodcarver & Cabinetmaker', 'Chandler & Lamplighter', 'Cartographer & Surveyor'] },
  { id: 'Pawn', label: '🎲 Curios, Relics & Pawn', matches: ['Curios, Relics & Pawn', 'Temple & Reliquary'] },
  { id: 'BlackMarket', label: '💀 Black Market & Fence', matches: ['Shady Fence & Black Market'] },
];

const EATERY_GROUPS = [
  { id: 'All', label: 'All Eateries' },
  { id: 'Tavern', label: '🍺 Taverns & Taprooms', matches: ['Tavern', 'Taproom'] },
  { id: 'Inn', label: '🛏️ Traveler Inns & Lodging', matches: ['Inn', 'Lodge'] },
  { id: 'Festhall', label: '🎭 Festhalls & Cabarets', matches: ['Festhall', 'Cabaret', 'Club'] },
  { id: 'Fine', label: '🍷 Fine Dining & Salons', matches: ['Dining', 'Salon', 'Gourmet'] },
  { id: 'Street', label: '🍢 Street Stalls & Cafes', matches: ['Street', 'Stall', 'Cafe'] },
];

// --- MODULAR WARD LOCALS FOR STREET ORACLE ---
const WARD_LOCALS = {
  Trades: [
    { name: "Thurman", role: "Busy Guild Scribe", archetype: "Artisan / Apprentice", demeanor: "Hurried & Calculating", gesture: "taps a feathered quill impatiently against an ink-stained ledger" },
    { name: "Orla", role: "Street Urchin", archetype: "Beggar / Urchin", demeanor: "Grinning & Opportunistic", gesture: "tosses a copper piece between soot-covered fingers" },
    { name: "Tobias", role: "Pipe-Smoking Shopkeeper", archetype: "Merchant / Factor", demeanor: "Relaxed & Opinionated", gesture: "puffs a fragrant smoke ring from his carved briar pipe" },
    { name: "Vance", role: "Off-Duty Watchman", archetype: "City Guard / Watchman", demeanor: "Gruff & Observant", gesture: "leans against a stone lantern post with arms crossed" }
  ],
  Dock: [
    { name: "Bran the Salt-Hauler", role: "Sweating Stevedore", demeanor: "Blunt & Thirsty", gesture: "wipes his brow with a brine-soaked rag" },
    { name: "Garrick", role: "Harbor Watch Sergeant", demeanor: "Vigilant & Suspicious", gesture: "rests a calloused hand on his heavy truncheon" },
    { name: "Old Nissa", role: "Fish Gut-Cutter", demeanor: "Cackling & Cynical", gesture: "flicks a silver herring scale off her filleting blade" },
    { name: "Sly Corin", role: "Ropewalk Smuggler", demeanor: "Shifty & Whispering", gesture: "glances over both shoulders before leaning in" }
  ],
  North: [
    { name: "Alden", role: "Coachman", demeanor: "Proud & Punctual", gesture: "buffs a brass carriage lantern with an oily cloth" },
    { name: "Lady Vesper", role: "Aristocratic Shopper", demeanor: "Haughty & Fastidious", gesture: "adjusts a peacock-feathered brim and glances down her nose" },
    { name: "Harlan", role: "Falconer's Apprentice", demeanor: "Eager & Chatty", gesture: "soothes a hooded hunting falcon on his leather gauntlet" },
    { name: "Master Tally", role: "Trollskull Artisan", demeanor: "Warm & Jovial", gesture: "brushes fragrant cedar shavings from his woolen tunic" }
  ],
  Castle: [
    { name: "Archivist Paul", role: "Palace Clerk", demeanor: "Formal & Precise", gesture: "straightens an armful of wax-sealed municipal decrees" },
    { name: "Captain Korgan", role: "City Guard Quartermaster", demeanor: "Stern & Veteran", gesture: "inspects the edge of a guard broadsword with his thumb" },
    { name: "Brother Lucian", role: "Lathanderite Acolyte", demeanor: "Gentle & Pious", gesture: "clasps a polished sunburst amulet against his chest" },
    { name: "Selim", role: "Great Bazaar Caravanner", demeanor: "Charming & Mercantile", gesture: "gestures invitingly with a pouch of Calimshan spices" }
  ],
  Sea: [
    { name: "Lord Julian", role: "Noble Dandy", demeanor: "Bored & Lavish", gesture: "peers through a gold-rimmed lorgnette with a languid sigh" },
    { name: "Giles", role: "Estate Butler", demeanor: "Impeccable & Reserved", gesture: "adjusts white silk cuffs with crisp, robotic precision" },
    { name: "Katrina", role: "Academy Adept", demeanor: "Excited & Scholarly", gesture: "hovers an iridescent crystal focus between slender fingers" },
    { name: "Roderick", role: "Private House Guard", demeanor: "Stoic & Unimpressed", gesture: "keeps his hand firmly resting on a gilded pommel" }
  ],
  South: [
    { name: "Durnan Jr.", role: "Caravan Teamster", demeanor: "Hearty & Pragmatic", gesture: "tightens an ox harness buckle with a heavy tug" },
    { name: "Martha", role: "Wayside Cook", demeanor: "Motherly & Shrewd", gesture: "wipes a flour-dusted apron and stirs a pot of beans" },
    { name: "Old Jed", role: "Cattle Drover", demeanor: "Craggy & Weathered", gesture: "cracks a leather bullwhip lightly against his boot heel" },
    { name: "Silas", role: "Trail Scout", demeanor: "Quiet & Alert", gesture: "whittles a point onto a cedar walking stick" }
  ],
  Field: [
    { name: "Gorrath", role: "Shanty Smith", demeanor: "Rough & Pragmatic", gesture: "hammers a glowing scrap iron wedge with heavy thuds" },
    { name: "Meg", role: "Refuse Scavenger", demeanor: "Toothless & Cunning", gesture: "roots through a battered sack of salvaged brass keys" },
    { name: "Kist", role: "Alley Distiller", demeanor: "Twitchy & Paranoiac", gesture: "hides a corked jug of cloudy moonshine beneath his coat" }
  ],
  Skullport: [
    { name: "Baeloth", role: "Drow Fence", demeanor: "Predatory & Cold", gesture: "twirls a blackened stiletto between pale, scarred knuckles" },
    { name: "Skulker Pete", role: "Goblin Pawnbroker", demeanor: "Greedy & Skittering", gesture: "bites an unmarked silver trade coin to test its purity" },
    { name: "Vanya", role: "Contraband Scribe", demeanor: "Smooth & Dangerous", gesture: "dips a raven feather quill into luminescent invisible ink" }
  ]
};



// Helper to determine if an item can be magically enchanted (+1, +2, +3)
function isEnchantableItem(item) {
  if (!item) return false;
  const name = (item['Item Name'] || item.name || '').toLowerCase();
  if (name.includes('+1') || name.includes('+2') || name.includes('+3')) return false;
  const cat = (item['Category'] || item.category || '').toLowerCase();
  const sub = (item['Subcategory'] || '').toLowerCase();
  if (cat.includes('weapon') || cat.includes('armor')) return true;
  const keywords = ['sword', 'blade', 'dagger', 'axe', 'hammer', 'bow', 'crossbow', 'spear', 'polearm', 'mace', 'shield', 'plate', 'mail', 'leather', 'scale', 'breastplate', 'chain'];
  return keywords.some(k => sub.includes(k) || name.includes(k));
}

// Compute enchanted item specifications and price
function getEnchantedItemDetails(baseItem, plusLevel) {
  if (!baseItem) return { enchantedName: '', enchantedCost: '0 gp', enchantedRarity: 'Mundane', bonusText: '' };
  const rawName = baseItem['Item Name'] || baseItem.name || 'Equipment';
  const rawCost = baseItem['Base Cost'] || baseItem.cost || '10 gp';
  const rawRarity = baseItem['Rarity'] || 'Mundane';

  if (!plusLevel || plusLevel === 0) {
    return {
      enchantedName: rawName,
      enchantedCost: rawCost,
      enchantedRarity: rawRarity,
      bonusText: ''
    };
  }

  const baseCostGold = parseGoldValue(rawCost);
  const cat = (baseItem['Category'] || baseItem.category || '').toLowerCase();
  const sub = (baseItem['Subcategory'] || '').toLowerCase();
  const isArmor = cat.includes('armor') || sub.includes('armor') || sub.includes('plate') || sub.includes('mail');
  const isShield = sub.includes('shield');

  let addedGold = 0;
  let newRarity = 'Uncommon';
  let bonusDesc = '';

  if (plusLevel === 1) {
    if (isArmor) {
      addedGold = 1000;
      newRarity = 'Rare';
      bonusDesc = '+1 Armor Class bonus. Master-tempered steel with enduring protective wards.';
    } else if (isShield) {
      addedGold = 450;
      newRarity = 'Uncommon';
      bonusDesc = '+1 Armor Class shield bonus. Inscribed with dwarven deflection runes.';
    } else {
      addedGold = 500;
      newRarity = 'Uncommon';
      bonusDesc = '+1 bonus to attack and damage rolls. Razor-honed with planar magic.';
    }
  } else if (plusLevel === 2) {
    if (isArmor) {
      addedGold = 6000;
      newRarity = 'Very Rare';
      bonusDesc = '+2 Armor Class bonus. Imbued with adamantine weave and radiant abjuration.';
    } else if (isShield) {
      addedGold = 3500;
      newRarity = 'Rare';
      bonusDesc = '+2 Armor Class shield bonus. Resonates with a kinetic barrier against missile strikes.';
    } else {
      addedGold = 4000;
      newRarity = 'Rare';
      bonusDesc = '+2 bonus to attack and damage rolls. Seamless elven balance and edge retention.';
    }
  } else if (plusLevel === 3) {
    if (isArmor) {
      addedGold = 25000;
      newRarity = 'Legendary';
      bonusDesc = '+3 Armor Class bonus. Mythic relic armor capable of turning dragon talons.';
    } else if (isShield) {
      addedGold = 14000;
      newRarity = 'Very Rare';
      bonusDesc = '+3 Armor Class shield bonus. Aegis-grade bulwark forged in celestial fire.';
    } else {
      addedGold = 16000;
      newRarity = 'Very Rare';
      bonusDesc = '+3 bonus to attack and damage rolls. Supreme masterwork weapon of myth and song.';
    }
  }

  const totalCostGold = baseCostGold + addedGold;
  return {
    enchantedName: rawName + " +" + plusLevel,
    enchantedCost: totalCostGold + " gp",
    enchantedRarity: newRarity,
    bonusText: bonusDesc
  };
}

// Helper to get Ward Haggle Rules from database
function getWardHaggleSkill(tier) {
  const t = String(tier || '3');
  if (t === '1') return { skill: 'Intimidation or Persuasion', dc: 14, desc: 'Rough street barter and survival leverage' };
  if (t === '2') return { skill: 'Persuasion, Intimidation, or Insight', dc: 15, desc: 'Harbor grit and dockside negotiation' };
  if (t === '3') return { skill: 'Persuasion or Investigation', dc: 15, desc: 'Standard guild commerce and craft appraisal' };
  if (t === '4') return { skill: 'Persuasion, Investigation, or Insight', dc: 17, desc: 'High municipal ledger and guild etiquette' };
  if (t === '5') return { skill: 'Persuasion or History', dc: 18, desc: 'Aristocratic pedigree and courtly diplomacy' };
  if (t === 'BM') return { skill: 'Deception, Intimidation, or Insight', dc: 16, desc: 'Underworld smuggler code and nerve' };
  return { skill: 'Persuasion (Charisma)', dc: 15, desc: 'Standard merchant negotiation' };
}

// Proprietor Psychology & Dynamic Archetype DC Engine
// Evaluates BOTH Ward Culture AND the specific Proprietor/Shop Archetype.
// Player View sees ONLY `playerSkill`. DM View sees `dc`, `archetypeLabel`, `dmPrompt`, `penalty`, and `isBackfireTrap` / `bonusRespectOnPass`.
function getProprietorArchetypeProfile(tier, venue) {
  const t = String(tier || venue?.['Socioeconomic Tier'] || '3');
  const sname = (venue?.['Shop Name'] || venue?.['Eatery Name'] || '').toLowerCase();
  const subcraft = (venue?.ShopSubcraft || '').toLowerCase();
  const vtype = (venue?.['Primary Vendor Type'] || venue?.['Eatery Type'] || '').toLowerCase();
  const ward = (venue?.Ward || '').toLowerCase();

  if (subcraft === 'gondite' || sname.includes('gond') || sname.includes('inspired hands') || sname.includes('zoarstar') || sname.includes('metalmasters') || sname.includes('house of light') || sname.includes('house of song') || sname.includes('house of crystal') || sname.includes('map house')) {
    return {
      id: 'gondite_guildhall',
      label: 'Gondite Inventor / Chartered Guildmaster',
      summary: 'Reveres technical mastery, clockwork/craft precision, and guild charters. Despises brute thuggery—intimidating displays (DC 15+) trigger mechanical alarms and summon the City Watch.',
      favored: 'Investigation / Arcana / History (DC 13) & Polite Persuasion (DC 14)',
      hated: 'Intimidation (DC 15+ triggers Watch/Guardian ejection) & Amateur Bluffs (DC 18)'
    };
  }
  if (t === 'BM' || ward.includes('skullport') || subcraft === 'black_market' || subcraft === 'xoblob' || sname.includes('gelfuril') || sname.includes('tiger')) {
    return {
      id: 'underworld_fence',
      label: 'Underworld Fence / Port of Shadows Broker',
      summary: "Operates beyond City Watch jurisdiction. Laughs at polite surface-world manners, respects Thieves' Cant bluffs, sharp Insight, and credible lethal nerve.",
      favored: "Deception / Thieves' Cant (DC 13), Insight (DC 14) & Intimidation (DC 17)",
      hated: 'Naive Polite Persuasion (DC 19 — marks you as an easy surface tourist)'
    };
  }
  if (subcraft.includes('arcane') || subcraft.includes('bookshop') || subcraft.includes('alchemist') || vtype.includes('arcane') || sname.includes('weirdbottle') || sname.includes('book wyrm') || sname.includes('phalantar') || sname.includes('serpentil') || sname.includes('corellon')) {
    return {
      id: 'arcane_alchemist',
      label: 'Discerning Arcanist / Shrewd Alchemist',
      summary: 'High-intellect specialist who sees through fake sob stories daily. Geeks out over genuine arcane/alchemical knowledge; triggers defensive wards if threatened.',
      favored: 'Investigation / Arcana / History (DC 12) & Insight (DC 14)',
      hated: 'Deception (DC 20 — sees through bluffs) & Intimidation (DC 15+ triggers Arcane Wards / Watch)'
    };
  }
  if (t === '5' || ward.includes('sea') || ward.includes('north') && (subcraft === 'jeweler' || subcraft === 'tailor' || subcraft === 'perfumer' || subcraft === 'cobbler')) {
    return {
      id: 'aristocratic_salon',
      label: 'High-Society Patrician / Noble Couturier',
      summary: 'Status-conscious purveyor to Waterdhavian nobility, protected by silent alarm wards and private guards. Melts at courtly etiquette; calls the Watch immediately if threatened.',
      favored: 'Courtly Persuasion (DC 14) & Noble Proxy Deception (DC 15)',
      hated: 'Intimidation (DC 15+ trips silent alarm to summon City Watch & House Guards)'
    };
  }
  if (t === '1' || t === '2' || ward.includes('dock') || ward.includes('field') || subcraft === 'weaponsmith' || subcraft === 'armorer' || subcraft === 'shields' || subcraft === 'monster_trophies' || subcraft === 'temple_tempus' || sname.includes('belmonder') || sname.includes('brian') || sname.includes('hilmer') || sname.includes('riven shield')) {
    return {
      id: 'hardened_veteran',
      label: 'Hardened Veteran / Dockside Master Smith',
      summary: 'Used to daily harbor bluster and tough talk—never calls the Watch over posturing. Shrugs off weak threats (< DC 20), but genuinely respects a DC 20+ display of iron warrior grit!',
      favored: 'Craft Appraisal / Investigation (DC 13), Insight (DC 13), or Apex Intimidation (DC 20 for -20% Respect)',
      hated: 'Fast-Talk Deception (DC 19 — hates con artists and tall tales)'
    };
  }
  return {
    id: 'guild_artisan',
    label: 'Pragmatic Guild Artisan & Quartermaster',
    summary: 'Hardworking municipal craftsperson who values honest coin, repeat expedition business, and appreciation for quality workmanship. Blows a Watch-whistle if bullied.',
    favored: 'Persuasion (DC 13) & Craft Appraisal / Investigation (DC 13)',
    hated: 'Intimidation (DC 15+ blows copper Watch-whistle) & Deception (DC 17)'
  };
}

function getTacticalApproaches(tier, isVault = false, venue = null) {
  const profile = getProprietorArchetypeProfile(tier, venue);
  const offset = isVault ? 3 : 0;
  const pid = profile.id;

  // 1. PERSUASION
  const charmDc = (pid === 'guild_artisan' ? 13 : pid === 'gondite_guildhall' || pid === 'aristocratic_salon' ? 14 : pid === 'underworld_fence' ? 19 : 15) + offset;
  // 2. INTIMIDATION
  const isWatchTrap = pid === 'gondite_guildhall' || pid === 'aristocratic_salon' || pid === 'arcane_alchemist' || pid === 'guild_artisan';
  const isWarriorRespect = pid === 'hardened_veteran';
  const muscleDc = isWatchTrap ? 15 : isWarriorRespect ? (20 + (isVault ? 1 : 0)) : (17 + offset);
  // 3. DECEPTION
  const bluffDc = (pid === 'underworld_fence' ? 13 : pid === 'aristocratic_salon' ? 15 : pid === 'guild_artisan' ? 17 : pid === 'gondite_guildhall' ? 18 : pid === 'hardened_veteran' ? 19 : 20) + offset;
  // 4. INVESTIGATION / ARCANA / HISTORY
  const loreDc = (pid === 'arcane_alchemist' ? 12 : pid === 'gondite_guildhall' || pid === 'hardened_veteran' || pid === 'guild_artisan' ? 13 : 16) + offset;
  // 5. INSIGHT
  const insightDc = (pid === 'hardened_veteran' ? 13 : pid === 'arcane_alchemist' || pid === 'underworld_fence' || pid === 'guild_artisan' ? 14 : pid === 'gondite_guildhall' ? 15 : 17) + offset;

  return [
    {
      id: 'charm',
      playerSkill: 'Persuasion (Charisma)',
      title: 'Charm & Civility (Persuasion)',
      skill: 'Persuasion (Charisma)',
      dc: charmDc,
      archetypeLabel: profile.label,
      desc: pid === 'aristocratic_salon' ? 'FAVORED: Appeal to noble etiquette, house heraldry, and high-society standing.' :
            pid === 'underworld_fence' ? 'TIRED OF IT (HARD): Polite surface manners mark you as a naive tourist in the underworld.' :
            pid === 'hardened_veteran' ? 'Speak plainly with soldier-to-soldier camaraderie and honest coin (skip flowery speeches).' :
            'FAVORED: Demonstrate polite guild courtesy, reliable patronage, and earnest respect.',
      penalty: pid === 'underworld_fence' ? 'Smirk at surface naivety (+15% tourist markup or vault denial).' : 'Polite refusal; merchant holds firm to standard ledger pricing.'
    },
    {
      id: 'muscle',
      playerSkill: 'Intimidation (Strength / Con)',
      title: 'Muscle & Coercion (Intimidation)',
      skill: 'Intimidation (Strength / Con)',
      dc: muscleDc,
      isBackfireTrap: isWatchTrap,
      bonusRespectOnPass: isWarriorRespect,
      archetypeLabel: profile.label,
      desc: isWatchTrap
              ? `⚠️ WATCH / EJECTION TRAP (Threshold DC 15): ${profile.label} despises bullies! Rolling 15+ makes your threat credible—they immediately trip the alarm, notify the City Watch / Temple Guards, and kick you out! Rolling < 15 gets you scoffed at and denied.`
              : isWarriorRespect
              ? `⚔️ VETERAN RESPECT (DC ${muscleDc}): Used to cheap harbor bluster daily—rolling under ${muscleDc} just makes them chuckle without calling the Watch. Beat DC ${muscleDc}, and they genuinely respect your iron grit (-20% discount or vault access)!`
              : `Project lethal underworld readiness (DC ${muscleDc}); no City Watch exists here, and predators respect strength.`,
      penalty: isWatchTrap
              ? 'Alarm triggered! Proprietor notifies the City Watch / Temple Guardians and bans shopper from the venue today!'
              : isWarriorRespect
              ? 'Chuckle at unconvincing bluster; hold firm at standard price (No Watch called).'
              : 'Bristling standoff (+10% surcharge or vault lockout).'
    },
    {
      id: 'fastTalk',
      playerSkill: 'Deception (Charisma)',
      title: 'Fast-Talk & Bluffs (Deception)',
      skill: 'Deception (Charisma)',
      dc: bluffDc,
      archetypeLabel: profile.label,
      desc: pid === "underworld_fence" ? "FAVORED: Flash Thieves' Cant, syndicate pass-phrases, and smuggler leverage." :
            pid === "aristocratic_salon" ? "FAVORED: Drop a Masked Lord's name or claim you are outfitting a noble house gala." :
            pid === 'arcane_alchemist' ? 'TIRED OF IT (VERY HARD): High-Int specialist sees through fabricated stories almost immediately.' :
            'TIRED OF IT (HARD): Seasoned proprietor scrutinizes tall tales and fake supplier quotes.',
      penalty: 'Bluff exposed; proprietor narrows eyes with suspicion (+10% surcharge or vault refusal).'
    },
    {
      id: 'appraisal',
      playerSkill: 'Investigation / History / Arcana (Int)',
      title: 'Material Appraisal & Craft Lore (Int)',
      skill: 'Investigation / History / Arcana (Int)',
      dc: loreDc,
      archetypeLabel: profile.label,
      desc: pid === 'gondite_guildhall' ? 'FAVORED: Geek out over clockwork gear tolerances, Lantanese schematics, or guild charters!' :
            pid === 'arcane_alchemist' ? 'FAVORED: Discuss reagent distillation purity, Netherese script, or spell-ink formulas!' :
            pid === 'hardened_veteran' ? 'FAVORED: Inspect tang balance, quench temper, or stitching like a true seasoned professional!' :
            'Point out material craftsmanship, historical provenance, or artisan hallmarks.',
      penalty: 'Perceived as pedantic nitpicking; proprietor stiffens defensively.'
    },
    {
      id: 'insight',
      playerSkill: 'Insight (Wisdom)',
      title: 'Reading Motives & Leverage (Insight)',
      skill: 'Insight (Wisdom)',
      dc: insightDc,
      archetypeLabel: profile.label,
      desc: pid === 'hardened_veteran' ? 'FAVORED: Read their working-class pride and offer clean, no-nonsense cash on the barrelhead.' :
            pid === "arcane_alchemist" || pid === "underworld_fence" ? "FAVORED: Subtly signal that you recognize their discreet off-ledger sidelines and won't ask questions." :
            'Read subtle posture cues, overstocked shelf pressure, or urgent liquidity needs.',
      penalty: 'Misread merchant mood; proprietor closes ledger and ends negotiation.'
    }
  ];
}
// Unified cost parser
const parseGoldValue = parseCostToGold;

// Calculate liquidation offer rate based on ward socioeconomic tier and category
function getLiquidationRate(tier, isGemOrArt) {
  if (isGemOrArt) {
    if (tier === '1') return 0.70; // Field Ward (cash poor)
    if (tier === '2') return 0.85; // Dock Ward
    if (tier === '3') return 1.00; // Trades & South (Guild Standard Face Value)
    if (tier === '4') return 1.00; // Castle & North
    if (tier === '5') return 1.10; // Sea Ward (Luxury Premium)
    if (tier === 'BM') return 0.85; // Skullport
    return 1.00;
  }
  // Standard gear, arms & armor
  if (tier === '1') return 0.35; // Scrap pawn
  if (tier === '2') return 0.40; // Harbor salvage
  if (tier === '3') return 0.50; // Guild standard 50%
  if (tier === '4') return 0.60; // Certified military steel
  if (tier === '5') return 0.70; // Noble consignment (scoffs at scrap)
  if (tier === 'BM') return 0.45; // No questions asked
  return 0.50;
}

// Procedural Shady Peddler Wares Generator
function generateShadyWares(itemsList) {
  if (!itemsList || itemsList.length === 0) return [];
  const pool = itemsList.filter(it => parseGoldValue(it['Base Cost']) >= 25);
  const chosen = [];

  for (let i = 0; i < 3; i++) {
    const it = pool[Math.floor(Math.random() * pool.length)] || itemsList[0];
    const baseGold = parseGoldValue(it['Base Cost']);
    const discountPct = 0.65 + Math.random() * 0.15;
    const stealPriceGold = Math.max(5, Math.round(baseGold * (1 - discountPct)));

    const roll = Math.random();
    let outcome = 'illusion';
    let dmSurfaceCue = 'Lustrous sheen; faint pleasant lavender scent masking cheap materials.';
    let dmTellCue = 'Faint ozone hum in the air; tiny hairline seam along the decorative inlay.';
    let dmSpellCue = 'Detect Magic detects unstable Transmutation/Illusion aura masking cheap tin, not true abjuration.';
    let cornerPunchline = 'The second he disappears around the corner, the glamour pops like a soap bubble—leaving you holding painted lead.';

    if (roll < 0.35) {
      outcome = 'illusion';
      dmSurfaceCue = 'Gleaming gold leaf glints convincingly under lantern light.';
      dmTellCue = 'Faint vibration of Nystul\'s Magic Aura; gold leaf flakes at the rim.';
      dmSpellCue = 'Spell confirms a Nystul\'s Magic Aura glamour cast to mimic abjuration.';
      cornerPunchline = 'The instant he rounds the alley corner, the golden shimmer fizzles out—the player is holding a whittled stick of painted pine.';
    } else if (roll < 0.60) {
      outcome = 'defective';
      dmSurfaceCue = 'Substantial weight and sharp clean edge; looks ready for battle.';
      dmTellCue = 'Hairline stress fracture along the crossguard/pommel tang.';
      dmSpellCue = 'Faint magic resonance, but the physical alloy shows severe internal cracking.';
      cornerPunchline = 'You take a test swing the moment he is out of sight—the pommel snaps clean off and clatters onto the cobblestones.';
    } else if (roll < 0.80) {
      outcome = 'cursed';
      dmSurfaceCue = 'Exquisite dark metal that feels strangely warm to the touch.';
      dmTellCue = 'Subtle unsettling chill on the skin; faint sulfur whisper when tilted.';
      dmSpellCue = 'Potent magical signature woven with a binding curse (Constricts skin; disadvantage on Stealth).';
      cornerPunchline = 'You try it on as he walks away—it constricts tight against your skin with a sinister click. It will not come off without Remove Curse.';
    } else {
      outcome = 'real';
      dmSurfaceCue = 'Flawless guild forging; perfectly balanced in the hand.';
      dmTellCue = 'Noble house or City Watch serial number crudely scratched off the base.';
      dmSpellCue = 'Genuine, stable magical aura hums cleanly through the piece.';
      cornerPunchline = 'He melts into the fog. You test the enchantment—it hums warm and steady. You actually scored an authentic stolen steal.';
    }

    chosen.push({
      item: it,
      stealPrice: stealPriceGold + ' gp',
      stealPriceGold,
      outcome,
      dmSurfaceCue,
      dmTellCue,
      dmSpellCue,
      cornerPunchline
    });
  }
  return chosen;
}

export default function App() {
  const { 
    data, 
    cityPacks,
    activeCityPackId,
    loadCustomCityPack,
    selectedPlanet,
    selectedContinent,
    selectedRegion,
    selectedSettlement,
    selectedWard, 
    venueType, 
    selectedVenue, 
    daySeed, 
    cart, 
    purchasedStock,
    completeCheckout,
    activeMeal,
    disabledVenues,
    toggleVenueDisabled,
    hiddenNodes,
    toggleNodeHidden,
    bannedPlayersByVenue,
    banPlayerFromVenue,
    partyMembers,
    activePlayer,
    setActivePlayer,
    addPartyMember,
    playerLocations,
    activityLog,
    addActivityLog,
    rollResolutionMode,
    setRollResolutionMode,
    pendingChecks,
    submitPendingCheck,
    resolvePendingCheck,
    sessionCode,
    sessionRole,
    isPlayerLocked,
    playerHasJoinedLobby,
    roomConnectionStatus,
    roomStatusMessage,
    connectedPeersCount,
    hostLiveRoom,
    joinLiveRoom,
    openPlayerJoinLobby,
    leaveLiveRoom,
    syncRelayUrl,
    setSessionConfig,
    pushRoomStateNow,
    relockVault,
    dismissItemAnomaly,
    unlockedVaults,
    vaultLockedOut,
    setPlanet,
    setContinent,
    setRegion,
    setSettlement,
    selectWard, 
    setVenueType, 
    selectVenue, 
    clearNavigation, 
    resetToCosmos,
    rerollStock, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart,
    consumeMeal,
    clearActiveMeal,
    unlockVault,
    lockOutVault,
    getAdjustedPrice,
    viewDensity = 'comfortable',
    setViewDensity,
    removePartyMember,
    resetPartyRoster
  } = useLootStore();

  const [includePlanarImports, setIncludePlanarImports] = useState(false);


  // Master D&D Beyond Catalog (2,159+ Items) State
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogRarity, setCatalogRarity] = useState('All');
  const [catalogCategory, setCatalogCategory] = useState('All');
  const [catalogSourcebook, setCatalogSourcebook] = useState('All');
  const [catalogLimit, setCatalogLimit] = useState(60);

  // Visual Rarity & Coin Pip Helpers
  const getRarityBadgeStyle = (rarity) => {
    const r = (rarity || 'Common').trim();
    if (r === 'Legendary') return 'bg-amber-950/90 text-amber-300 border-amber-500/70 shadow-sm shadow-amber-500/20';
    if (r === 'Very Rare') return 'bg-purple-950/90 text-purple-300 border-purple-500/70 shadow-sm shadow-purple-500/20';
    if (r === 'Rare') return 'bg-sky-950/90 text-sky-300 border-sky-500/70 shadow-sm shadow-sky-500/20';
    if (r === 'Uncommon') return 'bg-emerald-950/90 text-emerald-300 border-emerald-500/70 shadow-sm shadow-emerald-500/20';
    if (r === 'Mundane') return 'bg-slate-900 text-slate-400 border-slate-700';
    return 'bg-slate-800/90 text-slate-200 border-slate-600';
  };

  const getRarityBorderClass = (rarity) => {
    const r = (rarity || 'Common').replace(/\s+/g, '');
    return `rarity-border-${r}`;
  };

  const getCoinPipColor = (formattedCost) => {
    const s = String(formattedCost || 'gp').toLowerCase();
    if (s.includes('pp')) return 'bg-sky-300 ring-2 ring-sky-500/40';
    if (s.includes('sp')) return 'bg-slate-300 ring-2 ring-slate-400/40';
    if (s.includes('cp')) return 'bg-amber-700 ring-2 ring-amber-800/40';
    return 'bg-amber-400 ring-2 ring-amber-500/40';
  };

  // Room Connect & City Pack Modals
  const [roomModalOpen, setRoomModalOpen] = useState(false);
  const [cityPackModalOpen, setCityPackModalOpen] = useState(false);
  const [roomCodeInput, setRoomCodeInput] = useState(sessionCode || 'LOOT');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [playerJoinCodeInput, setPlayerJoinCodeInput] = useState(sessionCode || '');
  const [playerJoinNameInput, setPlayerJoinNameInput] = useState('');
  const [copyLinkFeedback, setCopyLinkFeedback] = useState(false);
  const [heistPhysicalD20, setHeistPhysicalD20] = useState('');
  const [heistSkillChoice, setHeistSkillChoice] = useState('Perception (Wisdom)');
  const [appraisalSkillChoice, setAppraisalSkillChoice] = useState('Investigation (Int)');
  const [oracleSkillChoice, setOracleSkillChoice] = useState('Persuasion (Cha)');
  const [pendingNotice, setPendingNotice] = useState(null);


  // --- LOCAL COMPONENT STATE ---
  const [cartOpen, setCartOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRarity, setSelectedRarity] = useState('All');
  const [selectedSection, setSelectedSection] = useState('All');

  // Project L.O.O.T. Per-Item Haggle & Modals
  const [vaultModalOpen, setVaultModalOpen] = useState(false);
  const [selectedVaultApproach, setSelectedVaultApproach] = useState('charm');
  const [selectedHaggleApproach, setSelectedHaggleApproach] = useState('charm');
  const [vaultPhysicalD20, setVaultPhysicalD20] = useState('');
  const [vaultRollResult, setVaultRollResult] = useState(null);
  const [heistModalItem, setHeistModalItem] = useState(null);
  const [heistActingPlayer, setHeistActingPlayer] = useState('');
  const [heistPhase, setHeistPhase] = useState(1);
  const [heistResult, setHeistResult] = useState(null);
  const [heistMidRoll, setHeistMidRoll] = useState('');
  const [skillMod, setSkillMod] = useState(3);
  const [haggleModalItem, setHaggleModalItem] = useState(null);
  const [itemHaggleResult, setItemHaggleResult] = useState(null);
  const [haggleResult, setHaggleResult] = useState(null);
  const [hagglePhysicalD20, setHagglePhysicalD20] = useState('');
  const [gambleResult, setGambleResult] = useState(null);
  const [activityLogOpen, setActivityLogOpen] = useState(false);

  // Scoping, Filtering & Search
  const [isCityWideScope, setIsCityWideScope] = useState(false);
  const [selectedTradeFilter, setSelectedTradeFilter] = useState('All');
  const [venueSearchTerm, setVenueSearchTerm] = useState('');
  const [dmMode, setDmMode] = useState(false);
  const [inspectingItem, setInspectingItem] = useState(null);
  const [appMode, setAppMode] = useState('kiosk'); // 'commerce', 'appraisal', 'spoils'
  const [storeTab, setStoreTab] = useState('buy'); // 'buy', 'sell', 'forge'
  const [itemEnchantGrade, setItemEnchantGrade] = useState(0);
  const [appraisalEnchantGrade, setAppraisalEnchantGrade] = useState(0);
  const [forgeSelectedItem, setForgeSelectedItem] = useState(null);
  const [forgeTargetGrade, setForgeTargetGrade] = useState(1);

  // Shady Alley Peddler State
  const [shadyPeddlerModalOpen, setShadyPeddlerModalOpen] = useState(false);
  const [shadyWares, setShadyWares] = useState([]);
  const [shadyActiveIndex, setShadyActiveIndex] = useState(0);
  const [shadyInspectResult, setShadyInspectResult] = useState(null);
  const [shadySpellRevealed, setShadySpellRevealed] = useState(false);
  const [shadyPhysicalD20, setShadyPhysicalD20] = useState('');
  const [shadyPurchased, setShadyPurchased] = useState(false); // 'inventory', 'appraisal'

  // Street Oracle state
  const [askLocalModalOpen, setAskLocalModalOpen] = useState(false);
  const [selectedLocalNpc, setSelectedLocalNpc] = useState(null);
  const [localQueryTrade, setLocalQueryTrade] = useState('Weapons');
  const [localRollBonus, setLocalRollBonus] = useState(0);
  const [oraclePhysicalD20, setOraclePhysicalD20] = useState('');
  const [localRollResult, setLocalRollResult] = useState(null);
  const [suspiciousShops, setSuspiciousShops] = useState([]);

  // Pawn & Appraisal Counter state
  const [appraisalItem, setAppraisalItem] = useState(null);
  const [appraisalBonus, setAppraisalBonus] = useState(0);
  const [appraisalPhysicalD20, setAppraisalPhysicalD20] = useState('');
  const [appraisalRollResult, setAppraisalRollResult] = useState(null);
  const [sellSearch, setSellSearch] = useState('');
  const [customItemMode, setCustomItemMode] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Treasure & Art');
  const [customBaseCost, setCustomBaseCost] = useState(50);
  const [itemCondition, setItemCondition] = useState('standard');
  const [soldHistory, setSoldHistory] = useState([]);

  // Dungeon Spoils Loot Generator state (Exact Level 1-20 & Party Size 1-8)
  const [lootPartyLevel, setLootPartyLevel] = useState(3);
  const [lootPartySize, setLootPartySize] = useState(4);
  const [lootScenarioGroup, setLootScenarioGroup] = useState('All');
  const [lootSource, setLootSource] = useState('LockedStrongbox');
  const [lootPhysicalD100, setLootPhysicalD100] = useState('');
  const [generatedLoot, setGeneratedLoot] = useState(null);

  // Auto-detect ?room=CODE Join Link and launch Kahoot/Jackbox Player Join Lobby Gate
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    const urlRole = params.get('role');
    if (urlRoom) {
      const cleanCode = urlRoom.toUpperCase().replace(/[^A-Z0-9]/g, '');
      setRoomCodeInput(cleanCode);
      setPlayerJoinCodeInput(cleanCode);
      if (urlRole === 'host') {
        setSessionConfig({ sessionCode: cleanCode, sessionRole: 'host' });
      } else {
        setDmMode(false);
        openPlayerJoinLobby(cleanCode);
      }
    }
  }, []);

  // Keep dmMode strictly false whenever locked in Player Mode
  useEffect(() => {
    if (isPlayerLocked && dmMode) {
      setDmMode(false);
    }
  }, [isPlayerLocked, dmMode]);


  // Clean up legacy 5-character test roster if still cached in browser localStorage
  useEffect(() => {
    if (Array.isArray(partyMembers) && partyMembers.includes('Kaelen (Rogue)') && partyMembers.includes('Brim (Barbarian)')) {
      if (resetPartyRoster) resetPartyRoster();
    }
  }, []);

  // Ensure Master Catalog is strictly DM View only
  useEffect(() => {
    if (!dmMode && appMode === 'catalog') {
      setAppMode('kiosk');
    }
  }, [dmMode, appMode]);

  // Comprehensive 24 Curated Dungeon Spoils Scenarios (Grouped by Context)
  const LOOT_SCENARIOS = [
    // GROUP 1: Bodies, Pockets & Individual Enemies
    {
      id: 'FootpadPockets',
      group: 'Enemies',
      groupLabel: 'Bodies & Enemies',
      label: '1. Footpad, Bandit, or Guard (Pockets & Belt Pouch)',
      desc: 'Quick pat-down of a defeated grunt: loose coin, sidearm dagger, dice, rations, keys, or a minor potion.',
      coinScale: 0.12,
      coinProfile: 'pocket',
      maxWeight: 6,
      valuablesRange: [0, 1],
      valuablesChance: 0.25,
      consumablesRange: [1, 2],
      equipmentRange: [1, 1],
      rarityBias: -1,
      theme: 'pockets'
    },
    {
      id: 'MercenaryCorpse',
      group: 'Enemies',
      groupLabel: 'Bodies & Enemies',
      label: '2. Mercenary, Veteran, or Knight Corpse (Battlefield Salvage)',
      desc: 'Stripping martial weapons, maintained armor, shield, whetstone, and military pay-pouch from a seasoned warrior.',
      coinScale: 0.28,
      coinProfile: 'pocket',
      maxWeight: 60,
      valuablesRange: [0, 1],
      valuablesChance: 0.35,
      consumablesRange: [1, 2],
      equipmentRange: [1, 2],
      rarityBias: 0,
      theme: 'martial'
    },
    {
      id: 'CultistRobes',
      group: 'Enemies',
      groupLabel: 'Bodies & Enemies',
      label: '3. Cultist, Dark Acolyte, or Fanatic (Robes & Ritual Pouch)',
      desc: 'Ceremonial blades, poison vials, dark talismans, incense, spell scrolls, and bloodstone/onyx offerings.',
      coinScale: 0.22,
      coinProfile: 'ancient',
      maxWeight: 8,
      valuablesRange: [0, 1],
      valuablesChance: 0.50,
      consumablesRange: [1, 2],
      equipmentRange: [1, 1],
      rarityBias: 0,
      theme: 'cult'
    },
    {
      id: 'AssassinKit',
      group: 'Enemies',
      groupLabel: 'Bodies & Enemies',
      label: '4. Rogue, Spy, or Assassin Corpse (Concealed Gear)',
      desc: 'Hidden boot-blades, poisons, thieves\' tools, smoke pellets, stealth gear, and high-value payoff gems.',
      coinScale: 0.35,
      coinProfile: 'noble',
      maxWeight: 8,
      valuablesRange: [1, 1],
      valuablesChance: 0.65,
      consumablesRange: [1, 2],
      equipmentRange: [1, 2],
      rarityBias: 0,
      theme: 'stealth'
    },
    {
      id: 'MageSatchel',
      group: 'Enemies',
      groupLabel: 'Bodies & Enemies',
      label: '5. Enemy Mage, Apprentice, or Warlock (Arcane Satchel)',
      desc: 'Spell scrolls, wand or focus, componentgems, potions, luminescent ink, and arcane curios.',
      coinScale: 0.32,
      coinProfile: 'noble',
      maxWeight: 10,
      valuablesRange: [1, 2],
      valuablesChance: 0.65,
      consumablesRange: [1, 3],
      equipmentRange: [1, 1],
      rarityBias: 0,
      theme: 'arcane'
    },
    {
      id: 'MonsterCarcass',
      group: 'Enemies',
      groupLabel: 'Bodies & Enemies',
      label: '6. Beast, Monstrosity, or Ooze Carcass (Gizzard & Nest Debris)',
      desc: 'Undigested coins, swallowed rough gemstones, and acid-scarred metal weapons or rings from past meals.',
      coinScale: 0.20,
      coinProfile: 'junkyard',
      maxWeight: 45,
      valuablesRange: [0, 2],
      valuablesChance: 0.50,
      consumablesRange: [0, 1],
      equipmentRange: [1, 2],
      rarityBias: 0,
      theme: 'carcass'
    },

    // GROUP 2: Room Furnishings, Containers & Caches
    {
      id: 'LockedStrongbox',
      group: 'Containers',
      groupLabel: 'Containers & Rooms',
      label: '7. Locked Iron Strongbox / Merchant\'s Counting-Safe',
      desc: 'Stacks of gold & platinum, silver/gold trade bars, cut gemstones, fine rings, and compact valuables (no bulky gear).',
      coinScale: 1.15,
      coinProfile: 'commercial',
      maxWeight: 6,
      valuablesRange: [1, 3],
      valuablesChance: 0.95,
      consumablesRange: [0, 1],
      equipmentRange: [1, 2],
      rarityBias: 1,
      theme: 'safe'
    },
    {
      id: 'FailedDelver',
      group: 'Containers',
      groupLabel: 'Containers & Rooms',
      label: '8. Adventurer\'s Skeleton & Rotted Backpack (Failed Delver)',
      desc: 'Practical dungeoneering gear (rope, pitons, lantern), 1-2 emergency potions/scrolls, and a prized weapon or curio.',
      coinScale: 0.30,
      coinProfile: 'pocket',
      maxWeight: 25,
      valuablesRange: [0, 1],
      valuablesChance: 0.40,
      consumablesRange: [1, 2],
      equipmentRange: [1, 2],
      rarityBias: 0,
      theme: 'delver'
    },
    {
      id: 'ArmoryRack',
      group: 'Containers',
      groupLabel: 'Containers & Rooms',
      label: '9. Barracks Weapon Rack & Armory Crate',
      desc: 'Militia and stronghold weapon racks: swords, polearms, bows, bundles of arrows/bolts, shields, and armor suits.',
      coinScale: 0.10,
      coinProfile: 'minimal',
      maxWeight: 65,
      valuablesRange: [0, 1],
      valuablesChance: 0.15,
      consumablesRange: [1, 2],
      equipmentRange: [2, 3],
      rarityBias: 0,
      theme: 'armory'
    },
    {
      id: 'AlchemistBench',
      group: 'Containers',
      groupLabel: 'Containers & Rooms',
      label: '10. Alchemist\'s Workbench & Apothecary Cabinet',
      desc: 'Stoppered crystal phials, healing draughts, antitoxins, volatile alchemical fire/acid, poisons, and herbalism kits.',
      coinScale: 0.15,
      coinProfile: 'minimal',
      maxWeight: 8,
      valuablesRange: [0, 1],
      valuablesChance: 0.40,
      consumablesRange: [2, 4],
      equipmentRange: [0, 1],
      rarityBias: 0,
      theme: 'alchemy'
    },
    {
      id: 'WizardDesk',
      group: 'Containers',
      groupLabel: 'Containers & Rooms',
      label: '11. Wizard\'s Study Desk & Arcane Bookshelf',
      desc: 'Spell scrolls, wands, rods, arcane foci, rare archival inks, vellum ledgers, and planar/arcane instruments.',
      coinScale: 0.35,
      coinProfile: 'noble',
      maxWeight: 10,
      valuablesRange: [1, 2],
      valuablesChance: 0.60,
      consumablesRange: [1, 3],
      equipmentRange: [1, 2],
      rarityBias: 0,
      theme: 'arcane'
    },
    {
      id: 'NobleWardrobe',
      group: 'Containers',
      groupLabel: 'Containers & Rooms',
      label: '12. Noble\'s Wardrobe, Vanity & Velvet Jewelry Box',
      desc: 'Aristocratic silks, cloaks, signet rings, sapphire/ruby jewelry, perfumes, monocles, and dress rapiers.',
      coinScale: 0.75,
      coinProfile: 'noble',
      maxWeight: 12,
      valuablesRange: [2, 3],
      valuablesChance: 0.95,
      consumablesRange: [0, 1],
      equipmentRange: [1, 2],
      rarityBias: 0,
      theme: 'noble'
    },
    {
      id: 'SmugglerCrate',
      group: 'Containers',
      groupLabel: 'Containers & Rooms',
      label: '13. Smuggler\'s Cargo Crate / Contraband Barrel',
      desc: 'Straw-packed dockside crate holding trade bars, waterproof pouches, firearms, illicit poisons, and stolen curios.',
      coinScale: 0.60,
      coinProfile: 'commercial',
      maxWeight: 25,
      valuablesRange: [1, 2],
      valuablesChance: 0.70,
      consumablesRange: [1, 2],
      equipmentRange: [1, 2],
      rarityBias: 0,
      theme: 'smuggler'
    },
    {
      id: 'HiddenCache',
      group: 'Containers',
      groupLabel: 'Containers & Rooms',
      label: '14. Hidden Wall Safe / Loose Floorboard Cache',
      desc: 'Secret hollow brick or false baseboard hiding emergency platinum/gold, cut gems, a ring or wand, and escape tools.',
      coinScale: 0.65,
      coinProfile: 'noble',
      maxWeight: 5,
      valuablesRange: [1, 2],
      valuablesChance: 0.85,
      consumablesRange: [1, 2],
      equipmentRange: [1, 1],
      rarityBias: 1,
      theme: 'safe'
    },
    {
      id: 'TempleReliquary',
      group: 'Containers',
      groupLabel: 'Containers & Rooms',
      label: '15. Temple Offering Coffer & Sacred Reliquary',
      desc: 'Consecrated silver & gold tithes, moonstones/diamonds, healing salves, maces, shields, and blessed relics.',
      coinScale: 0.70,
      coinProfile: 'ancient',
      maxWeight: 25,
      valuablesRange: [1, 2],
      valuablesChance: 0.80,
      consumablesRange: [1, 2],
      equipmentRange: [1, 2],
      rarityBias: 0,
      theme: 'temple'
    },

    // GROUP 3: Monster Lairs & Faction Camps
    {
      id: 'GoblinJunkyard',
      group: 'Lairs',
      groupLabel: 'Camps & Lairs',
      label: '16. Goblin, Kobold, or Orc Junkyard Stash',
      desc: 'Heaps of raided copper & silver, caltrops, spring traps, shiny baubles, light weapons, and 1 misunderstood magic item.',
      coinScale: 0.45,
      coinProfile: 'junkyard',
      maxWeight: 25,
      valuablesRange: [0, 2],
      valuablesChance: 0.40,
      consumablesRange: [1, 2],
      equipmentRange: [1, 2],
      rarityBias: -1,
      theme: 'junkyard'
    },
    {
      id: 'BanditHideout',
      group: 'Lairs',
      groupLabel: 'Camps & Lairs',
      label: '17. Bandit Camp, Pirate Cove, or Guild Pay-Chest',
      desc: 'Captured caravan strongboxes, silver trade bars, martial weapons, armor, potions, and stolen merchant goods.',
      coinScale: 0.90,
      coinProfile: 'commercial',
      maxWeight: 45,
      valuablesRange: [1, 3],
      valuablesChance: 0.75,
      consumablesRange: [1, 2],
      equipmentRange: [1, 3],
      rarityBias: 0,
      theme: 'bandit'
    },
    {
      id: 'AncientCrypt',
      group: 'Lairs',
      groupLabel: 'Camps & Lairs',
      label: '18. Ancient Catacombs, Barrow Tomb, or Royal Sarcophagus',
      desc: 'Centuries-old burial gold, funerary chalices, lapis/onyx gems, ceremonial blades, armor, and ancient rings.',
      coinScale: 1.05,
      coinProfile: 'ancient',
      maxWeight: 55,
      valuablesRange: [1, 3],
      valuablesChance: 0.85,
      consumablesRange: [0, 2],
      equipmentRange: [1, 2],
      rarityBias: 0,
      theme: 'crypt'
    },
    {
      id: 'SunkenShipwreck',
      group: 'Lairs',
      groupLabel: 'Camps & Lairs',
      label: '19. Sunken Shipwreck Cabin or Flooded Sea-Cave Chest',
      desc: 'Barnacle-encrusted dubloons, lustrous pearls, navigational astrolabes, cutlasses, tridents, and waterproofed gear.',
      coinScale: 1.10,
      coinProfile: 'commercial',
      maxWeight: 40,
      valuablesRange: [1, 3],
      valuablesChance: 0.85,
      consumablesRange: [1, 2],
      equipmentRange: [1, 2],
      rarityBias: 0,
      theme: 'maritime'
    },
    {
      id: 'UnderdarkOutpost',
      group: 'Lairs',
      groupLabel: 'Camps & Lairs',
      label: '20. Underdark Outpost (Drow, Duergar, or Mind Flayer Cache)',
      desc: 'Mithral and adamantine ingots, spider-silk gear, subterranean gems, drow poisons, crossbows, and darkvision items.',
      coinScale: 1.00,
      coinProfile: 'noble',
      maxWeight: 50,
      valuablesRange: [1, 3],
      valuablesChance: 0.80,
      consumablesRange: [1, 2],
      equipmentRange: [1, 2],
      rarityBias: 0,
      theme: 'underdark'
    },
    {
      id: 'GiantSack',
      group: 'Lairs',
      groupLabel: 'Camps & Lairs',
      label: '21. Giant\'s Battered Sack, Troll Cave, or Ogre Den',
      desc: 'Heavy sacks of dented coins, trade bars, heavy weapons, runic chisels, and gear from crushed adventurers.',
      coinScale: 0.95,
      coinProfile: 'junkyard',
      maxWeight: 65,
      valuablesRange: [1, 2],
      valuablesChance: 0.60,
      consumablesRange: [1, 2],
      equipmentRange: [1, 3],
      rarityBias: 0,
      theme: 'giant'
    },

    // GROUP 4: Boss Vaults & Legendary Hoards
    {
      id: 'DungeonBossChest',
      group: 'Hoards',
      groupLabel: 'Boss Vaults & Hoards',
      label: '22. Dungeon Boss Treasury & Warlord\'s Stronghold Coffer',
      desc: 'Climactic boss reward: full DMG coin hoard, cut gemstones, art objects, potions, and signature magic arms & armor.',
      coinScale: 1.60,
      coinProfile: 'hoard',
      maxWeight: 65,
      valuablesRange: [2, 4],
      valuablesChance: 1.0,
      consumablesRange: [2, 3],
      equipmentRange: [2, 3],
      rarityBias: 1,
      theme: 'boss'
    },
    {
      id: 'ArchmageVault',
      group: 'Hoards',
      groupLabel: 'Boss Vaults & Hoards',
      label: '23. Archmage Sanctum, Lich Vault, or Planar Reliquary',
      desc: 'High-security arcane vault: platinum & gold, ruby/diamond reagents, staffs, wands, rings, scrolls, and planar relics.',
      coinScale: 1.75,
      coinProfile: 'noble',
      maxWeight: 35,
      valuablesRange: [2, 4],
      valuablesChance: 1.0,
      consumablesRange: [2, 4],
      equipmentRange: [2, 3],
      rarityBias: 1,
      theme: 'arcane_boss'
    },
    {
      id: 'DragonHoard',
      group: 'Hoards',
      groupLabel: 'Boss Vaults & Hoards',
      label: '24. Ancient Dragon\'s Lair / Wyrm Hoard (Grand Treasury)',
      desc: 'Glittering mountains of coinage, precious gems, royal regalia, and legendary weapons, armor, and wondrous relics.',
      coinScale: 2.80,
      coinProfile: 'hoard',
      maxWeight: 65,
      valuablesRange: [3, 5],
      valuablesChance: 1.0,
      consumablesRange: [2, 3],
      equipmentRange: [3, 4],
      rarityBias: 1,
      theme: 'dragon'
    }
  ];




  // Top-level isFood definition accessible in all sub-views and modals
  const isFood = Boolean(selectedVenue?.['Eatery Name'] || selectedVenue?.['Eatery Type'] || venueType === 'eateries');
  const venueName = selectedVenue ? (selectedVenue['Shop Name'] || selectedVenue['Eatery Name']) : '';
  const isVaultUnlocked = unlockedVaults[venueName] || false;
  const isVaultLockedOut = vaultLockedOut[venueName] || false;

  // Dynamic Wards & Settlements from active City Pack
  const activeWards = useMemo(() => {
    if (data?.wards && Array.isArray(data.wards) && data.wards.length > 0 && data.wards[0].id) {
      return data.wards;
    }
    return WARDS;
  }, [data]);

  const activeSettlements = useMemo(() => {
    const baseIds = new Set(SETTLEMENTS.map(s => s.id.toLowerCase()));
    const merged = SETTLEMENTS.map(s => {
      const pack = cityPacks?.[s.id] || cityPacks?.[s.name];
      if (pack) {
        return {
          ...s,
          active: true,
          subtitle: pack.subtitle || s.subtitle,
          desc: pack.desc || s.desc
        };
      }
      return s;
    });
    Object.values(cityPacks || {}).forEach(pack => {
      const pid = (pack.id || pack.name || '').toLowerCase();
      if (pid && !baseIds.has(pid)) {
        merged.push({
          id: pack.id || pack.name,
          name: pack.name,
          subtitle: pack.subtitle || 'Custom City Data Pack',
          active: true,
          desc: pack.desc || `${(pack.wards || []).length} Districts • ${(pack.shops || []).length} Storefronts • ${(pack.eateries || []).length} Eateries.`
        });
      }
    });
    return merged;
  }, [cityPacks]);

  // Header Title & Subtitle
  const headerTitle = selectedSettlement ? `Project L.O.O.T. • ${selectedSettlement}` : 'Project L.O.O.T. • Logistical Overview of Optimized Transactions';
  
  const headerSubtitle = useMemo(() => {
    if (!selectedPlanet) return 'Prime Material • Crystal Spheres & Realmspace';
    if (!selectedContinent) return `Planet ${selectedPlanet} • Planetary Chart`;
    if (!selectedRegion) return `${selectedPlanet} • ${selectedContinent} Atlas`;
    if (!selectedSettlement) return `${selectedPlanet} • ${selectedRegion}`;
    const citySubtitle = data?.cityPack?.subtitle || 'Municipal Commerce Network';
    if (!selectedWard) return `${selectedPlanet} • ${selectedRegion} • ${citySubtitle}`;
    return `${selectedSettlement} • ${activeWards.find(w => w.id === selectedWard)?.name || selectedWard}`;
  }, [selectedPlanet, selectedContinent, selectedRegion, selectedSettlement, selectedWard, activeWards, data]);

    // Ward Venue Counts (Shops vs Eateries)
  const { wardShopsCount, wardEateriesCount } = useMemo(() => {
    if (!selectedWard) return { wardShopsCount: 0, wardEateriesCount: 0 };
    const w = selectedWard.toLowerCase();
    const shops = (data?.shops || []).filter(v => v.Ward && (selectedWard === 'Skullport' ? v.Ward.includes('Skullport') : v.Ward.toLowerCase().includes(w)));
    const eateries = (data?.eateries || []).filter(v => v.Ward && (selectedWard === 'Skullport' ? v.Ward.includes('Skullport') : v.Ward.toLowerCase().includes(w)));
    return { wardShopsCount: shops.length, wardEateriesCount: eateries.length };
  }, [data, selectedWard]);

  // Upgraded Current Venues: Supports Ward Scoping, Category Pill Filtering, and Smart Keyword Search
  const currentVenues = useMemo(() => {
    if (!selectedWard && !isCityWideScope) return [];

    let baseList = (venueType === 'eateries') ? (data?.eateries || []) : (data?.shops || []);

    // Pinned Street Food Cart at top of eateries tab
    if (venueType === 'eateries') {
      const wardName = activeWards.find(w => w.id === selectedWard)?.name || 'Waterdeep';
      const streetCartVenue = {
        'Eatery Name': `Street Food Cart (${wardName})`,
        'Ward': selectedWard || 'Trades',
        'Socioeconomic Tier': activeWards.find(w => w.id === selectedWard)?.tier || '3',
        'Eatery Type': 'Street Stalls & Cafes',
        'Proprietor / Staff': 'Unnamed Cobblestone Vendor - Stained linen apron, ladle in hand, hot iron coals.',
        'Vibe & Decor': 'Charcoal smoke drifts from a weathered two-wheeled handcart. Skewers sizzle on an iron grate and clay cups steam with hot broth.',
        'DM Read-Aloud': 'A cloud of savory hickory smoke and sizzling fat greets you from an iron brazier mounted on wooden wheels. The vendor nods silently, ladle poised over a steaming kettle.',
        'Menu Tags': 'Street Food, Quick, Skewers, Broth, Fast',
        'isStreetCart': true
      };
      baseList = [streetCartVenue, ...baseList];
    }

    // 0. DM Universal Visibility Filter (hide disabled shops/venues from players)
    if (!dmMode) {
      baseList = baseList.filter(v => {
        const vName = v['Shop Name'] || v['Eatery Name'];
        return !(disabledVenues && disabledVenues[vName]) && !(hiddenNodes && hiddenNodes[`venue::${vName}`]);
      });
    }

    // 1. Ward Scoping (unless in City-Wide mode)
    if (!isCityWideScope && selectedWard) {
      baseList = baseList.filter(v => {
        if (selectedWard === 'Skullport') return v.Ward && v.Ward.includes('Skullport');
        return v.Ward && v.Ward.toLowerCase().includes(selectedWard.toLowerCase());
      });
    }

    // 2. Trade / Eatery Category Filter
    if (venueType === 'shops' && selectedTradeFilter !== 'All') {
      const group = TRADE_GROUPS.find(g => g.id === selectedTradeFilter);
      if (group && group.matches) {
        baseList = baseList.filter(v => group.matches.includes(v['Primary Vendor Type']));
      }
    } else if (venueType === 'eateries' && selectedTradeFilter !== 'All') {
      const group = EATERY_GROUPS.find(g => g.id === selectedTradeFilter);
      if (group && group.matches) {
        baseList = baseList.filter(v => group.matches.some(m => (v['Eatery Type'] || '').includes(m)));
      }
    }

    // 3. Smart Search Filter (searches Name, Type, Tags, AND items sold in the shop!)
    if (venueSearchTerm && venueSearchTerm.trim()) {
      const q = venueSearchTerm.toLowerCase();
      baseList = baseList.filter(v => {
        const vName = v['Shop Name'] || v['Eatery Name'] || '';
        const vType = v['Primary Vendor Type'] || v['Eatery Type'] || '';
        const vTags = v['DNA / Inventory Tags'] || v['Menu Tags'] || '';
        const vProp = v['Proprietor / Staff'] || '';

        if (vName.toLowerCase().includes(q) || 
            vType.toLowerCase().includes(q) || 
            vTags.toLowerCase().includes(q) || 
            vProp.toLowerCase().includes(q)) {
          return true;
        }

        // Deep item inventory check
        if (venueType === 'shops') {
          return (data?.items || []).some(it => 
            it['Iconic Storefront'] === vName && 
            (it['Item Name'] || '').toLowerCase().includes(q)
          );
        } else {
          const rawMenu = data.food_menu || data.menu || [];
          return rawMenu.some(m => 
            (m['Eatery / Location'] === vName || m.Ward === v.Ward) && 
            (m['Item Name'] || '').toLowerCase().includes(q)
          );
        }
      });
    }

    return baseList;
  }, [data, selectedWard, venueType, isCityWideScope, selectedTradeFilter, venueSearchTerm, dmMode, disabledVenues]);

  // Strict Lore-Accurate Storefront Stocking Engine (Subcraft + Exclusivity Scope + Socioeconomic Tier Caps)
  const venueInventory = useMemo(() => {
    if (!selectedVenue) return [];
    const isFood = Boolean(selectedVenue?.['Eatery Name'] || selectedVenue?.['Eatery Type'] || venueType === 'eateries');

    if (!isFood) {
      const vName = selectedVenue['Shop Name'];
      const subcraft = selectedVenue.ShopSubcraft || 'general_outfitter';
      const tier = String(selectedVenue['Socioeconomic Tier'] || '3');

      const STRICT_SUBCRAFT_MAP = {
        cobbler: new Set(['cobbler']),
        shields: new Set(['shields']),
        gondite: new Set(['gondite']),
        instruments: new Set(['instruments']),
        perfumer: new Set(['perfumer']),
        cartographer: new Set(['cartographer']),
        chandler: new Set(['chandler']),
        glassblower: new Set(['glassblower']),
        locksmith: new Set(['locksmith']),
        clockmaker: new Set(['locksmith', 'gondite']),
        scribe_stationer: new Set(['scribe_stationer']),
        bookshop_scrolls: new Set(['bookshop_scrolls']),
        bowyer: new Set(['bowyer']),
        weaponsmith: new Set(['weaponsmith']),
        armorer: new Set(['armorer', 'shields']),
        leather_armor: new Set(['armorer', 'cobbler']),
        apothecary: new Set(['apothecary']),
        apothecary_components: new Set(['apothecary', 'arcane_shop']),
        alchemist_shady: new Set(['apothecary', 'poison_contraband']),
        arcane_shop: new Set(['arcane_shop', 'bookshop_scrolls']),
        arcane_high: new Set(['arcane_shop', 'bookshop_scrolls']),
        temple_reliquary: new Set(['apothecary', 'shields', 'armorer']),
        temple_selune: new Set(['apothecary', 'arcane_shop', 'cartographer', 'jeweler']),
        temple_tempus: new Set(['weaponsmith', 'armorer', 'shields']),
        temple_lathander: new Set(['apothecary', 'shields', 'armorer', 'jeweler']),
        jeweler: new Set(['jeweler']),
        tailor: new Set(['tailor']),
        grocer_food: new Set(['grocer_food']),
        stables_tack: new Set(['stables_tack']),
        stables: new Set(['stables_tack']),
        carpenter: new Set(['general_outfitter', 'bowyer', 'shields']),
        maritime_outfitter: new Set(['maritime_outfitter', 'general_outfitter']),
        monster_trophies: new Set(['weaponsmith', 'bowyer', 'armorer', 'apothecary']),
        aurora_catalog: new Set(['general_outfitter', 'chandler', 'scribe_stationer', 'glassblower', 'cobbler', 'tailor', 'grocer_food']),
        xoblob: new Set(['xoblob_curio', 'jeweler', 'glassblower']),
        curio_pawn: new Set(['jeweler', 'glassblower', 'instruments', 'locksmith', 'cartographer', 'arcane_shop']),
        black_market: new Set(['poison_contraband', 'locksmith', 'weaponsmith']),
        general_outfitter: new Set(['general_outfitter']),
        outfitter_tools: new Set(['general_outfitter', 'locksmith']),
        pipemaker: new Set(['grocer_food', 'general_outfitter']),
        cooper: new Set(['general_outfitter', 'grocer_food']),
        hardware_pewter: new Set(['general_outfitter', 'chandler'])
      };

      const TIER_RULES = {
        '1': { rarities: new Set(['Mundane', 'Common']), maxGold: 50 },
        '2': { rarities: new Set(['Mundane', 'Common', 'Uncommon']), maxGold: 600 },
        '3': { rarities: new Set(['Mundane', 'Common', 'Uncommon', 'Rare']), maxGold: 6000 },
        '4': { rarities: new Set(['Mundane', 'Common', 'Uncommon', 'Rare', 'Very Rare']), maxGold: 30000 },
        '5': { rarities: new Set(['Mundane', 'Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary']), maxGold: 100000 },
        'BM': { rarities: new Set(['Mundane', 'Common', 'Uncommon', 'Rare', 'Very Rare']), maxGold: 25000 }
      };

      const allowedCrafts = STRICT_SUBCRAFT_MAP[subcraft] || new Set(['general_outfitter']);
      const trule = TIER_RULES[tier] || TIER_RULES['3'];

      const directSignature = [];
      const craftMatched = [];

      for (const item of (data.items || [])) {
        const scope = item.AvailabilityScope || 'Trade_Standard';
        // 1. Unique Artifacts NEVER appear in any shop
        if (scope === 'Unique_Artifact') continue;
        // 2. Planar / Non-Toril Imports are excluded unless DM explicitly enables Planar Imports
        if (scope === 'Planar_Import' && !includePlanarImports) continue;
        // 3. City-specific items only appear in their home city
        if (scope === 'City_Specific' && selectedSettlement && item.CityOrigin && selectedSettlement !== item.CityOrigin) continue;

        const itShop = item['Iconic Storefront'] || '';
        const itCraft = item.ItemCraft || 'general_outfitter';
        const rar = item['Rarity'] || 'Common';
        const g = parseGoldValue(item['Base Cost'] || '1 gp');

        // Direct Canonical Signature Items for this exact storefront
        if (itShop === vName && allowedCrafts.has(itCraft)) {
          if ((tier === '1' || tier === '2') && g > trule.maxGold * 1.5) continue;
          directSignature.push(item);
          continue;
        }

        // Shop_Exclusive items only appear in their exact shop (or paired Gondite / Shady Poison / Bardic shops)
        if (scope === 'Shop_Exclusive') {
          if (subcraft === 'gondite' && itCraft === 'gondite' && g <= trule.maxGold) {
            craftMatched.push(item);
          } else if ((subcraft === 'alchemist_shady' || subcraft === 'black_market') && itCraft === 'poison_contraband' && g <= trule.maxGold) {
            craftMatched.push(item);
          } else if (subcraft === 'instruments' && itCraft === 'instruments' && g <= trule.maxGold) {
            craftMatched.push(item);
          }
          continue;
        }

        // Standard Trade Craft & Socioeconomic Tier Gating
        if (allowedCrafts.has(itCraft) && trule.rarities.has(rar) && g <= trule.maxGold) {
          craftMatched.push(item);
        }
      }

      const seenNames = new Set();
      const allStoreItems = [];
      for (const it of [...directSignature, ...craftMatched]) {
        const nm = it['Item Name'];
        if (nm && !seenNames.has(nm)) {
          seenNames.add(nm);
          allStoreItems.push(it);
        }
      }

      return allStoreItems.map((item, idx) => {
        const hash = (idx * 37 + daySeed * 101) % 100;
        const baseChance = parseInt(item['Base Stock %']) || 75;
        const inStock = hash <= baseChance;
        const baseQty = inStock ? Math.max(1, (hash % 6) + 1) : 0;
        const key = `${vName}::${item['Item Name']}`;
        const alreadyPurchased = (purchasedStock && purchasedStock[key]) || 0;
        const quantity = Math.max(0, baseQty - alreadyPurchased);
        const section = getSectionForItem(item, false);
        return { ...item, inStock: quantity > 0, quantity, section };
      });
    } else {
      const eName = selectedVenue['Eatery Name'];
      const rawMenu = data.food_menu || data.menu || [];

      if (selectedVenue.isStreetCart) {
        const streetEats = rawMenu.filter(m =>
          (m['Subcategory'] || '').includes('Street') ||
          (m['Item Name'] || '').toLowerCase().includes('skewer') ||
          (m['Item Name'] || '').toLowerCase().includes('pie') ||
          (m['Item Name'] || '').toLowerCase().includes('broth') ||
          (m['Item Name'] || '').toLowerCase().includes('cider')
        );
        const wardEats = streetEats.filter(m => m.Ward === selectedWard || m.Ward === 'Any');
        const finalEats = wardEats.length >= 3 ? wardEats : streetEats.slice(0, 6);
        return finalEats.map(item => {
          const key = `${eName}::${item['Item Name']}`;
          const alreadyPurchased = (purchasedStock && purchasedStock[key]) || 0;
          const quantity = Math.max(0, 10 - alreadyPurchased);
          return {
            ...item,
            inStock: quantity > 0,
            quantity,
            section: '🍢 Hot Cobblestone Skewers & Quick Bites'
          };
        });
      }

      return rawMenu
        .filter(m => {
          const matchEatery = m['Eatery / Location'] === eName;
          const matchWard = m.Ward === selectedWard || (m.Ward && selectedWard && m.Ward.toLowerCase().includes(selectedWard.toLowerCase())) || m.Ward === 'Any';
          return matchEatery || matchWard;
        })
        .map(item => {
          const key = `${eName}::${item['Item Name']}`;
          const alreadyPurchased = (purchasedStock && purchasedStock[key]) || 0;
          const quantity = Math.max(0, 99 - alreadyPurchased);
          return {
            ...item,
            inStock: quantity > 0,
            quantity,
            section: getSectionForItem(item, true)
          };
        });
    }
  }, [data, selectedVenue, venueType, daySeed, selectedWard, purchasedStock, includePlanarImports, selectedSettlement]);

  // Unique sections present in this venue
  const availableSections = useMemo(() => {
    const counts = {};
    venueInventory.forEach(item => {
      counts[item.section] = (counts[item.section] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count }));
  }, [venueInventory]);

  // Filtered inventory with Fog of Commerce (hides out-of-stock items from players)
  const filteredInventory = useMemo(() => {
    return venueInventory.filter(item => {
      const name = item['Item Name'] || '';
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());
      const rarity = item['Rarity'] || 'Common';
      const matchesRarity = selectedRarity === 'All' || rarity === selectedRarity;
      const matchesSection = selectedSection === 'All' || item.section === selectedSection;

      // Fog of Commerce: Hide out of stock items from players unless DM mode is on
      const isOutOfStock = item.quantity === 0;
      if (!dmMode && isOutOfStock) {
        return false;
      }

      return matchesSearch && matchesRarity && matchesSection;
    });
  }, [venueInventory, searchTerm, selectedRarity, selectedSection, dmMode]);

  // Group items by section
  const itemsGroupedBySection = useMemo(() => {
    const groups = {};
    filteredInventory.forEach(item => {
      if (!groups[item.section]) groups[item.section] = [];
      groups[item.section].push(item);
    });
    return groups;
  }, [filteredInventory]);

  // Cart totals: computes universal static cart summing baked haggledPrices or tier-adjusted costs
  const rawCartCostGold = useMemo(() => {
    return cart.reduce((acc, c) => {
      let price = 0;
      if (c.item.haggledPrice !== null && c.item.haggledPrice !== undefined) {
        price = parseFloat(c.item.haggledPrice) || 0;
      } else if (c.item.cost === '0 gp' || (c.item.name && c.item.name.includes('[Stolen]')) || (c.item.name && c.item.name.includes('[Loot]'))) {
        price = 0;
      } else {
        price = getAdjustedPrice(c.item['Base Cost'] || c.item.cost, c.item.tier || '3');
      }
      return acc + (price * c.quantity);
    }, 0);
  }, [cart, getAdjustedPrice]);

  const totalCostGold = useMemo(() => {
    if (!haggleResult || !haggleResult.discountMultiplier) return rawCartCostGold;
    return Math.max(0.1, rawCartCostGold * haggleResult.discountMultiplier);
  }, [rawCartCostGold, haggleResult]);

  const totalWeightLbs = useMemo(() => {
    return cart.reduce((acc, c) => {
      const w = parseFloat(c.item.weight) || 0;
      return acc + (w * c.quantity);
    }, 0);
  }, [cart]);


  // Defensive guard against missing or uninitialized data
  if (!data || !data.shops || !data.items) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 shadow-lg shadow-amber-500/5">
          <Store className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-xl font-bold text-amber-300 mb-2">Waterdeep Database Initializing...</h2>
        <p className="text-xs text-slate-400 max-w-md mb-6 leading-relaxed">
          The commerce kiosk data is currently loading or could not be found. Please check that <code className="text-amber-200 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">waterdeep_kiosk_data.json</code> is located in <code className="text-amber-200 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">src/data/</code>.
        </p>
        <button
          onClick={() => {
            localStorage.clear();
            window.location.reload();
          }}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white rounded-lg border border-slate-700 transition"
        >
          Reset Local Navigation Cache & Reload
        </button>
      </div>
    );
  }

  // FULL-SCREEN KAHOOT / JACKBOX PLAYER JOIN LOBBY GATE
  if (isPlayerLocked && !playerHasJoinedLobby) {
    return (
      <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        {/* Ambient radial glow */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-slate-950 to-[#070a12]" />

        <div className="relative z-10 w-full max-w-md bg-[#101522] border-2 border-amber-500/50 rounded-3xl p-7 shadow-2xl shadow-amber-500/10 space-y-6 text-center">
          {/* Crest & Branding */}
          <div className="flex flex-col items-center space-y-2">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-[2px] shadow-xl shadow-amber-500/25">
              <div className="h-full w-full bg-[#090d16] rounded-[14px] flex items-center justify-center">
                <svg className="w-9 h-9 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 21 7 21 17 12 22 3 17 3 7 12 2" />
                  <polygon points="12 6 17.5 15 6.5 15 12 6" />
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="21" y1="7" x2="17.5" y2="15" />
                  <line x1="3" y1="7" x2="6.5" y2="15" />
                  <line x1="12" y1="22" x2="6.5" y2="15" />
                  <line x1="12" y1="22" x2="17.5" y2="15" />
                </svg>
              </div>
            </div>
            <span className="px-3 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[10px] font-black uppercase tracking-widest text-amber-300">
              Project L.O.O.T. • Live Table Session
            </span>
            <h1 className="text-2xl font-display font-black tracking-wide text-white">
              Join Your DM&apos;s World
            </h1>
            <p className="text-xs text-slate-400 max-w-xs">
              Enter your table&apos;s Room Code and your Character Name to shop, barter, and roll live with your party.
            </p>
          </div>

          {/* Join Form */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const cleanCode = (playerJoinCodeInput || sessionCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
              const cleanName = (playerJoinNameInput || '').trim();
              if (!cleanCode || !cleanName) return;
              await joinLiveRoom(cleanCode, cleanName);
              confetti({ particleCount: 55, spread: 60, origin: { y: 0.7 } });
            }}
            className="space-y-4 text-left"
          >
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-sky-400 mb-1.5">
                1. Table Room Code
              </label>
              <input
                type="text"
                maxLength={8}
                required
                value={playerJoinCodeInput}
                onChange={(e) => setPlayerJoinCodeInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="E.G. K8X2P"
                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-sky-400 rounded-xl px-4 py-3 text-center font-mono text-2xl font-black tracking-[0.25em] text-fantasy-gold uppercase focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-amber-400 mb-1.5">
                2. Your Character Name (&amp; Class)
              </label>
              <input
                type="text"
                maxLength={32}
                required
                autoFocus
                value={playerJoinNameInput}
                onChange={(e) => setPlayerJoinNameInput(e.target.value)}
                placeholder="e.g. Vax (Rogue) or Shadowheart"
                className="w-full bg-slate-950 border-2 border-slate-700 focus:border-fantasy-gold rounded-xl px-4 py-3 text-base font-bold text-white placeholder-slate-600 focus:outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={!playerJoinCodeInput.trim() || !playerJoinNameInput.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 transition transform active:scale-[0.99]"
            >
              ⚡ Enter Live Session
            </button>
          </form>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Zero-Spoiler Player View</span>
            <button
              type="button"
              onClick={() => {
                leaveLiveRoom();
                if (typeof window !== 'undefined' && window.location.search) {
                  window.history.replaceState({}, '', window.location.pathname);
                }
              }}
              className="text-slate-400 hover:text-amber-300 underline transition"
            >
              Are you the DM? Open Host Screen
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fantasy-dark text-slate-200 flex flex-col font-sans">
      {/* Top 2-Tier Command Deck Header */}
      <header className="border-b border-fantasy-border bg-[#0a0e17]/95 backdrop-blur-md sticky top-0 z-30 shadow-2xl">
        {/* TIER 1: Gilded Crest Emblem, Unified Mode Bar (Master Catalog strictly DM-Only at the end) & Session Controls */}
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
          {/* Custom SVG Gilded D20 & Compass Rose Crest + Title */}
          <div
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => {
              setAppMode('kiosk');
              resetToCosmos();
            }}
            title="Click to return to Cosmic Atlas Home"
          >
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-[1.5px] shadow-lg shadow-amber-500/20 group-hover:scale-105 transition">
              <div className="h-full w-full bg-[#090d16] rounded-[10px] flex items-center justify-center relative overflow-hidden">
                <svg className="w-6 h-6 text-amber-400 group-hover:text-amber-300 transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 21 7 21 17 12 22 3 17 3 7 12 2" />
                  <polygon points="12 6 17.5 15 6.5 15 12 6" />
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="21" y1="7" x2="17.5" y2="15" />
                  <line x1="3" y1="7" x2="6.5" y2="15" />
                  <line x1="12" y1="22" x2="6.5" y2="15" />
                  <line x1="12" y1="22" x2="17.5" y2="15" />
                </svg>
              </div>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-display font-black tracking-wider text-fantasy-gold uppercase drop-shadow-sm">
                {headerTitle}
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">{headerSubtitle}</p>
            </div>
          </div>

          {/* Center Mode Switcher: Unified Kiosk & Atlas | Dungeon Spoils | (DM-Only at End: Master Catalog) */}
          <div className="flex bg-slate-950/90 border border-fantasy-border p-1 rounded-xl shadow-inner space-x-1 overflow-x-auto">
            <button
              onClick={() => setAppMode('kiosk')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                appMode === 'kiosk'
                  ? 'bg-fantasy-gold text-fantasy-dark shadow font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              title="Navigate the Cosmic Atlas, Settlements, Municipal Wards, Storefronts & Taverns"
            >
              <Store className="w-3.5 h-3.5" />
              <span>World & City Kiosks</span>
            </button>

            <button
              onClick={() => setAppMode('loot')}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                appMode === 'loot'
                  ? 'bg-fantasy-gold text-fantasy-dark shadow font-black'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
              title="Roll Curated Level 1-20 Dungeon Spoils & Hoards"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dungeon Spoils</span>
            </button>

            {dmMode && (
              <button
                onClick={() => setAppMode('catalog')}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  appMode === 'catalog'
                    ? 'bg-fantasy-gold text-fantasy-dark shadow font-black'
                    : 'text-amber-300/90 hover:text-amber-200 hover:bg-amber-950/40 border border-amber-700/40'
                }`}
                title="DM-Only Complete D&D Beyond Item Compendium (Includes Unique Artifacts & Planar Imports)"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Master Catalog ({data?.items?.length || 2146})</span>
              </button>
            )}
          </div>

          {/* Right Essential Session Controls (Room Sync, DM/Player Toggle, Cart) */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setRoomModalOpen(true)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition shadow ${
                roomConnectionStatus === 'hosting' || roomConnectionStatus === 'connected'
                  ? 'border-emerald-500/70 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300'
                  : 'border-sky-700/60 bg-sky-950/50 hover:bg-sky-900/60 text-sky-300'
              }`}
              title="Open Live Session Room Code, QR Share Link & Player Roster"
            >
              <span>{roomConnectionStatus === 'hosting' || roomConnectionStatus === 'connected' ? '🟢' : '📡'}</span>
              <span className="font-mono tracking-wider">{sessionCode}</span>
              {roomConnectionStatus === 'hosting' && (
                <span className="hidden sm:inline text-[10px] bg-emerald-500/20 px-1.5 py-0.2 rounded text-emerald-200 font-black">
                  LIVE ({Math.max(0, partyMembers.filter(p => p !== 'DM').length)})
                </span>
              )}
              {pendingChecks.length > 0 && dmMode && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
                  {pendingChecks.length}
                </span>
              )}
            </button>

            {!isPlayerLocked && (
              <button
                onClick={() => setDmMode(!dmMode)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition ${
                  dmMode
                    ? 'bg-amber-950/90 border-amber-500 text-amber-300 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white hover:border-slate-600'
                }`}
                title={dmMode ? "DM View Active: Revealing DCs, proprietor psychology, hidden tiles & Master Catalog" : "Player View Preview: Zero-spoiler anti-metagame mode"}
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span>{dmMode ? 'DM View' : 'Player View'}</span>
              </button>
            )}

            <button
              onClick={() => setCartOpen(true)}
              className="relative flex items-center space-x-2 bg-fantasy-gold hover:bg-fantasy-goldHover text-fantasy-dark px-3.5 py-1.5 rounded-lg font-black text-xs sm:text-sm shadow-md transition"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
            </button>
          </div>
        </div>

        {/* TIER 2: Consistent Nested Breadcrumbs + 1-Click City Quick-Jump + Always-Visible Day Stock Tracker + Active Shopper */}
        <div className="bg-slate-950/90 border-t border-slate-800/80 px-4 py-2 text-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
            {/* Left: Nested Hierarchy Breadcrumbs + Quick-Jump Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
              <button
                onClick={() => {
                  setAppMode('kiosk');
                  resetToCosmos();
                }}
                className={`flex items-center space-x-1 px-2 py-0.5 rounded-md border transition ${
                  appMode === 'kiosk' && !selectedPlanet
                    ? 'bg-amber-950/60 border-amber-500/60 text-fantasy-gold font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title="View Level 1: Planetary Spheres of the Multiverse"
              >
                <Globe2 className="w-3.5 h-3.5 text-fantasy-gold" />
                <span>Cosmic Atlas</span>
              </button>

              {/* Quick-Jump Settlement Pills when on higher Atlas levels so you never go in circles */}
              {!selectedSettlement && (
                <div className="flex items-center space-x-1 pl-1 border-l border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase font-bold px-1">Jump to City:</span>
                  {Object.values(cityPacks || {}).map(pack => (
                    <button
                      key={pack.id || pack.name}
                      onClick={() => {
                        setAppMode('kiosk');
                        setPlanet(pack.planet || 'Toril');
                        setContinent(pack.continent || 'Faerûn');
                        setRegion(pack.region || 'Sword Coast');
                        setSettlement(pack.name);
                      }}
                      className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-700/40 font-bold text-[11px] transition whitespace-nowrap"
                    >
                      🏰 {pack.name}
                    </button>
                  ))}
                </div>
              )}

              {selectedPlanet && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  <button onClick={() => { setAppMode('kiosk'); setContinent(null); }} className={`hover:text-white transition ${!selectedContinent ? 'text-fantasy-gold font-bold' : 'text-slate-400'}`}>{selectedPlanet}</button>
                </>
              )}
              {selectedContinent && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  <button onClick={() => { setAppMode('kiosk'); setRegion(null); }} className={`hover:text-white transition ${!selectedRegion ? 'text-fantasy-gold font-bold' : 'text-slate-400'}`}>{selectedContinent}</button>
                </>
              )}
              {selectedRegion && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  <button onClick={() => { setAppMode('kiosk'); setSettlement(null); }} className={`hover:text-white transition ${!selectedSettlement ? 'text-fantasy-gold font-bold' : 'text-slate-400'}`}>{selectedRegion}</button>
                </>
              )}
              {selectedSettlement && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  <button onClick={() => { setAppMode('kiosk'); selectWard(null); }} className={`hover:text-white transition ${!selectedWard ? 'text-fantasy-gold font-bold' : 'text-slate-400'}`}>{selectedSettlement}</button>
                </>
              )}
              {selectedWard && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  <button onClick={() => { setAppMode('kiosk'); selectVenue(null); }} className={`hover:text-white transition ${!selectedVenue ? 'text-fantasy-gold font-bold' : 'text-slate-400'}`}>{activeWards.find(w => w.id === selectedWard)?.name}</button>
                </>
              )}
              {selectedVenue && (
                <>
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  <span className="text-fantasy-gold font-bold truncate max-w-[200px]">{venueName}</span>
                </>
              )}

              {activeMeal && (
                <div className="flex items-center space-x-1.5 bg-emerald-950/70 border border-emerald-600/50 px-2.5 py-0.5 rounded-full text-[11px] text-emerald-300 ml-2">
                  <UtensilsCrossed className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span className="font-bold">{activeMeal.name}:</span>
                  <span className="truncate max-w-[140px]">{activeMeal.perk}</span>
                  <button onClick={clearActiveMeal} className="hover:text-white ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Right: Always-Visible Day Stock Tracker + Active Shopper (Starts on DM) + DM Tools */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Restored Always-Visible Day Stock Tracker & Reroll Button (Reroll hidden for locked remote players) */}
              <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg overflow-hidden">
                <span className="px-2.5 py-1 text-[11px] font-mono font-bold text-amber-300 bg-slate-950 border-r border-slate-800">
                  📅 Day {daySeed} Stock
                </span>
                {!isPlayerLocked && (
                  <button
                    onClick={() => {
                      rerollStock();
                      addActivityLog({ player: activePlayer || 'DM', action: 'Day Restock', details: `Advanced to Day ${daySeed + 1} (Fresh merchant inventory)` });
                    }}
                    className="flex items-center space-x-1 px-2.5 py-1 hover:bg-slate-800 text-[11px] font-bold text-slate-200 hover:text-fantasy-gold transition"
                    title="Advance campaign day & reroll fresh shop stock across the city"
                  >
                    <Dices className="w-3.5 h-3.5 text-fantasy-gold" />
                    <span>Reroll Day</span>
                  </button>
                )}
              </div>

              {/* Active Shopper Selector (Locked to character name when in Player Mode; dropdown for DM) */}
              {isPlayerLocked ? (
                <div className="flex items-center space-x-2 bg-emerald-950/50 border border-emerald-600/60 px-3 py-1 rounded-lg">
                  <span className="text-[10px] uppercase tracking-wider font-black text-emerald-400">Playing As:</span>
                  <span className="text-xs font-black text-white">{activePlayer}</span>
                  <button
                    onClick={() => openPlayerJoinLobby(sessionCode)}
                    className="text-[10px] text-slate-400 hover:text-white underline ml-1"
                    title="Change character name or room code"
                  >
                    Edit
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700/80 px-2.5 py-1 rounded-lg" title="Active Shopper (Defaults to DM until players join via Room Code)">
                  <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold">Shopper:</span>
                  <select
                    value={activePlayer}
                    onChange={(e) => {
                      setActivePlayer(e.target.value);
                      addActivityLog({ player: e.target.value, action: 'Selected Shopper', details: 'Switched active shopper' });
                    }}
                    className="bg-transparent text-amber-300 font-bold text-xs focus:outline-none cursor-pointer"
                  >
                    {partyMembers.map(p => (
                      <option key={p} value={p} className="bg-slate-900 text-white font-medium">{p}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => setRoomModalOpen(true)}
                    className="text-[10px] px-1.5 py-0.2 rounded bg-sky-950 hover:bg-sky-900 text-sky-300 font-bold border border-sky-700/60 transition"
                    title="Host a live room or invite players"
                  >
                    📡 Host / Invite
                  </button>
                </div>
              )}

              {/* DM Command Group */}
              {dmMode && (
                <div className="flex items-center space-x-1.5 pl-1 border-l border-slate-800">
                  <button
                    onClick={() => setCityPackModalOpen(true)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-emerald-700/60 bg-emerald-950/60 hover:bg-emerald-900/60 text-[11px] font-bold text-emerald-300 transition"
                    title="Switch active City Data Pack or upload a new City Pack JSON"
                  >
                    <Layers className="w-3 h-3" />
                    <span>City Packs</span>
                  </button>

                  <button
                    onClick={() => setActivityLogOpen(true)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition ${
                      pendingChecks.length > 0
                        ? 'bg-rose-950/90 border-rose-500 text-rose-200 animate-pulse'
                        : 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300'
                    }`}
                    title="View live DM audit log & pending player roll approvals"
                  >
                    <BookOpen className="w-3 h-3 text-fantasy-gold" />
                    <span>{pendingChecks.length > 0 ? `Pending (${pendingChecks.length})` : `Log (${activityLog.length})`}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Router */}
      <main className="max-w-7xl mx-auto px-4 py-6 flex-1 w-full">

        {/* DUNGEON SPOILS & LOOT GENERATOR VIEW */}
        {appMode === 'loot' && (() => {
          const activeScenario = LOOT_SCENARIOS.find(s => s.id === lootSource) || LOOT_SCENARIOS[0];
          const filteredScenarios = lootScenarioGroup === 'All'
            ? LOOT_SCENARIOS
            : LOOT_SCENARIOS.filter(s => s.group === lootScenarioGroup);

          // Compute 5e Adventuring Tier & Expected Value Cap from exact Party Level (1-20)
          const computedTier = lootPartyLevel <= 4 ? 1 : lootPartyLevel <= 10 ? 2 : lootPartyLevel <= 16 ? 3 : 4;
          const tierName = computedTier === 1 ? 'Tier 1 • Local Heroes (Lv 1-4)'
                         : computedTier === 2 ? 'Tier 2 • Heroes of the Realm (Lv 5-10)'
                         : computedTier === 3 ? 'Tier 3 • Masters of the Realm (Lv 11-16)'
                         : 'Tier 4 • Masters of the Multiverse (Lv 17-20)';

          // Helper to parse item Base Cost to GP
          const parseItemGold = (costStr) => {
            if (!costStr) return 0;
            const clean = String(costStr).replace(/,/g, '').trim().toLowerCase();
            const parts = clean.split(/\s+/);
            const val = parseFloat(parts[0]) || 0;
            const unit = parts[1] || 'gp';
            if (unit === 'cp') return val / 100;
            if (unit === 'sp') return val / 10;
            if (unit === 'ep') return val / 2;
            if (unit === 'pp') return val * 10;
            return val;
          };

          // Level-gated price bounds and allowed rarities
          const getLevelLootProfile = (lv, bias = 0, rollMod = 0) => {
            const effLv = Math.max(1, Math.min(22, lv + (bias * 2) + rollMod));
            if (effLv <= 2) {
              return { rarities: ['Mundane', 'Common'], minGold: 0.05, maxGold: 120, gemCap: 25 };
            }
            if (effLv <= 4) {
              return { rarities: ['Mundane', 'Common', 'Uncommon'], minGold: 0.5, maxGold: 450, gemCap: 50 };
            }
            if (effLv <= 7) {
              return { rarities: ['Common', 'Uncommon', 'Rare'], minGold: 5, maxGold: 1500, gemCap: 150 };
            }
            if (effLv <= 10) {
              return { rarities: ['Uncommon', 'Rare'], minGold: 15, maxGold: 5000, gemCap: 500 };
            }
            if (effLv <= 13) {
              return { rarities: ['Uncommon', 'Rare', 'Very Rare'], minGold: 50, maxGold: 15000, gemCap: 1000 };
            }
            if (effLv <= 16) {
              return { rarities: ['Rare', 'Very Rare', 'Legendary'], minGold: 100, maxGold: 35000, gemCap: 2500 };
            }
            return { rarities: ['Rare', 'Very Rare', 'Legendary'], minGold: 250, maxGold: 250000, gemCap: 10000 };
          };

          // Hard exclusions: never drop live mounts, ships, carriages, or street brooms in loot chests
          const FORBIDDEN_LOOT_SUBS = new Set(['Mount', 'Vehicle']);
          const FORBIDDEN_LOOT_NAMES = new Set([
            'Carriage', 'Chariot', 'Longship', 'Mastiff', 'Sailing Ship', 'Sled',
            'Keelboat', 'Canoe', 'Camel', 'Cart', 'Galley', 'Rowboat', 'Sled Dog',
            'Donkey or Mule', 'Horse (Riding)', 'Pony', 'Warhorse', 'Wagon',
            'Elephant', 'Horse (Draft)', 'Warship',
            "Dungsweepers' Guild Long Ash-Broom & Scraper",
            'Canvas Expedition Pavilion'
          ]);

          const isBaseLootable = (it, maxW) => {
            if (!it || !it['Item Name']) return false;
            if (it.AvailabilityScope === 'Unique_Artifact' || it.AvailabilityScope === 'Planar_Import') return false;
            if (FORBIDDEN_LOOT_SUBS.has(it['Subcategory']) || FORBIDDEN_LOOT_NAMES.has(it['Item Name'])) return false;
            const w = parseFloat(it['Weight (lbs)']) || 0.5;
            if (w > maxW) return false;
            // Small containers (<= 10 lbs) never contain Heavy/Medium Armor, Shields, or Polearms
            if (maxW <= 10) {
              const sub = (it['Subcategory'] || '').toLowerCase();
              if (sub.includes('heavy armor') || sub.includes('medium armor') || sub.includes('polearm') || sub === 'shield') {
                return false;
              }
            }
            return true;
          };

          const isValuableItem = (it) => {
            const cat = it['Category'] || '';
            const sub = it['Subcategory'] || '';
            const arch = it['Vendor Archetype'] || '';
            return (
              cat === 'Art' ||
              sub === 'Gemstone' ||
              sub === 'Trade Good & Bullion' ||
              sub.includes('Art Object') ||
              sub.includes('Jewelry') ||
              sub.includes('Royal Regalia') ||
              arch === 'Jeweler & Gemcutter'
            );
          };

          const isConsumableItem = (it) => {
            const cat = it['Category'] || '';
            const sub = (it['Subcategory'] || '').toLowerCase();
            return (
              cat === 'Consumable' ||
              sub.includes('potion') ||
              sub.includes('scroll') ||
              sub.includes('alchemy') ||
              sub.includes('alchemical') ||
              sub.includes('poison') ||
              sub.includes('ammunition') ||
              sub.includes('oil') ||
              sub.includes('pyrotechnic') ||
              sub.includes('explosive') ||
              sub.includes('medical') ||
              sub.includes('ration')
            );
          };

          const matchesScenarioTheme = (it, theme, slotRole) => {
            const cat = (it['Category'] || '').toLowerCase();
            const sub = (it['Subcategory'] || '').toLowerCase();
            const tags = (it['Theme Tags'] || '').toLowerCase();
            const name = (it['Item Name'] || '').toLowerCase();
            const arch = (it['Vendor Archetype'] || '').toLowerCase();
            const origin = (it['Origin Realm'] || '').toLowerCase();

            if (slotRole === 'consumable') {
              if (theme === 'alchemy') return sub.includes('potion') || sub.includes('alchem') || sub.includes('poison') || sub.includes('oil') || arch.includes('apothecary');
              if (theme === 'arcane' || theme === 'arcane_boss') return sub.includes('scroll') || sub.includes('potion') || tags.includes('arcana');
              if (theme === 'cult' || theme === 'stealth' || theme === 'underdark') return sub.includes('poison') || sub.includes('potion') || sub.includes('scroll') || sub.includes('pyrotechnic');
              if (theme === 'armory' || theme === 'martial') return sub.includes('ammunition') || sub.includes('potion') || sub.includes('oil');
              if (theme === 'temple') return sub.includes('potion') || sub.includes('medical') || sub.includes('scroll') || tags.includes('holy');
              if (theme === 'carcass') return sub.includes('potion') || sub.includes('oil');
              return true;
            }

            // Equipment / Permanent Magic Item matching by Scenario Theme
            switch (theme) {
              case 'pockets':
                return sub.includes('dagger') || sub.includes('adventuring gear') || sub.includes('tool') || sub.includes('ring') || sub.includes('clothing') || sub.includes(' pouch') || cat.includes('curio') || cat.includes('tactical');
              case 'martial':
              case 'armory':
                return cat === 'weapon' || cat === 'armor' || sub.includes('sword') || sub.includes('axe') || sub.includes('hammer') || sub.includes('polearm') || sub.includes('bow') || sub.includes('crossbow') || sub.includes('shield') || sub.includes('armor');
              case 'cult':
                return sub.includes('dagger') || sub.includes('sickle') || sub.includes('flail') || sub.includes('mace') || sub.includes('staff') || sub.includes('ring') || sub.includes('wand') || cat.includes('curio') || arch.includes('temple') || tags.includes('cult') || tags.includes('relic');
              case 'stealth':
                return sub.includes('dagger') || sub.includes('crossbow') || sub.includes('thrown') || sub.includes('tool') || sub.includes('clothing') || sub.includes('ring') || cat.includes('tactical') || cat.includes('security') || arch.includes('fence') || arch.includes('locksmith') || tags.includes('stealth');
              case 'arcane':
              case 'arcane_boss':
                return sub.includes('wand') || sub.includes('rod') || sub.includes('staff') || sub.includes('focus') || sub.includes('ring') || sub.includes('scroll') || sub.includes('wondrous') || cat.includes('arcana') || cat.includes('stationery') || arch.includes('arcane');
              case 'carcass':
                return !cat.includes('stationery') && !sub.includes('scroll') && !sub.includes('clothing') && (cat === 'weapon' || cat === 'armor' || sub.includes('ring') || sub.includes('dagger') || sub.includes('sword') || sub.includes('shield') || sub.includes('wondrous'));
              case 'safe':
                return sub.includes('ring') || sub.includes('wand') || sub.includes('rod') || sub.includes('dagger') || sub.includes('wondrous') || cat.includes('curio') || cat.includes('luxury') || cat.includes('security');
              case 'delver':
                return sub.includes('adventuring gear') || sub.includes('lighting') || sub.includes('tool') || sub.includes('container') || sub.includes('sword') || sub.includes('dagger') || sub.includes('shield') || sub.includes('wondrous') || tags.includes('undermountain') || tags.includes('delver');
              case 'alchemy':
                return arch.includes('apothecary') || arch.includes('glass') || sub.includes('alchem') || sub.includes('tool') || sub.includes('wondrous') || cat.includes('consumable');
              case 'noble':
                return sub.includes('clothing') || sub.includes('ring') || sub.includes('sword') || sub.includes('dagger') || sub.includes('instrument') || cat.includes('apparel') || cat.includes('luxury') || arch.includes('tailor') || arch.includes('jeweler') || sub.includes('wondrous');
              case 'smuggler':
                return it['Contraband'] === true || sub.includes('firearm') || sub.includes('crossbow') || sub.includes('dagger') || sub.includes('container') || arch.includes('fence') || tags.includes('smuggler') || tags.includes('contraband') || sub.includes('wondrous');
              case 'temple':
                return arch.includes('temple') || sub.includes('mace') || sub.includes('hammer') || sub.includes('staff') || sub.includes('shield') || sub.includes('ring') || sub.includes('wondrous') || tags.includes('holy');
              case 'junkyard':
                return sub.includes('dagger') || sub.includes('spear') || sub.includes('club') || sub.includes('sling') || sub.includes('tool') || sub.includes('adventuring gear') || cat.includes('tactical') || cat.includes('curio') || sub.includes('wondrous');
              case 'bandit':
                return cat === 'weapon' || cat === 'armor' || sub.includes('sword') || sub.includes('axe') || sub.includes('bow') || sub.includes('crossbow') || sub.includes('dagger') || sub.includes('light armor') || sub.includes('medium armor') || sub.includes('wondrous');
              case 'crypt':
                return sub.includes('sword') || sub.includes('axe') || sub.includes('mace') || sub.includes('shield') || sub.includes('armor') || sub.includes('ring') || sub.includes('staff') || sub.includes('wondrous') || cat.includes('curio') || tags.includes('crypt');
              case 'maritime':
                return cat.includes('maritime') || cat.includes('navigation') || sub.includes('trident') || sub.includes('scimitar') || sub.includes('sword') || sub.includes('firearm') || tags.includes('sea') || tags.includes('nautical') || tags.includes('saltmarsh') || sub.includes('wondrous');
              case 'underdark':
                return origin.includes('underdark') || origin.includes('skullport') || tags.includes('underdark') || tags.includes('drow') || name.includes('mithral') || name.includes('adamantine') || sub.includes('crossbow') || sub.includes('dagger') || sub.includes('sword') || sub.includes('wondrous');
              case 'giant':
                return origin.includes('north') || origin.includes('ostoria') || tags.includes('giant') || sub.includes('hammer') || sub.includes('axe') || sub.includes('polearm') || sub.includes('sword') || sub.includes('armor') || sub.includes('tool') || sub.includes('wondrous');
              case 'boss':
              case 'dragon':
              default:
                return cat === 'magic item' || cat === 'weapon' || cat === 'armor' || sub.includes('wondrous') || sub.includes('ring') || sub.includes('staff') || sub.includes('wand') || sub.includes('sword') || sub.includes('shield');
            }
          };

          // Generate realistic coin breakdown by exact level (1-20), party size (1-8), and scenario profile
          const generateRealisticCoins = (lv, pSize, scenario, rollMod) => {
            const basePerPlayerByLevel = [
              0,
              12, 25, 45, 80,           // Lv 1-4
              160, 250, 380, 550, 800, 1100, // Lv 5-10
              1600, 2300, 3200, 4500, 6500, 9000, // Lv 11-16
              13000, 18000, 25000, 35000 // Lv 17-20
            ];
            const basePerPlayer = basePerPlayerByLevel[lv] || 50;
            const variance = 0.8 + (Math.random() * 0.4) + (rollMod * 0.15);
            const rawTargetGold = Math.max(0.5, basePerPlayer * pSize * scenario.coinScale * variance);

            let cp = 0, sp = 0, gp = 0, pp = 0;
            const prof = scenario.coinProfile;

            if (prof === 'minimal') {
              cp = Math.floor((Math.random() * 40 + 10) * pSize);
              sp = Math.floor((Math.random() * 20 + 5) * pSize);
              gp = Math.max(0, Math.round(rawTargetGold * 0.5));
            } else if (prof === 'pocket' || prof === 'junkyard') {
              const cpShare = rawTargetGold * (lv <= 4 ? 0.15 : 0.05);
              const spShare = rawTargetGold * (lv <= 4 ? 0.35 : 0.20);
              const gpShare = rawTargetGold - cpShare - spShare;
              cp = Math.round(cpShare * 100);
              sp = Math.round(spShare * 10);
              gp = Math.max(1, Math.round(gpShare));
              pp = lv >= 9 ? Math.floor(gp / 25) : 0;
            } else if (prof === 'noble') {
              const ppShare = lv >= 4 ? rawTargetGold * 0.45 : 0;
              const gpShare = rawTargetGold - ppShare;
              pp = Math.floor(ppShare / 10);
              gp = Math.max(2, Math.round(gpShare + (ppShare - pp * 10)));
              sp = Math.floor((Math.random() * 15 + 5) * pSize);
              cp = 0;
            } else if (prof === 'ancient') {
              const ppShare = lv >= 6 ? rawTargetGold * 0.25 : 0;
              const spShare = rawTargetGold * 0.15;
              const gpShare = rawTargetGold - ppShare - spShare;
              pp = Math.floor(ppShare / 10);
              gp = Math.max(2, Math.round(gpShare));
              sp = Math.round(spShare * 10);
              cp = Math.floor((Math.random() * 50 + 10) * pSize);
            } else if (prof === 'hoard') {
              const ppShare = lv >= 5 ? rawTargetGold * 0.35 : rawTargetGold * 0.10;
              const gpShare = rawTargetGold * 0.55;
              const spShare = rawTargetGold * 0.08;
              const cpShare = rawTargetGold * 0.02;
              pp = Math.floor(ppShare / 10);
              gp = Math.max(10, Math.round(gpShare));
              sp = Math.round(spShare * 10);
              cp = Math.round(cpShare * 100);
            } else {
              // commercial
              const ppShare = lv >= 5 ? rawTargetGold * 0.25 : 0;
              const spShare = rawTargetGold * 0.12;
              const gpShare = rawTargetGold - ppShare - spShare;
              pp = Math.floor(ppShare / 10);
              gp = Math.max(2, Math.round(gpShare));
              sp = Math.round(spShare * 10);
              cp = Math.floor((Math.random() * 30 + 10) * pSize);
            }

            const totalGoldCoins = gp + (pp * 10) + (sp / 10) + (cp / 100);
            return { cp, sp, gp, pp, totalGoldCoins };
          };

          // Pick a single curated item for a specific slot role ('valuable', 'consumable', 'equipment')
          const pickCuratedItem = (slotRole, scenario, lv, rollMod, excludedNames = new Set()) => {
            const allItems = data.items || [];
            const profile = getLevelLootProfile(lv, scenario.rarityBias, rollMod);

            let candidates = [];
            if (slotRole === 'valuable') {
              candidates = allItems.filter(it => {
                if (!isBaseLootable(it, scenario.maxWeight) || excludedNames.has(it['Item Name'])) return false;
                if (!isValuableItem(it)) return false;
                const g = parseItemGold(it['Base Cost']);
                return g >= (lv >= 11 ? 50 : lv >= 5 ? 10 : 5) && g <= profile.gemCap;
              });
              if (candidates.length === 0) {
                candidates = allItems.filter(it => isValuableItem(it) && !excludedNames.has(it['Item Name']));
              }
            } else if (slotRole === 'consumable') {
              candidates = allItems.filter(it => {
                if (!isBaseLootable(it, scenario.maxWeight) || excludedNames.has(it['Item Name'])) return false;
                if (!isConsumableItem(it) || isValuableItem(it)) return false;
                if (!matchesScenarioTheme(it, scenario.theme, 'consumable')) return false;
                const g = parseItemGold(it['Base Cost']);
                return profile.rarities.includes(it['Rarity']) && g <= profile.maxGold;
              });
              if (candidates.length === 0) {
                candidates = allItems.filter(it => isConsumableItem(it) && isBaseLootable(it, scenario.maxWeight) && profile.rarities.includes(it['Rarity']));
              }
            } else {
              // equipment / permanent magic item
              candidates = allItems.filter(it => {
                if (!isBaseLootable(it, scenario.maxWeight) || excludedNames.has(it['Item Name'])) return false;
                if (isValuableItem(it) || isConsumableItem(it)) return false;
                if (!matchesScenarioTheme(it, scenario.theme, 'equipment')) return false;
                const g = parseItemGold(it['Base Cost']);
                return profile.rarities.includes(it['Rarity']) && g >= profile.minGold && g <= profile.maxGold;
              });
              // Fallback 1: relax minGold
              if (candidates.length === 0) {
                candidates = allItems.filter(it => {
                  if (!isBaseLootable(it, scenario.maxWeight) || excludedNames.has(it['Item Name'])) return false;
                  if (isValuableItem(it) || isConsumableItem(it)) return false;
                  if (!matchesScenarioTheme(it, scenario.theme, 'equipment')) return false;
                  const g = parseItemGold(it['Base Cost']);
                  return profile.rarities.includes(it['Rarity']) && g <= profile.maxGold;
                });
              }
              // Fallback 2: any non-valuable, non-consumable matching container weight and level rarity
              if (candidates.length === 0) {
                candidates = allItems.filter(it => {
                  if (!isBaseLootable(it, scenario.maxWeight) || excludedNames.has(it['Item Name'])) return false;
                  if (isValuableItem(it) || isConsumableItem(it)) return false;
                  const g = parseItemGold(it['Base Cost']);
                  return profile.rarities.includes(it['Rarity']) && g <= profile.maxGold;
                });
              }
            }

            if (candidates.length === 0) return null;
            // Weight towards higher rarities within the allowed pool when at higher levels or boss chests
            const picked = candidates[Math.floor(Math.random() * candidates.length)];
            return { ...picked, lootRole: slotRole };
          };

          // Execute full curated hoard roll
          const runCuratedLootRoll = () => {
            const d100 = lootPhysicalD100 ? Math.max(1, Math.min(100, parseInt(lootPhysicalD100, 10))) : Math.floor(Math.random() * 100) + 1;
            const rollMod = d100 >= 90 ? 2 : d100 >= 75 ? 1 : d100 <= 15 ? -1 : 0;

            const coins = generateRealisticCoins(lootPartyLevel, lootPartySize, activeScenario, rollMod);
            const partyScale = Math.max(0.6, lootPartySize / 4);

            const usedNames = new Set();
            const valuablesList = [];
            const itemsList = [];

            // 1. Roll Valuables (Gems, Art Objects, Jewelry, Bullion)
            if (Math.random() <= activeScenario.valuablesChance || d100 >= 80) {
              const [vMin, vMax] = activeScenario.valuablesRange;
              const rawValCount = Math.floor(Math.random() * (vMax - vMin + 1)) + vMin;
              const valCount = Math.max(vMin, Math.round(rawValCount * Math.sqrt(partyScale)));
              for (let i = 0; i < valCount; i++) {
                const vItem = pickCuratedItem('valuable', activeScenario, lootPartyLevel, rollMod, usedNames);
                if (vItem) {
                  usedNames.add(vItem['Item Name']);
                  valuablesList.push(vItem);
                }
              }
            }

            // 2. Roll Consumables & Supplies
            const [cMin, cMax] = activeScenario.consumablesRange;
            const rawConsCount = Math.floor(Math.random() * (cMax - cMin + 1)) + cMin;
            const consCount = Math.max(cMin, Math.round(rawConsCount * Math.sqrt(partyScale)));
            for (let i = 0; i < consCount; i++) {
              const cItem = pickCuratedItem('consumable', activeScenario, lootPartyLevel, rollMod, usedNames);
              if (cItem) {
                usedNames.add(cItem['Item Name']);
                itemsList.push(cItem);
              }
            }

            // 3. Roll Permanent Equipment & Magic Items
            const [eMin, eMax] = activeScenario.equipmentRange;
            const rawEqCount = Math.floor(Math.random() * (eMax - eMin + 1)) + eMin + (d100 >= 95 ? 1 : 0);
            const eqCount = Math.max(eMin, Math.round(rawEqCount * (lootPartySize >= 6 ? 1.25 : 1.0)));
            for (let i = 0; i < eqCount; i++) {
              const eItem = pickCuratedItem('equipment', activeScenario, lootPartyLevel, rollMod, usedNames);
              if (eItem) {
                usedNames.add(eItem['Item Name']);
                itemsList.push(eItem);
              }
            }

            const allCombined = [...valuablesList, ...itemsList];
            const itemsGoldValue = allCombined.reduce((sum, it) => sum + parseItemGold(it['Base Cost']), 0);
            const grandTotalGold = coins.totalGoldCoins + itemsGoldValue;

            setGeneratedLoot({
              coins,
              valuables: valuablesList,
              items: itemsList,
              allCombined,
              itemsGoldValue,
              grandTotalGold,
              partyLevel: lootPartyLevel,
              partySize: lootPartySize,
              tier: computedTier,
              tierName,
              scenarioId: activeScenario.id,
              scenarioLabel: activeScenario.label,
              scenarioDesc: activeScenario.desc,
              d100,
              rolledAt: new Date().toLocaleTimeString()
            });

            addActivityLog({
              player: 'DM',
              action: 'Rolled Curated Spoils',
              details: `Lv ${lootPartyLevel} (${lootPartySize} players) • ${activeScenario.label} (d100: ${d100})`
            });
            confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
          };

          // Reroll a single item slot in place
          const rerollSingleLootItem = (listType, index) => {
            if (!generatedLoot) return;
            const currentList = listType === 'valuable' ? [...(generatedLoot.valuables || [])] : [...(generatedLoot.items || [])];
            const oldItem = currentList[index];
            const slotRole = oldItem?.lootRole || (listType === 'valuable' ? 'valuable' : 'equipment');

            const existingSet = new Set([
              ...(generatedLoot.valuables || []).map(x => x['Item Name']),
              ...(generatedLoot.items || []).map(x => x['Item Name'])
            ]);

            const replacement = pickCuratedItem(slotRole, activeScenario, generatedLoot.partyLevel || lootPartyLevel, 0, existingSet);
            if (!replacement) return;

            currentList[index] = replacement;
            const newValuables = listType === 'valuable' ? currentList : (generatedLoot.valuables || []);
            const newItems = listType === 'valuable' ? (generatedLoot.items || []) : currentList;
            const newCombined = [...newValuables, ...newItems];
            const newItemsGold = newCombined.reduce((sum, it) => sum + parseItemGold(it['Base Cost']), 0);

            setGeneratedLoot({
              ...generatedLoot,
              valuables: newValuables,
              items: newItems,
              allCombined: newCombined,
              itemsGoldValue: newItemsGold,
              grandTotalGold: generatedLoot.coins.totalGoldCoins + newItemsGold
            });
          };

          const currentProfile = getLevelLootProfile(lootPartyLevel, activeScenario.rarityBias, 0);

          return (
            <div className="bg-fantasy-card border-2 border-fantasy-border rounded-2xl p-6 shadow-2xl space-y-6">
              {/* Top Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-fantasy-border pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fantasy-gold block">
                    Curated Tabletop Treasure Engine • {data.items?.length || 1832} Master Catalog Items
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-wide flex items-center space-x-2">
                    <Sparkles className="w-6 h-6 text-fantasy-gold" />
                    <span>Dungeon Spoils & Realistic Hoard Generator</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Calibrated to exact party level (1–20), party size (1–8 players), and 24 container-realistic scenarios.
                  </p>
                </div>

                <button
                  onClick={() => setAppMode('kiosk')}
                  className="px-4 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-fantasy-gold text-xs font-bold text-slate-300 hover:text-white transition flex items-center space-x-1.5 self-start md:self-auto"
                >
                  <Store className="w-4 h-4 text-fantasy-gold" />
                  <span>Return to City Kiosks</span>
                </button>
              </div>

              {/* Control Panel: Row 1 — Exact Party Level (1-20) & Party Size (1-8) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-xs">
                {/* 1. Exact Party Level (1 to 20) */}
                <div className="lg:col-span-7 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      1. Exact Party Level (Levels 1–20)
                    </label>
                    <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-700/60 text-fantasy-gold font-bold text-[10px]">
                      {tierName}
                    </span>
                  </div>

                  <div className="grid grid-cols-10 gap-1">
                    {Array.from({ length: 20 }, (_, idx) => idx + 1).map(lv => (
                      <button
                        key={lv}
                        onClick={() => setLootPartyLevel(lv)}
                        className={`py-1.5 rounded font-black text-xs transition border ${
                          lootPartyLevel === lv
                            ? 'bg-fantasy-gold text-fantasy-dark border-fantasy-gold shadow-md scale-105'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-white'
                        }`}
                        title={`Set Party Level to ${lv}`}
                      >
                        {lv}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                    <span>
                      Eligible Rarities: <strong className="text-slate-200">{currentProfile.rarities.join(', ')}</strong>
                    </span>
                    <span>
                      Item Value Cap: <strong className="text-fantasy-gold">Up to {currentProfile.maxGold.toLocaleString()} GP</strong>
                    </span>
                  </div>
                </div>

                {/* 2. Party Size (1 to 8 Players) */}
                <div className="lg:col-span-5 space-y-2 lg:border-l lg:border-slate-800 lg:pl-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      2. Number of Players in Party (1–8)
                    </label>
                    <span className="text-[10px] font-bold text-emerald-400">
                      {lootPartySize} {lootPartySize === 1 ? 'Adventurer' : 'Adventurers'}
                    </span>
                  </div>

                  <div className="grid grid-cols-8 gap-1.5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                      <button
                        key={num}
                        onClick={() => setLootPartySize(num)}
                        className={`py-2 rounded-lg font-black text-xs transition border ${
                          lootPartySize === num
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-600 hover:text-white'
                        }`}
                        title={`${num} Players in Party`}
                      >
                        {num}P
                      </button>
                    ))}
                  </div>

                  <p className="text-[10px] text-slate-400 pt-1 leading-tight">
                    Scales total coin drops, consumable quantities, and calculates automatic per-player gold splits.
                  </p>
                </div>
              </div>

              {/* Control Panel: Row 2 — Comprehensive 24 Scenarios & Roll Trigger */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-xs">
                {/* Scenario Category Filter + Selector */}
                <div className="lg:col-span-8 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      3. Loot Source & Encounter Scenario (24 Curated Scenarios)
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { id: 'All', label: 'All (24)' },
                        { id: 'Enemies', label: '⚔️ Bodies & Enemies (6)' },
                        { id: 'Containers', label: '🔐 Safes, Rooms & Caches (9)' },
                        { id: 'Lairs', label: '⛺ Camps & Lairs (6)' },
                        { id: 'Hoards', label: '🐉 Boss Vaults & Hoards (3)' }
                      ].map(grp => (
                        <button
                          key={grp.id}
                          onClick={() => {
                            setLootScenarioGroup(grp.id);
                            const matching = grp.id === 'All' ? LOOT_SCENARIOS : LOOT_SCENARIOS.filter(s => s.group === grp.id);
                            if (matching.length > 0 && !matching.some(s => s.id === lootSource)) {
                              setLootSource(matching[0].id);
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold transition border ${
                            lootScenarioGroup === grp.id
                              ? 'bg-fantasy-gold text-fantasy-dark border-fantasy-gold'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          {grp.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <select
                    value={lootSource}
                    onChange={(e) => setLootSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-fantasy-gold"
                  >
                    {filteredScenarios.map(s => (
                      <option key={s.id} value={s.id}>
                        [{s.groupLabel}] {s.label}
                      </option>
                    ))}
                  </select>

                  <div className="bg-slate-950/90 border border-slate-800/90 p-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <p className="text-[11px] text-amber-100/90 italic leading-snug">
                      "{activeScenario.desc}"
                    </p>
                    <div className="flex items-center space-x-2 shrink-0 text-[10px] font-mono text-slate-400">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-sky-300">
                        Max Item Wt: {activeScenario.maxWeight} lbs
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-300">
                        Gems: {Math.round(activeScenario.valuablesChance * 100)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Physical d100 + Roll Button */}
                <div className="lg:col-span-4 flex flex-col justify-between lg:border-l lg:border-slate-800 lg:pl-4 space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      4. Optional Table d100 Roll & Generate
                    </label>
                    <p className="text-[10px] text-slate-400 leading-tight mb-2">
                      Enter a physical d100 roll (90+ boosts rarity & bonus drops) or leave blank for automatic RNG.
                    </p>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      placeholder="Physical d100 (Optional)"
                      value={lootPhysicalD100}
                      onChange={(e) => setLootPhysicalD100(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-center text-xs font-bold text-fantasy-gold focus:outline-none focus:border-fantasy-gold"
                    />
                  </div>

                  <button
                    onClick={runCuratedLootRoll}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <Dices className="w-4 h-4" />
                    <span>Roll Curated Spoils (Lv {lootPartyLevel} • {lootPartySize}P)</span>
                  </button>
                </div>
              </div>

              {/* Generated Loot Chest Display */}
              {generatedLoot && generatedLoot.coins && (
                <div className="bg-slate-900 border-2 border-fantasy-gold/50 rounded-2xl p-6 shadow-2xl space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-amber-950 text-fantasy-gold border border-amber-700/60 text-[10px] font-black uppercase">
                          Party Level {generatedLoot.partyLevel || lootPartyLevel} ({generatedLoot.partySize || lootPartySize} Players)
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800 text-[10px] font-mono">
                          d100 Roll: {generatedLoot.d100 || 'RNG'}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-white">{generatedLoot.scenarioLabel || generatedLoot.source}</h3>
                      {generatedLoot.scenarioDesc && (
                        <p className="text-xs text-slate-400 italic mt-0.5">"{generatedLoot.scenarioDesc}"</p>
                      )}
                    </div>

                    <div className="flex items-center flex-wrap gap-2">
                      <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl text-xs">
                        <button
                          onClick={() => setViewDensity && setViewDensity('comfortable')}
                          className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                            viewDensity !== 'compact' ? 'bg-fantasy-gold text-fantasy-dark shadow' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>🃏</span>
                          <span>Cards</span>
                        </button>
                        <button
                          onClick={() => setViewDensity && setViewDensity('compact')}
                          className={`px-2.5 py-1 rounded-lg font-bold transition flex items-center space-x-1 ${
                            viewDensity === 'compact' ? 'bg-fantasy-gold text-fantasy-dark shadow' : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <span>📋</span>
                          <span>Compact</span>
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          const listToClaim = generatedLoot.allCombined || generatedLoot.items || [];
                          listToClaim.forEach(it => {
                            addToCart({
                              ...it,
                              'Item Name': `[Loot] ${it['Item Name']}`,
                              name: `[Loot] ${it['Item Name']}`,
                              cost: '0 gp',
                              'Base Cost': '0 gp',
                              weight: it['Weight (lbs)'] || '0.5',
                              maxStock: 1,
                              tier: '3'
                            }, 'Dungeon Spoils', 1);
                          });
                          addActivityLog({
                            player: activePlayer,
                            action: 'Claimed Dungeon Hoard',
                            details: `Added ${listToClaim.length} looted items to Party Cart at 0 GP`
                          });
                          alert(`Claimed ${listToClaim.length} items to Party Cart for 0 GP!`);
                          confetti({ particleCount: 60, spread: 50 });
                        }}
                        className="px-3.5 py-2 bg-fantasy-gold hover:bg-fantasy-goldHover text-fantasy-dark font-black text-xs rounded-lg shadow transition flex items-center space-x-1.5"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Claim All Items to Party Cart (0 GP)</span>
                      </button>
                    </div>
                  </div>

                  {/* Coin Hoard & Automatic Party Split Strip */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-center text-xs">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold block">Platinum (PP)</span>
                      <span className="text-sm font-black text-sky-200">{generatedLoot.coins.pp.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold block">Gold (GP)</span>
                      <span className="text-sm font-black text-amber-300">{generatedLoot.coins.gp.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold block">Silver (SP)</span>
                      <span className="text-sm font-black text-slate-300">{generatedLoot.coins.sp.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] text-slate-400 font-semibold block">Copper (CP)</span>
                      <span className="text-sm font-black text-amber-600">{generatedLoot.coins.cp.toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-emerald-900/50">
                      <span className="text-[10px] text-slate-400 font-semibold block">Total Coin Value</span>
                      <span className="text-sm font-black text-emerald-400">{formatGoldCost(generatedLoot.coins.totalGoldCoins)}</span>
                    </div>
                    <div className="bg-emerald-950/30 p-2.5 rounded-xl border border-emerald-700/50">
                      <span className="text-[10px] text-emerald-300 font-bold block">
                        Split ({generatedLoot.partySize || lootPartySize} Players)
                      </span>
                      <span className="text-sm font-black text-white">
                        {formatGoldCost(generatedLoot.coins.totalGoldCoins / (generatedLoot.partySize || lootPartySize))} / ea
                      </span>
                    </div>
                  </div>

                  {/* Section 1: Valuables (Gemstones, Jewelry, Art Objects & Trade Bars) */}
                  {generatedLoot.valuables && generatedLoot.valuables.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                          <Coins className="w-4 h-4 text-fantasy-gold" />
                          <span>Valuables: Gemstones, Art Objects & Bullion ({generatedLoot.valuables.length})</span>
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Est. Value: <strong className="text-fantasy-gold">{formatGoldCost(generatedLoot.valuables.reduce((s, x) => s + parseItemGold(x['Base Cost']), 0))}</strong>
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {generatedLoot.valuables.map((it, idx) => (
                          <div key={idx} className="bg-slate-950 border border-amber-900/40 hover:border-fantasy-gold p-3.5 rounded-xl flex flex-col justify-between transition">
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <h4
                                  onClick={() => setInspectingItem(it)}
                                  className="font-bold text-sm text-amber-200 hover:text-fantasy-gold cursor-pointer transition truncate"
                                  title="Click to inspect full lore"
                                >
                                  {it['Item Name']}
                                </h4>
                                <span className="text-xs font-black text-fantasy-gold shrink-0">{it['Base Cost']}</span>
                              </div>
                              <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mb-2">
                                <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 font-semibold text-amber-300">
                                  {it['Subcategory'] || 'Valuable'}
                                </span>
                                <span>•</span>
                                <span>{it['Weight (lbs)'] || '0.1'} lbs</span>
                              </div>
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3 font-serif italic">
                                "{it['Properties / Flavor']}"
                              </p>
                            </div>

                            <div className="flex items-center space-x-1.5 pt-2 border-t border-slate-800">
                              <button
                                onClick={() => rerollSingleLootItem('valuable', idx)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800 transition text-xs"
                                title="Reroll just this valuable"
                              >
                                <Dices className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setInspectingItem(it)}
                                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-fantasy-gold border border-slate-800 transition text-xs"
                                title="Inspect Valuable"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  addToCart({
                                    ...it,
                                    'Item Name': `[Loot] ${it['Item Name']}`,
                                    name: `[Loot] ${it['Item Name']}`,
                                    cost: '0 gp',
                                    'Base Cost': '0 gp',
                                    weight: it['Weight (lbs)'] || '0.1',
                                    maxStock: 1,
                                    tier: '3'
                                  }, 'Dungeon Spoils', 1);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-fantasy-gold border border-slate-800 font-bold text-xs transition"
                                title="Add to Party Cart at 0 GP"
                              >
                                + Cart
                              </button>
                              <button
                                onClick={() => {
                                  if (!selectedVenue || isFood) {
                                    const defaultPawn = (data.shops || []).find(s => s['Shop Name']?.includes('Gilded Oyster') || s['Primary Vendor Type']?.includes('Pawn')) || (data.shops || [])[0];
                                    if (defaultPawn) {
                                      selectWard(defaultPawn.Ward || 'Dock');
                                      selectVenue(defaultPawn);
                                    }
                                  }
                                  setAppMode('kiosk');
                                  setStoreTab('sell');
                                  setAppraisalItem({
                                    name: it['Item Name'],
                                    category: it['Category'] || 'Treasure & Art',
                                    rarity: it['Rarity'] || 'Common',
                                    cost: it['Base Cost'] || '25 gp',
                                    weight: it['Weight (lbs)'] || '0.2',
                                    isCustom: false
                                  });
                                }}
                                className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-emerald-200 border border-emerald-900/60 font-bold text-xs transition flex items-center justify-center space-x-1"
                              >
                                <Coins className="w-3 h-3 text-emerald-400" />
                                <span>Pawn</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Section 2: Curated Consumables, Adventuring Gear & Magic Items */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                        <Sparkles className="w-4 h-4 text-fantasy-gold" />
                        <span>Curated Consumables, Gear & Magic Items ({generatedLoot.items.length})</span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Total Hoard Net Value (Coins + Items): <strong className="text-emerald-400">{formatGoldCost(generatedLoot.grandTotalGold || generatedLoot.coins.totalGoldCoins)}</strong>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {generatedLoot.items.map((it, idx) => (
                        <div key={idx} className="bg-slate-950 border border-slate-800 hover:border-fantasy-gold p-3.5 rounded-xl flex flex-col justify-between transition">
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 
                                onClick={() => setInspectingItem(it)}
                                className="font-bold text-sm text-white hover:text-fantasy-gold cursor-pointer transition truncate"
                                title="Click to inspect full lore"
                              >
                                {it['Item Name']}
                              </h4>
                              <span className="text-xs font-bold text-fantasy-gold shrink-0">{it['Base Cost']}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 mb-2">
                              <span className={`px-1.5 py-0.5 rounded border font-bold ${
                                it['Rarity'] === 'Legendary' ? 'bg-amber-950 text-amber-300 border-amber-700' :
                                it['Rarity'] === 'Very Rare' ? 'bg-purple-950 text-purple-300 border-purple-700' :
                                it['Rarity'] === 'Rare' ? 'bg-sky-950 text-sky-300 border-sky-700' :
                                it['Rarity'] === 'Uncommon' ? 'bg-emerald-950 text-emerald-300 border-emerald-700' :
                                'bg-slate-900 text-slate-300 border-slate-800'
                              }`}>
                                {it['Rarity']}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                                {it['Subcategory'] || it['Category']}
                              </span>
                              <span>•</span>
                              <span>{it['Weight (lbs)'] || '1'} lbs</span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3 font-serif italic">
                              "{it['Properties / Flavor']}"
                            </p>
                          </div>

                          <div className="flex items-center space-x-1.5 pt-2 border-t border-slate-800">
                            <button
                              onClick={() => rerollSingleLootItem('item', idx)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-amber-300 border border-slate-800 transition text-xs"
                              title="Reroll just this item from the same curated pool"
                            >
                              <Dices className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setInspectingItem(it)}
                              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-fantasy-gold border border-slate-800 transition text-xs"
                              title="Inspect Item"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                addToCart({
                                  ...it,
                                  'Item Name': `[Loot] ${it['Item Name']}`,
                                  name: `[Loot] ${it['Item Name']}`,
                                  cost: '0 gp',
                                  'Base Cost': '0 gp',
                                  weight: it['Weight (lbs)'] || '1',
                                  maxStock: 1,
                                  tier: '3'
                                }, 'Dungeon Spoils', 1);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-fantasy-gold border border-slate-800 font-bold text-xs transition"
                              title="Claim item to Party Cart at 0 GP"
                            >
                              + Cart
                            </button>

                            <button
                              onClick={() => {
                                if (!selectedVenue || isFood) {
                                  const defaultPawn = (data.shops || []).find(s => s['Shop Name']?.includes('Gilded Oyster') || s['Primary Vendor Type']?.includes('Pawn')) || (data.shops || [])[0];
                                  if (defaultPawn) {
                                    selectWard(defaultPawn.Ward || 'Dock');
                                    selectVenue(defaultPawn);
                                  }
                                }
                                setAppMode('kiosk');
                                setStoreTab('sell');
                                setAppraisalItem({
                                  name: it['Item Name'],
                                  category: it['Category'] || 'Gear',
                                  rarity: it['Rarity'] || 'Common',
                                  cost: it['Base Cost'] || '10 gp',
                                  weight: it['Weight (lbs)'] || '1',
                                  isCustom: false
                                });
                              }}
                              className="flex-1 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-emerald-200 border border-emerald-900/60 font-bold text-xs transition flex items-center justify-center space-x-1"
                            >
                              <Coins className="w-3 h-3 text-emerald-400" />
                              <span>Pawn</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* MASTER D&D BEYOND ITEM COMPENDIUM VIEW (2,159+ CANONICAL ITEMS) */}
        {appMode === 'catalog' && (() => {
          const allCatalogItems = data?.items || [];
          const uniqueCategories = ['All', ...Array.from(new Set(allCatalogItems.map(i => i['Category'] || 'Wondrous Item'))).filter(Boolean).sort()];
          const uniqueBooks = ['All', ...Array.from(new Set(allCatalogItems.map(i => i['Sourcebook'] || "Dungeon Master's Guide"))).filter(Boolean).sort()];

          const filteredCatalog = allCatalogItems.filter(it => {
            const q = catalogSearch.trim().toLowerCase();
            if (q) {
              const nm = (it['Item Name'] || '').toLowerCase();
              const desc = (it['Properties / Flavor'] || it['Description & Mechanics'] || '').toLowerCase();
              const cat = (it['Category'] || '').toLowerCase();
              const sub = (it['Subcategory'] || '').toLowerCase();
              const shop = (it['Iconic Storefront'] || '').toLowerCase();
              const book = (it['Sourcebook'] || '').toLowerCase();
              if (!nm.includes(q) && !desc.includes(q) && !cat.includes(q) && !sub.includes(q) && !shop.includes(q) && !book.includes(q)) {
                return false;
              }
            }
            if (catalogRarity !== 'All' && (it['Rarity'] || 'Common') !== catalogRarity) return false;
            if (catalogCategory !== 'All' && (it['Category'] || '') !== catalogCategory) return false;
            if (catalogSourcebook !== 'All' && (it['Sourcebook'] || '') !== catalogSourcebook) return false;
            return true;
          });

          const visibleCatalog = filteredCatalog.slice(0, catalogLimit);

          return (
            <div className="space-y-6">
              {/* Compendium Banner */}
              <div className="bg-fantasy-card border border-fantasy-border rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-fantasy-border pb-4 mb-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-fantasy-gold block">
                      Complete D&D Beyond 5e Equipment & Magic Compendium
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-display font-black text-white mt-0.5">
                      Master Item Database ({allCatalogItems.length.toLocaleString()} Canonical Wares)
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Search across every 5e sourcebook—from mundane adventuring gear and Aurora's Whole Realms Catalogue to Legendary Artifacts, Vestiges, Magical Tattoos, and Tomes.
                    </p>
                  </div>

                  {/* Density Switcher */}
                  <div className="flex items-center space-x-2 self-start lg:self-auto">
                    <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
                      <button
                        onClick={() => setViewDensity && setViewDensity('comfortable')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                          viewDensity !== 'compact' ? 'bg-fantasy-gold text-fantasy-dark shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>🃏</span>
                        <span>Comfortable Cards</span>
                      </button>
                      <button
                        onClick={() => setViewDensity && setViewDensity('compact')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                          viewDensity === 'compact' ? 'bg-fantasy-gold text-fantasy-dark shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>📋</span>
                        <span>Compact Table</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Search & Multi-Facet Filter Bar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mb-4">
                  <div className="md:col-span-6 relative">
                    <input
                      type="text"
                      placeholder="Search any D&D Beyond item by name, effect, spell, sourcebook, or shop (e.g. 'Vorpal', 'Ioun', 'Tattoo', 'Poison', 'Staff')..."
                      value={catalogSearch}
                      onChange={(e) => { setCatalogSearch(e.target.value); setCatalogLimit(60); }}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-fantasy-gold transition"
                    />
                    {catalogSearch && (
                      <button onClick={() => setCatalogSearch('')} className="absolute right-3 top-3 text-slate-400 hover:text-white">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="md:col-span-3">
                    <select
                      value={catalogCategory}
                      onChange={(e) => { setCatalogCategory(e.target.value); setCatalogLimit(60); }}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-fantasy-gold"
                    >
                      {uniqueCategories.map(c => (
                        <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <select
                      value={catalogSourcebook}
                      onChange={(e) => { setCatalogSourcebook(e.target.value); setCatalogLimit(60); }}
                      className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-fantasy-gold"
                    >
                      {uniqueBooks.map(b => (
                        <option key={b} value={b}>{b === 'All' ? 'All 5e Sourcebooks' : b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Rarity Filter Pills */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
                    {['All', 'Mundane', 'Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary'].map(r => (
                      <button
                        key={r}
                        onClick={() => { setCatalogRarity(r); setCatalogLimit(60); }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap border ${
                          catalogRarity === r
                            ? 'bg-fantasy-gold text-fantasy-dark border-fantasy-gold shadow'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-mono text-slate-400">
                    Showing <strong className="text-amber-300">{visibleCatalog.length}</strong> of <strong className="text-white">{filteredCatalog.length.toLocaleString()}</strong> matching items
                  </span>
                </div>
              </div>

              {/* Catalog Results: Compact Ledger Table vs Comfortable Cards */}
              {viewDensity === 'compact' ? (
                <div className="overflow-x-auto rounded-2xl border border-fantasy-border bg-slate-950/90 shadow-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/90 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4">Item Name & Rarity</th>
                        <th className="py-3 px-3">Category & Sourcebook</th>
                        <th className="py-3 px-3 hidden md:table-cell">Mechanics & Lore Summary</th>
                        <th className="py-3 px-3">Storefront</th>
                        <th className="py-3 px-3 text-right">Base Cost</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/70 text-xs">
                      {visibleCatalog.map((item, idx) => {
                        const name = item['Item Name'];
                        const rarity = item['Rarity'] || 'Common';
                        const baseCost = item['Base Cost'] || item['Baseline Cost'] || '1 gp';
                        const weight = item['Weight (lbs)'] || item['Weight'] || '1';
                        const desc = item['Properties / Flavor'] || item['Description & Mechanics'] || '';
                        const shopName = item['Iconic Storefront'] || 'Waterdeep Market';
                        return (
                          <tr key={idx} className="hover:bg-slate-900/75 transition group">
                            <td className="py-2.5 px-4">
                              <div className="flex items-center space-x-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getRarityBadgeStyle(rarity)}`}>
                                  {rarity}
                                </span>
                                <button
                                  onClick={() => setInspectingItem(item)}
                                  className="font-bold text-white hover:text-fantasy-gold text-left transition"
                                >
                                  {name}
                                </button>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-slate-300">
                              <span className="font-semibold block">{item['Category'] || 'Wondrous Item'}</span>
                              <span className="text-[10px] text-slate-500">{item['Sourcebook'] || 'DMG'} • {weight} lbs</span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-400 max-w-md hidden md:table-cell">
                              <p className="line-clamp-1">{desc}</p>
                            </td>
                            <td className="py-2.5 px-3">
                              <button
                                onClick={() => {
                                  const targetShop = (data?.shops || []).find(s => s['Shop Name'] === shopName);
                                  if (targetShop) {
                                    setAppMode('kiosk');
                                    selectWard(targetShop.Ward || 'Trades');
                                    selectVenue(targetShop);
                                  }
                                }}
                                className="text-[11px] text-amber-300/90 hover:text-fantasy-gold hover:underline text-left truncate max-w-[160px] block"
                                title="Click to visit this storefront"
                              >
                                🏪 {shopName}
                              </button>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-fantasy-gold whitespace-nowrap">
                              <span className="inline-flex items-center space-x-1.5">
                                <span className={`w-2 h-2 rounded-full ${getCoinPipColor(baseCost)}`} />
                                <span>{baseCost}</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right whitespace-nowrap">
                              <div className="inline-flex items-center space-x-1.5">
                                <button
                                  onClick={() => {
                                    addToCart({
                                      ...item,
                                      'Item Name': name,
                                      name,
                                      cost: baseCost,
                                      'Base Cost': baseCost,
                                      weight,
                                      maxStock: 99,
                                      tier: '3'
                                    }, shopName, 99);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-fantasy-gold hover:bg-fantasy-goldHover text-fantasy-dark font-black text-[11px] transition"
                                >
                                  + Cart
                                </button>
                                <button
                                  onClick={() => setInspectingItem(item)}
                                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-fantasy-gold border border-slate-700 transition"
                                  title="Inspect full details & +1/+2/+3 upgrades"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {visibleCatalog.map((item, idx) => {
                    const name = item['Item Name'];
                    const rarity = item['Rarity'] || 'Common';
                    const baseCost = item['Base Cost'] || item['Baseline Cost'] || '1 gp';
                    const weight = item['Weight (lbs)'] || item['Weight'] || '1';
                    const desc = item['Properties / Flavor'] || item['Description & Mechanics'] || '';
                    const shopName = item['Iconic Storefront'] || 'Waterdeep Market';
                    return (
                      <div key={idx} className={`loot-item-card ${getRarityBorderClass(rarity)} rounded-2xl p-4 flex flex-col justify-between`}>
                        <div>
                          {/* Top Metadata Row */}
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center space-x-1.5">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${getRarityBadgeStyle(rarity)}`}>
                                {rarity}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">
                                {item['Category'] || 'Wondrous Item'}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5 bg-slate-950/90 border border-slate-800 px-2.5 py-0.5 rounded-full">
                              <span className={`w-2 h-2 rounded-full ${getCoinPipColor(baseCost)}`} />
                              <span className="text-xs font-mono font-black text-fantasy-gold">{baseCost}</span>
                            </div>
                          </div>

                          {/* Item Title */}
                          <h4
                            onClick={() => setInspectingItem(item)}
                            className="font-display font-bold text-base text-white hover:text-fantasy-gold cursor-pointer transition mb-1"
                          >
                            {name}
                          </h4>

                          {/* Description */}
                          <p
                            onClick={() => setInspectingItem(item)}
                            className="text-xs text-slate-300/90 line-clamp-2 leading-relaxed mb-3 cursor-pointer"
                          >
                            {desc}
                          </p>

                          {/* Provenance & Sourcebook Bar */}
                          <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80 mb-3">
                            <span className="truncate max-w-[160px]">📖 {item['Sourcebook'] || 'DMG'}</span>
                            <button
                              onClick={() => {
                                const targetShop = (data?.shops || []).find(s => s['Shop Name'] === shopName);
                                if (targetShop) {
                                  setAppMode('kiosk');
                                  selectWard(targetShop.Ward || 'Trades');
                                  selectVenue(targetShop);
                                }
                              }}
                              className="text-amber-300 hover:underline font-semibold truncate max-w-[150px]"
                              title="Visit canonical storefront"
                            >
                              🏪 {shopName}
                            </button>
                          </div>
                        </div>

                        {/* Un-Crammed Bottom Action Bar */}
                        <div className="flex items-center space-x-2 pt-2.5 border-t border-slate-800/80">
                          <button
                            onClick={() => {
                              addToCart({
                                ...item,
                                'Item Name': name,
                                name,
                                cost: baseCost,
                                'Base Cost': baseCost,
                                weight,
                                maxStock: 99,
                                tier: '3'
                              }, shopName, 99);
                            }}
                            className="flex-1 py-2 rounded-xl bg-fantasy-gold hover:bg-fantasy-goldHover text-fantasy-dark font-black text-xs shadow transition flex items-center justify-center space-x-1.5"
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </button>
                          <button
                            onClick={() => setInspectingItem(item)}
                            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-fantasy-gold border border-slate-700/80 text-xs font-bold transition flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {visibleCatalog.length < filteredCatalog.length && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => setCatalogLimit(prev => prev + 90)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-fantasy-gold font-bold text-xs border border-amber-500/40 shadow-lg transition"
                  >
                    Load More Items ({filteredCatalog.length - visibleCatalog.length} remaining)
                  </button>
                </div>
              )}
            </div>
          );
        })()}

        {/* KIOSK MODE: Levels 1 through 7 */}
        {appMode === 'kiosk' && (
          <>
                {/* LEVEL 1: MULTIVERSE PLANETARY SHOWCASE (UNIVERSAL DM TILE TOGGLES) */}
        {!selectedPlanet && (
          <div className="py-4">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-widest text-sky-400">Multiverse Cosmic Atlas • Prime Material Plane</span>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-wide mt-1">Known Planetary Spheres</h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto mt-1">
                Select a celestial campaign world within the Prime Material multiverse to explore continental trade routes and urban commerce.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto mb-8">
              {PLANETS.filter(p => dmMode || !hiddenNodes?.[`planet::${p.id}`]).map((p) => {
                const isToril = p.id === 'Toril';
                const isHidden = Boolean(hiddenNodes?.[`planet::${p.id}`]);
                const canEnter = p.active || dmMode;
                return (
                  <div
                    key={p.id}
                    onClick={() => canEnter && setPlanet(p.name)}
                    className={`relative rounded-2xl overflow-hidden border-2 transition flex flex-col justify-between ${
                      isHidden ? 'opacity-45 border-rose-800/70 bg-slate-950' :
                      canEnter
                        ? 'bg-slate-900 border-sky-500/50 hover:border-sky-400 cursor-pointer shadow-2xl group hover:shadow-sky-950/80 hover:-translate-y-0.5 duration-300'
                        : 'bg-slate-950/80 border-slate-800/60 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="h-44 w-full relative overflow-hidden bg-slate-950">
                      {isToril ? (
                        <img
                          src="/banners/toril.jpg"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1920&auto=format&fit=crop";
                          }}
                          alt="Planet Toril in Realmspace"
                          className="w-full h-full object-cover object-center filter brightness-95 group-hover:scale-105 transition duration-700"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${
                          p.id === 'Krynn' ? 'bg-gradient-to-tr from-amber-950 via-slate-900 to-amber-900' :
                          p.id === 'Oerth' ? 'bg-gradient-to-tr from-slate-950 via-gray-900 to-slate-800' :
                          p.id === 'Eberron' ? 'bg-gradient-to-tr from-cyan-950 via-slate-900 to-blue-900' :
                          'bg-gradient-to-tr from-orange-950 via-red-950 to-stone-900'
                        }`}>
                          <Globe2 className="w-16 h-16 text-slate-700/60" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 text-sky-300 border border-sky-500/40 backdrop-blur-sm">
                          {p.sphere}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {dmMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNodeHidden(`planet::${p.id}`);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                isHidden
                                  ? 'bg-rose-950 text-rose-300 border-rose-700'
                                  : 'bg-slate-900/90 text-slate-200 hover:text-white border-slate-700'
                              }`}
                              title={isHidden ? "Hidden from players (Click to show)" : "Visible to players (Click to hide)"}
                            >
                              {isHidden ? '🚫 Hidden' : '👁️ Visible'}
                            </button>
                          )}
                          {p.active ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-600 shadow">
                              Active Sphere
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 text-[10px] font-semibold text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                              <Lock className="w-3 h-3" />
                              <span>Unmapped</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="absolute bottom-2.5 left-4">
                        <h3 className={`text-2xl font-black ${canEnter ? 'text-white group-hover:text-sky-300' : 'text-slate-400'} drop-shadow transition`}>
                          {p.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">{p.desc}</p>

                      {canEnter ? (
                        <button
                          onClick={(e) => { e.stopPropagation(); setPlanet(p.name); }}
                          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-sky-950/80 transition flex items-center justify-center space-x-2"
                        >
                          <span>Enter Orbit • Explore Continents</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="py-2 px-3 rounded-lg bg-slate-950 border border-slate-800/80 text-center text-[11px] text-slate-500 font-mono">
                          Expedition Logged • Future Expansion
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LEVEL 2: CONTINENTS (UNIVERSAL DM TILE TOGGLES) */}
        {selectedPlanet && !selectedContinent && (
          <div className="py-2">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-fantasy-border pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Planet {selectedPlanet} • Planetary Chart</span>
                <h2 className="text-3xl font-black text-white tracking-wide mt-0.5">Continental Landmasses</h2>
                <p className="text-xs text-slate-400 mt-1">Select a continental landmass to inspect regional trading frontiers.</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-slate-300 border border-slate-800 self-start sm:self-auto">
                {CONTINENTS.filter(c => dmMode || !hiddenNodes?.[`continent::${c.id}`]).length} Continents
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {CONTINENTS.filter(c => dmMode || !hiddenNodes?.[`continent::${c.id}`]).map((c) => {
                const isFaerun = c.id === 'Faerun';
                const isHidden = Boolean(hiddenNodes?.[`continent::${c.id}`]);
                const canEnter = c.active || dmMode;
                return (
                  <div 
                    key={c.id} 
                    onClick={() => canEnter && setContinent(c.name)} 
                    className={`relative overflow-hidden rounded-2xl border-2 transition flex flex-col justify-between ${
                      isHidden ? 'opacity-45 border-rose-800/70 bg-slate-950' :
                      canEnter 
                        ? 'bg-slate-900 border-emerald-500/50 hover:border-emerald-400 cursor-pointer shadow-xl group hover:shadow-2xl hover:-translate-y-0.5 duration-300' 
                        : 'bg-slate-950/80 border-slate-800/60 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="h-40 w-full relative overflow-hidden bg-slate-950">
                      {isFaerun ? (
                        <img
                          src="/banners/faerun.jpg"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1920&auto=format&fit=crop";
                          }}
                          alt="Continent of Faerûn"
                          className="w-full h-full object-cover object-center filter brightness-95 group-hover:scale-105 transition duration-700"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${
                          c.id === 'Kara-Tur' ? 'bg-gradient-to-tr from-red-950 via-amber-950 to-slate-900' :
                          c.id === 'Zakhara' ? 'bg-gradient-to-tr from-yellow-950 via-amber-900 to-slate-900' :
                          'bg-gradient-to-tr from-teal-950 via-emerald-950 to-slate-900'
                        }`}>
                          <Globe2 className="w-16 h-16 text-slate-700/60" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                      
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 bg-black/60 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                          <span className="text-base">{isFaerun ? '⚔️' : c.id === 'Kara-Tur' ? '🏮' : c.id === 'Zakhara' ? '🕌' : '🐍'}</span>
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-300">
                            {isFaerun ? 'Heart of Adventure' : c.id === 'Kara-Tur' ? 'Eastern Empires' : c.id === 'Zakhara' ? 'Land of Fate' : 'The True World'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          {dmMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNodeHidden(`continent::${c.id}`);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                isHidden
                                  ? 'bg-rose-950 text-rose-300 border-rose-700'
                                  : 'bg-slate-900/90 text-slate-200 hover:text-white border-slate-700'
                              }`}
                            >
                              {isHidden ? '🚫 Hidden' : '👁️ Visible'}
                            </button>
                          )}
                          {c.active ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-500 shadow">
                              Active Continent
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 text-[10px] font-semibold text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                              <Lock className="w-3 h-3" />
                              <span>Unmapped</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="absolute bottom-2.5 left-4">
                        <h3 className={`text-2xl font-black ${canEnter ? 'text-white group-hover:text-emerald-300' : 'text-slate-400'} drop-shadow transition`}>
                          {c.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">{c.desc}</p>
                      
                      {canEnter ? (
                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-emerald-400 font-bold">
                          <span>Explore Regions</span>
                          <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition" />
                        </div>
                      ) : (
                        <div className="py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800/80 text-center text-[10px] text-slate-500 font-mono">
                          Territory Unmapped
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LEVEL 3: REGIONS (UNIVERSAL DM TILE TOGGLES) */}
        {selectedContinent && !selectedRegion && (
          <div className="py-2">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-fantasy-border pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Continent of {selectedContinent}</span>
                <h2 className="text-3xl font-black text-white tracking-wide mt-0.5">Geographic Territories</h2>
                <p className="text-xs text-slate-400 mt-1">Select a territory to inspect regional settlements and trading ports.</p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-slate-300 border border-slate-800 self-start sm:self-auto">
                {REGIONS.filter(r => dmMode || !hiddenNodes?.[`region::${r.id}`]).length} Regions
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {REGIONS.filter(r => dmMode || !hiddenNodes?.[`region::${r.id}`]).map((r) => {
                const isSwordCoast = r.id === 'Sword Coast';
                const isHidden = Boolean(hiddenNodes?.[`region::${r.id}`]);
                const canEnter = r.active || dmMode;
                return (
                  <div 
                    key={r.id} 
                    onClick={() => canEnter && setRegion(r.name)} 
                    className={`relative overflow-hidden rounded-2xl border-2 transition flex flex-col justify-between ${
                      isHidden ? 'opacity-45 border-rose-800/70 bg-slate-950' :
                      canEnter 
                        ? 'bg-slate-900 border-amber-500/50 hover:border-amber-400 cursor-pointer shadow-xl group hover:shadow-2xl hover:-translate-y-0.5 duration-300' 
                        : 'bg-slate-950/80 border-slate-800/60 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="h-40 w-full relative overflow-hidden bg-slate-950">
                      {isSwordCoast ? (
                        <img
                          src="/banners/sword_coast.jpg"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1920&auto=format&fit=crop";
                          }}
                          alt="The Sword Coast Frontier"
                          className="w-full h-full object-cover object-center filter brightness-95 group-hover:scale-105 transition duration-700"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${
                          r.id === 'Heartlands' ? 'bg-gradient-to-tr from-emerald-950 via-slate-900 to-teal-900' :
                          r.id === 'Calimshan' ? 'bg-gradient-to-tr from-yellow-950 via-amber-950 to-stone-900' :
                          'bg-gradient-to-tr from-cyan-950 via-blue-950 to-slate-900'
                        }`}>
                          <Globe2 className="w-16 h-16 text-slate-700/60" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                      
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 bg-black/60 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                          {isSwordCoast ? "Lords' Alliance Frontier" : "Regional Territory"}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {dmMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNodeHidden(`region::${r.id}`);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                isHidden
                                  ? 'bg-rose-950 text-rose-300 border-rose-700'
                                  : 'bg-slate-900/90 text-slate-200 hover:text-white border-slate-700'
                              }`}
                            >
                              {isHidden ? '🚫 Hidden' : '👁️ Visible'}
                            </button>
                          )}
                          {r.active ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-500 shadow">
                              Active Region
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 text-[10px] font-semibold text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                              <Lock className="w-3 h-3" />
                              <span>Unmapped</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="absolute bottom-2.5 left-4">
                        <h3 className={`text-2xl font-black ${canEnter ? 'text-white group-hover:text-amber-300' : 'text-slate-400'} drop-shadow transition`}>
                          {r.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">{r.desc}</p>
                      
                      {canEnter ? (
                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-fantasy-gold font-bold">
                          <span>Survey Settlements & City Packs</span>
                          <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition" />
                        </div>
                      ) : (
                        <div className="py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800/80 text-center text-[10px] text-slate-500 font-mono">
                          Territory Unmapped
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LEVEL 4: SETTLEMENTS & PLUG-AND-PLAY CITY PACKS (UNIVERSAL DM TILE TOGGLES) */}
        {selectedRegion && !selectedSettlement && (
          <div className="py-2">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-fantasy-border pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">{selectedRegion} Region • Modular City Packs</span>
                <h2 className="text-3xl font-black text-white tracking-wide mt-0.5">Major Settlements & Trading Ports</h2>
                <p className="text-xs text-slate-400 mt-1">Select a loaded city pack to explore its districts, shops, and taverns.</p>
              </div>
              <div className="flex items-center space-x-2 self-start sm:self-auto">
                {dmMode && (
                  <button
                    onClick={() => setCityPackModalOpen(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600 shadow transition flex items-center space-x-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>+ Upload / Manage City Packs (.json)</span>
                  </button>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-slate-300 border border-slate-800">
                  {activeSettlements.filter(s => dmMode || !hiddenNodes?.[`settlement::${s.id}`]).length} Settlements
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {activeSettlements.filter(s => dmMode || !hiddenNodes?.[`settlement::${s.id}`]).map((s) => {
                const isWaterdeep = s.id === 'Waterdeep';
                const isNeverwinter = s.id === 'Neverwinter';
                const isHidden = Boolean(hiddenNodes?.[`settlement::${s.id}`]);
                const canEnter = s.active;
                return (
                  <div 
                    key={s.id} 
                    onClick={() => canEnter ? setSettlement(s.name) : (dmMode && setCityPackModalOpen(true))} 
                    className={`relative overflow-hidden rounded-2xl border-2 transition flex flex-col justify-between ${
                      isHidden ? 'opacity-45 border-rose-800/70 bg-slate-950' :
                      canEnter 
                        ? 'bg-slate-900 border-fantasy-gold/50 hover:border-fantasy-gold cursor-pointer shadow-xl group hover:shadow-2xl hover:-translate-y-0.5 duration-300' 
                        : 'bg-slate-950/80 border-slate-800/60 opacity-60 cursor-pointer'
                    }`}
                  >
                    <div className="h-40 w-full relative overflow-hidden bg-slate-950">
                      {isWaterdeep ? (
                        <img
                          src="/banners/waterdeep.jpg"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop";
                          }}
                          alt="City of Splendors Waterdeep"
                          className="w-full h-full object-cover object-center filter brightness-95 group-hover:scale-105 transition duration-700"
                        />
                      ) : isNeverwinter ? (
                        <img
                          src="/banners/neverwinter.jpg"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1920&auto=format&fit=crop";
                          }}
                          alt="Neverwinter City of Skilled Hands"
                          className="w-full h-full object-cover object-center filter brightness-95 group-hover:scale-105 transition duration-700"
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${
                          s.id === 'Baldurs Gate' ? 'bg-gradient-to-tr from-red-950 via-slate-900 to-amber-950' :
                          'bg-gradient-to-tr from-indigo-950 via-slate-900 to-purple-950'
                        }`}>
                          <Store className="w-16 h-16 text-slate-700/60" />
                        </div>
                      )}
                      
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                      
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-300 bg-black/60 px-2.5 py-0.5 rounded-full border border-white/10 backdrop-blur-sm">
                          {s.subtitle}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {dmMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNodeHidden(`settlement::${s.id}`);
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                isHidden
                                  ? 'bg-rose-950 text-rose-300 border-rose-700'
                                  : 'bg-slate-900/90 text-slate-200 hover:text-white border-slate-700'
                              }`}
                            >
                              {isHidden ? '🚫 Hidden' : '👁️ Visible'}
                            </button>
                          )}
                          {s.active ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-950 text-emerald-300 border border-emerald-500 shadow">
                              City Pack Loaded
                            </span>
                          ) : (
                            <span className="flex items-center space-x-1 text-[10px] font-semibold text-slate-400 bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                              <Lock className="w-3 h-3" />
                              <span>No Pack Loaded</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="absolute bottom-2.5 left-4">
                        <h3 className={`text-2xl font-black ${s.active ? 'text-white group-hover:text-fantasy-gold' : 'text-slate-400'} drop-shadow transition`}>
                          {s.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">{s.desc}</p>
                      
                      {s.active ? (
                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-fantasy-gold font-bold">
                          <span>Enter {s.name} Districts</span>
                          <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition" />
                        </div>
                      ) : (
                        <div className="py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800/80 text-center text-[10px] text-slate-500 font-mono">
                          {dmMode ? 'Click to Upload Custom City Pack (.json)' : 'Settlement Pack Not Yet Loaded'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* LEVEL 5: MUNICIPAL DISTRICTS / WARDS OF ACTIVE CITY (UNIVERSAL DM TILE TOGGLES) */}
        {selectedSettlement && !selectedWard && (
          <div className="py-2">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-fantasy-border pb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-fantasy-gold">{selectedSettlement} Municipal Directory</span>
                <h2 className="text-3xl font-black text-white tracking-wide mt-0.5">Districts & Wards of {selectedSettlement}</h2>
                <p className="text-xs text-slate-400 mt-1">Select a municipal district to browse local shops, craft guildhalls, and taverns.</p>
              </div>
              <div className="flex items-center space-x-2 self-start sm:self-auto">
                {dmMode && (
                  <button
                    onClick={() => setCityPackModalOpen(true)}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-emerald-700/60 transition"
                  >
                    Switch City Pack
                  </button>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-900 text-slate-300 border border-slate-800">
                  {activeWards.filter(w => dmMode || !hiddenNodes?.[`ward::${selectedSettlement}::${w.id}`]).length} Districts
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeWards.filter(w => dmMode || !hiddenNodes?.[`ward::${selectedSettlement}::${w.id}`]).map((w) => {
                const wardKey = w.id.toLowerCase();
                const isDock = wardKey.includes('dock');
                const isTrades = wardKey.includes('trade') || wardKey.includes('river');
                const nodeKey = `ward::${selectedSettlement}::${w.id}`;
                const isHidden = Boolean(hiddenNodes?.[nodeKey]);
                return (
                  <div 
                    key={w.id} 
                    onClick={() => { selectWard(w.id); setSelectedSection('All'); }} 
                    className={`relative overflow-hidden rounded-2xl border-2 cursor-pointer shadow-xl transition group hover:shadow-2xl hover:-translate-y-0.5 duration-300 flex flex-col justify-between ${
                      isHidden
                        ? 'opacity-45 border-rose-800/70 bg-slate-950'
                        : 'border-fantasy-border hover:border-fantasy-gold bg-slate-900'
                    }`}
                  >
                    <div className="h-32 sm:h-36 w-full relative overflow-hidden bg-slate-950">
                      <img
                        src={`/banners/ward_${wardKey}.jpg`}
                        onError={(e) => {
                          e.target.src = isDock
                            ? "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1920&auto=format&fit=crop"
                            : isTrades
                            ? "https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1920&auto=format&fit=crop"
                            : "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1920&auto=format&fit=crop";
                        }}
                        alt={`${w.name} Streetscape`}
                        className="w-full h-full object-cover object-center filter brightness-95 group-hover:scale-105 transition duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                      <div className="absolute top-2.5 left-3 right-3 flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/60 text-slate-300 border border-white/10 backdrop-blur-sm">
                          {selectedSettlement}
                        </span>
                        <div className="flex items-center space-x-1.5">
                          {dmMode && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleNodeHidden(nodeKey);
                                addActivityLog({
                                  player: 'DM',
                                  action: isHidden ? 'Revealed District' : 'Hid District',
                                  details: `${w.name} (${selectedSettlement})`
                                });
                              }}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                isHidden
                                  ? 'bg-rose-950 text-rose-300 border-rose-700'
                                  : 'bg-slate-900/90 text-slate-200 hover:text-white border-slate-700'
                              }`}
                            >
                              {isHidden ? '🚫 Hidden' : '👁️ Visible'}
                            </button>
                          )}
                          {dmMode && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-950/90 text-amber-300 border border-amber-600/60 shadow">
                              Tier {w.tier}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-3">
                        <h3 className="text-xl font-black text-white group-hover:text-fantasy-gold drop-shadow transition">
                          {w.name}
                        </h3>
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-slate-300 leading-relaxed mb-3">{w.desc}</p>
                      
                      <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs text-fantasy-gold font-bold">
                        <span>Enter District Venues</span>
                        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {selectedWard && !selectedVenue && (
          <div>


            {/* Header Title & Top Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-black text-white tracking-wide">
                    {isCityWideScope ? 'All Waterdeep Storefronts' : activeWards.find(w => w.id === selectedWard)?.name}
                  </h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-slate-800 text-fantasy-gold border border-slate-700">
                    {currentVenues.length} {venueType === 'shops' ? 'Shops' : 'Eateries'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isCityWideScope 
                    ? 'Displaying all canonical venues across all 8 Wards of the City of Splendors.' 
                    : `Socioeconomic Tier ${activeWards.find(w => w.id === selectedWard)?.tier} • ${activeWards.find(w => w.id === selectedWard)?.desc}`}
                </p>
              </div>

              {/* Action Buttons: Shops/Taverns Toggle + Ask a Local Button */}
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-2">
                <button
                  onClick={() => {
                    const wares = generateShadyWares(data?.items || []);
                    setShadyWares(wares);
                    setShadyActiveIndex(0);
                    setShadyInspectResult(null);
                    setShadySpellRevealed(false);
                    setShadyPhysicalD20('');
                    setShadyPurchased(false);
                    setShadyPeddlerModalOpen(true);
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-900 to-indigo-950 hover:from-purple-800 hover:to-indigo-900 text-purple-200 hover:text-white font-black text-xs shadow transition border border-purple-600/50"
                  title="A shady figure in an oversized trenchcoat beckons from a damp alleyway..."
                >
                  <Eye className="w-3.5 h-3.5 text-purple-400" />
                  <span>Alley Peddler ("Psst...")</span>
                </button>

                <button
                  onClick={() => {
                    setAskLocalModalOpen(true);
                    setLocalRollResult(null);
                    // default select first local for this ward
                    const locals = WARD_LOCALS[selectedWard] || WARD_LOCALS['Trades'];
                    setSelectedLocalNpc(locals[0]);
                  }}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs shadow transition border border-amber-400/50"
                  title="Approach a colorful city local and roll for directions & secret vault leads!"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>Ask a Local (d20)</span>
                </button>

                <div className="flex bg-slate-900 border border-fantasy-border p-1 rounded-lg">
                  <button 
                    onClick={() => { setVenueType('shops'); setSelectedTradeFilter('All'); }} 
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition ${venueType === 'shops' ? 'bg-fantasy-gold text-fantasy-dark shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Shops</span>
                  </button>
                  <button 
                    onClick={() => { setVenueType('eateries'); setSelectedTradeFilter('All'); }} 
                    className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-bold transition ${venueType === 'eateries' ? 'bg-fantasy-gold text-fantasy-dark shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Taverns</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Smart Search Bar, Scope Switcher & Comfortable/Compact Venue Toggle */}
            <div className="bg-fantasy-card border border-fantasy-border p-3 rounded-xl mb-4 flex flex-col lg:flex-row gap-3 items-center justify-between shadow">
              <div className="w-full lg:flex-1 relative">
                <input
                  type="text"
                  placeholder={venueType === 'shops' ? "Search shops, trades, proprietors, or items sold inside (e.g. 'shield', 'boots', 'skeemo', 'lute')..." : "Search taverns, barkeeps, dishes, or ales..."}
                  value={venueSearchTerm}
                  onChange={(e) => setVenueSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fantasy-gold transition"
                />
                {venueSearchTerm && (
                  <button onClick={() => setVenueSearchTerm('')} className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between w-full lg:w-auto gap-2 flex-wrap">
                {/* Scope Switcher: In This Ward vs City-Wide */}
                <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0 text-xs">
                  <button
                    onClick={() => setIsCityWideScope(false)}
                    className={`px-3 py-1 rounded-md font-semibold transition ${!isCityWideScope ? 'bg-fantasy-gold text-fantasy-dark font-bold shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    In {activeWards.find(w => w.id === selectedWard)?.name}
                  </button>
                  <button
                    onClick={() => setIsCityWideScope(true)}
                    className={`px-3 py-1 rounded-md font-semibold transition ${isCityWideScope ? 'bg-fantasy-gold text-fantasy-dark font-bold shadow' : 'text-slate-400 hover:text-white'}`}
                  >
                    City-Wide (All Wards)
                  </button>
                </div>

                {/* Comfortable Cards vs Compact Directory Table Toggle (Visible on Shop/Tavern Selection Screen) */}
                <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-lg shrink-0 text-xs">
                  <button
                    onClick={() => setViewDensity && setViewDensity('comfortable')}
                    className={`px-2.5 py-1 rounded-md font-bold transition flex items-center space-x-1 ${
                      viewDensity !== 'compact' ? 'bg-fantasy-gold text-fantasy-dark shadow' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Comfortable Venue Cards"
                  >
                    <span>🃏</span>
                    <span>Comfortable</span>
                  </button>
                  <button
                    onClick={() => setViewDensity && setViewDensity('compact')}
                    className={`px-2.5 py-1 rounded-md font-bold transition flex items-center space-x-1 ${
                      viewDensity === 'compact' ? 'bg-fantasy-gold text-fantasy-dark shadow' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Compact Venue Directory List"
                  >
                    <span>📋</span>
                    <span>Compact</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Trade Category Pill Chips */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-4 scrollbar-thin">
              {(venueType === 'shops' ? TRADE_GROUPS : EATERY_GROUPS).map(g => {
                const isSelected = selectedTradeFilter === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => setSelectedTradeFilter(g.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                      isSelected
                        ? 'bg-fantasy-gold text-fantasy-dark border-fantasy-gold font-bold shadow'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>

            {/* Venue Directory: Compact Table vs Comfortable Grid */}
            {viewDensity === 'compact' ? (
              <div className="overflow-x-auto rounded-2xl border border-fantasy-border bg-slate-950/90 shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/90 text-[10px] font-black uppercase tracking-wider text-slate-400">
                      <th className="py-3 px-4">Venue Name</th>
                      <th className="py-3 px-3">Trade / Specialty</th>
                      <th className="py-3 px-3">Proprietor</th>
                      <th className="py-3 px-3 hidden md:table-cell">Atmosphere & Vibe</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/70 text-xs">
                    {currentVenues.map((v, i) => {
                      const name = v['Shop Name'] || v['Eatery Name'];
                      const role = v['Primary Vendor Type'] || v['Eatery Type'];
                      const prop = (v['Proprietor / Staff'] || '').split(' - ')[0];
                      return (
                        <tr
                          key={i}
                          onClick={() => {
                            const isEatery = Boolean(v['Eatery Name'] || v['Eatery Type']);
                            setVenueType(isEatery ? 'eateries' : 'shops');
                            selectVenue(v);
                            setStoreTab('buy');
                            setSelectedSection('All');
                            setItemEnchantGrade(0);
                          }}
                          className="hover:bg-slate-900/80 cursor-pointer transition group"
                        >
                          <td className="py-2.5 px-4 font-display font-bold text-white group-hover:text-fantasy-gold">
                            <div className="flex items-center space-x-2">
                              <span>{name}</span>
                              {isCityWideScope && (
                                <span className="text-[10px] font-sans font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700">
                                  {v.Ward}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px] font-semibold">
                              {role}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-amber-300/90 font-medium whitespace-nowrap">
                            {prop}
                          </td>
                          <td className="py-2.5 px-3 text-slate-400 max-w-md hidden md:table-cell">
                            <p className="line-clamp-1">{v['Vibe & Decor']}</p>
                          </td>
                          <td className="py-2.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center space-x-2">
                              {dmMode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleVenueDisabled(name);
                                  }}
                                  className={`px-2 py-1 rounded text-[10px] font-bold border transition ${
                                    disabledVenues[name]
                                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                                      : 'bg-slate-900 text-slate-400 hover:text-white border-slate-700'
                                  }`}
                                >
                                  {disabledVenues[name] ? 'Hidden' : 'Visible'}
                                </button>
                              )}
                              <span className="px-2.5 py-1 rounded-lg bg-fantasy-gold text-fantasy-dark font-black text-[11px] inline-flex items-center space-x-1 shadow">
                                <span>Enter</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentVenues.map((v, i) => {
                  const name = v['Shop Name'] || v['Eatery Name'];
                  const role = v['Primary Vendor Type'] || v['Eatery Type'];
                  const prop = v['Proprietor / Staff'] || '';
                  return (
                    <div key={i} onClick={() => {
                        const isEatery = Boolean(v['Eatery Name'] || v['Eatery Type']);
                        setVenueType(isEatery ? 'eateries' : 'shops');
                        selectVenue(v);
                        setStoreTab('buy');
                        setSelectedSection('All');
                        setItemEnchantGrade(0);
                      }} className="loot-item-card border border-fantasy-border hover:border-fantasy-gold p-5 rounded-xl cursor-pointer transition shadow group flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <h3 className="font-display font-bold text-base text-white group-hover:text-fantasy-gold transition truncate">{name}</h3>
                          <div className="flex items-center space-x-1 shrink-0">
                            {dmMode && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleVenueDisabled(name);
                                  addActivityLog({
                                    player: 'DM',
                                    action: disabledVenues[name] ? 'Revealed Shop' : 'Hid Shop',
                                    details: `${name} (${selectedWard} Ward)`
                                  });
                                }}
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                                  disabledVenues[name]
                                    ? 'bg-rose-950 text-rose-300 border-rose-800'
                                    : 'bg-slate-900 text-slate-400 hover:text-white border-slate-700'
                                }`}
                                title={disabledVenues[name] ? "Hidden from players (Click to reveal)" : "Visible to players (Click to hide)"}
                              >
                                {disabledVenues[name] ? 'Hidden' : 'Visible'}
                              </button>
                            )}
                            {isCityWideScope && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700">
                                {v.Ward}
                              </span>
                            )}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">{role}</span>
                          </div>
                        </div>
                        <p className="text-xs text-amber-300/90 mb-2 font-semibold">{prop.split(' - ')[0]}</p>
                        <p className="text-xs text-slate-400 line-clamp-2">{v['Vibe & Decor']}</p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-fantasy-gold font-bold">
                        <span>Enter Venue</span>
                        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* LEVEL 7: VENUE DETAIL & INVENTORY */}
        {selectedVenue && (
          <div>
            {/* Back to Ward Navigation Bar */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => selectVenue(null)}
                className="flex items-center space-x-2 text-xs font-bold text-slate-300 hover:text-fantasy-gold bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-fantasy-gold/50 px-3.5 py-2 rounded-xl transition shadow"
              >
                <ArrowLeft className="w-4 h-4 text-fantasy-gold" />
                <span>Return to {activeWards.find(w => w.id === selectedWard)?.name} {isFood ? 'Taverns & Eateries' : 'Merchant Shops'}</span>
              </button>
              <div className="text-[11px] text-slate-400">
                <span className="font-semibold text-white">{isFood ? 'Dining & Tavern Mode' : 'Merchant Storefront'}</span>
              </div>
            </div>

            {/* Header */}
            <div className="bg-fantasy-card border border-fantasy-border rounded-xl p-5 mb-5 shadow-lg">
              <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-fantasy-border pb-4 mb-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-fantasy-gold">
                    {selectedVenue['Primary Vendor Type'] || selectedVenue['Eatery Type']} • {activeWards.find(w => w.id === selectedWard)?.name}
                  </span>
                  <h2 className="text-2xl font-black text-white tracking-wide">{venueName}</h2>
                  <p className="text-xs text-amber-200/90 mt-0.5">
                    <strong>Proprietor:</strong> {selectedVenue['Proprietor / Staff']}
                  </p>
                </div>
                <div className="flex items-center flex-wrap gap-2">
                  <button
                    onClick={() => {
                      rerollStock();
                      addActivityLog({ player: activePlayer || 'DM', action: 'Day Restock', details: `Advanced to Day ${daySeed + 1} at ${venueName}` });
                    }}
                    className="flex items-center space-x-1.5 bg-slate-900 hover:bg-slate-800 border border-amber-600/50 px-3 py-1.5 rounded-lg text-xs font-bold text-amber-300 transition shadow"
                    title="Advance to next campaign day & reroll this shop's daily shelf quantities"
                  >
                    <Dices className="w-3.5 h-3.5 text-fantasy-gold" />
                    <span>Day {daySeed} Stock (Reroll)</span>
                  </button>

                  {dmMode && !isFood && (
                    <button
                      onClick={() => setIncludePlanarImports(!includePlanarImports)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition ${
                        includePlanarImports
                          ? 'bg-purple-950/90 border-purple-500 text-purple-200'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                      title="DM Toggle: Allow non-Toril Planar & Partnered setting imports to appear on shelves"
                    >
                      🌐 {includePlanarImports ? 'Planar Imports: ON' : 'Strict Faerûn Lore'}
                    </button>
                  )}

                  <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-xs">
                    <span className="text-slate-400">Price Modifier: </span>
                    <span className="font-bold text-white">
                      {selectedVenue['Socioeconomic Tier'] === '1' && '-40% Squalid'}
                      {selectedVenue['Socioeconomic Tier'] === '2' && '-20% Poor'}
                      {selectedVenue['Socioeconomic Tier'] === '3' && 'Baseline (Fair)'}
                      {selectedVenue['Socioeconomic Tier'] === '4' && '+20% Comfortable'}
                      {selectedVenue['Socioeconomic Tier'] === '5' && '+60% Aristocratic'}
                      {selectedVenue['Socioeconomic Tier'] === 'BM' && 'Volatile Contraband'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="bg-amber-950/20 border-l-4 border-fantasy-gold p-4 rounded-r-lg">
                <div className="flex items-center space-x-2 text-fantasy-gold text-xs font-bold uppercase tracking-wide mb-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>DM Read-Aloud Atmosphere</span>
                </div>
                <p className="text-xs text-amber-100/90 italic leading-relaxed">"{selectedVenue['DM Read-Aloud']}"</p>
              </div>
            </div>

            {/* Storefront Mode Tabs: Buy Goods vs Sell & Appraise Loot */}
            {!isFood && (
              <div className="flex border-b border-fantasy-border mb-6">
                <button
                  onClick={() => setStoreTab('buy')}
                  className={`flex items-center space-x-2 py-3 px-6 text-sm font-bold border-b-2 transition ${
                    storeTab === 'buy'
                      ? 'border-fantasy-gold text-fantasy-gold bg-slate-900/40'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Browse & Buy Goods</span>
                </button>

                <button
                  onClick={() => setStoreTab('sell')}
                  className={`flex items-center space-x-2 py-3 px-6 text-sm font-bold border-b-2 transition ${
                    storeTab === 'sell'
                      ? 'border-fantasy-gold text-fantasy-gold bg-slate-900/40'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  <span>Pawn & Appraisal Counter</span>
                </button>
              
                {(selectedVenue['Primary Vendor Type']?.includes('Smithy') || 
                  selectedVenue['Primary Vendor Type']?.includes('Armorer') || 
                  selectedVenue['Primary Vendor Type']?.includes('Arcane') ||
                  selectedVenue['Primary Vendor Type']?.includes('Weaponsmith')) && (
                  <button
                    onClick={() => setStoreTab('forge')}
                    className={`flex items-center space-x-2 py-3 px-6 text-sm font-bold border-b-2 transition ${
                      storeTab === 'forge'
                        ? 'border-fantasy-gold text-fantasy-gold bg-slate-900/40'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-fantasy-gold" />
                    <span>Forge & Arcane Upgrades (+1 / +2 / +3)</span>
                  </button>
                )}
              </div>
            )}

            {/* FORGE & ARCANE UPGRADE VIEW */}
            {storeTab === 'forge' && !isFood ? (
              <div className="bg-fantasy-card border-2 border-fantasy-border rounded-2xl p-6 shadow-2xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-fantasy-border pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-fantasy-gold block">
                      Masterwork Smithing & Arcane Tempering • {selectedVenue['Shop Name']}
                    </span>
                    <h3 className="text-2xl font-black text-white flex items-center space-x-2">
                      <Sparkles className="w-6 h-6 text-fantasy-gold" />
                      <span>The Arcane Forge & Upgrading Anvil</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Have {selectedVenue['Proprietor / Staff'].split(' - ')[0]} re-forge, balance, and inscribe planar magic runes to enhance equipment into +1, +2, or +3 gear.
                    </p>
                  </div>
                </div>

                {/* Upgrade Rules & Rates Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-xs">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-emerald-400 block mb-1">Tier I: +1 Enhanced</span>
                    <p className="text-slate-300 font-semibold">+1 Attack & Damage / +1 AC</p>
                    <span className="text-[11px] text-fantasy-gold block mt-1">Crafting Fee: 500 GP (Weapons) / 1,000 GP (Armor)</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-blue-400 block mb-1">Tier II: +2 Masterwork</span>
                    <p className="text-slate-300 font-semibold">+2 Attack & Damage / +2 AC</p>
                    <span className="text-[11px] text-fantasy-gold block mt-1">Crafting Fee: 4,000 GP (Weapons) / 6,000 GP (Armor)</span>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] font-bold uppercase text-purple-400 block mb-1">Tier III: +3 Relic</span>
                    <p className="text-slate-300 font-semibold">+3 Attack & Damage / +3 AC</p>
                    <span className="text-[11px] text-fantasy-gold block mt-1">Crafting Fee: 16,000 GP (Weapons) / 25,000 GP (Armor)</span>
                  </div>
                </div>

                {/* Interactive Commission Bench */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
                  <h4 className="text-sm font-bold text-white uppercase tracking-wider">Commission Custom Smithing & Enchantment</h4>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      1. Select Base Weapon or Armor to Temper
                    </label>
                    <select
                      value={forgeSelectedItem?.['Item Name'] || ''}
                      onChange={(e) => {
                        const found = (data.items || []).find(it => it['Item Name'] === e.target.value);
                        setForgeSelectedItem(found || null);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:border-fantasy-gold"
                    >
                      <option value="">-- Choose weapon or armor from shop inventory --</option>
                      {(data.items || [])
                        .filter(it => it['Iconic Storefront'] === venueName || isEnchantableItem(it))
                        .filter(isEnchantableItem)
                        .slice(0, 100)
                        .map(it => (
                          <option key={it['Item Name']} value={it['Item Name']}>
                            {it['Item Name']} ({it['Category']} - Base {it['Base Cost']})
                          </option>
                      ))}
                    </select>
                  </div>

                  {forgeSelectedItem && (
                    <div className="space-y-4 pt-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          2. Target Magical Tier (+1, +2, +3)
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { grade: 1, label: '+1 Enhanced' },
                            { grade: 2, label: '+2 Masterwork' },
                            { grade: 3, label: '+3 Relic' },
                          ].map(g => (
                            <button
                              key={g.grade}
                              onClick={() => setForgeTargetGrade(g.grade)}
                              className={`py-2 px-3 rounded-lg text-xs font-bold transition border ${
                                forgeTargetGrade === g.grade
                                  ? 'bg-fantasy-gold text-fantasy-dark border-fantasy-gold shadow'
                                  : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                              }`}
                            >
                              {g.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {(() => {
                        const details = getEnchantedItemDetails(forgeSelectedItem, forgeTargetGrade);
                        const adjPrice = getAdjustedPrice(details.enchantedCost, selectedVenue['Socioeconomic Tier']);
                        return (
                          <div className="bg-slate-950 border-2 border-fantasy-gold/40 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-700">
                                  {details.enchantedRarity}
                                </span>
                                <span className="text-xs text-slate-400">{forgeSelectedItem['Category']}</span>
                              </div>
                              <h4 className="text-base font-black text-white">{details.enchantedName}</h4>
                              <p className="text-xs text-amber-200/90 italic mt-0.5">{details.bonusText}</p>
                            </div>

                            <div className="flex flex-col sm:items-end gap-2 shrink-0">
                              <span className="text-lg font-black text-fantasy-gold">{formatGoldCost(adjPrice)}</span>
                              <button
                                onClick={() => {
                                  addToCart({
                                    ...forgeSelectedItem,
                                    'Item Name': details.enchantedName,
                                    'Base Cost': details.enchantedCost,
                                    'Rarity': details.enchantedRarity,
                                    name: details.enchantedName,
                                    cost: details.enchantedCost,
                                  }, venueName, 1);
                                  alert(`Forged ${details.enchantedName}! Added to Party Cart.`);
                                  confetti({ particleCount: 70, spread: 60 });
                                }}
                                className="px-4 py-2 bg-fantasy-gold hover:bg-fantasy-goldHover text-fantasy-dark font-black text-xs rounded-lg shadow transition flex items-center space-x-1.5"
                              >
                                <ShoppingBag className="w-3.5 h-3.5" />
                                <span>Commission & Add to Cart</span>
                              </button>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              </div>
            ) : (storeTab === 'buy' || isFood) ? (
              <div>

            {/* Departments / Menu Courses Bar */}
            <div className="bg-slate-900 border border-fantasy-border p-3 rounded-xl mb-5 shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-fantasy-gold">
                  {isFood ? <UtensilsCrossed className="w-3.5 h-3.5" /> : <Layers className="w-3.5 h-3.5" />}
                  <span>{isFood ? 'Tavern Menu Courses, Hearth Dishes & Draft Taps' : 'Store Departments & Aisles'}</span>
                </div>
                {/* Vault Access & Relock Controls */}
                {venueType === 'shops' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setVaultModalOpen(true)}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-bold transition border ${
                        isVaultUnlocked 
                          ? 'bg-emerald-950 border-emerald-700 text-emerald-300' 
                          : isVaultLockedOut
                          ? 'bg-rose-950 border-rose-800 text-rose-300 cursor-not-allowed'
                          : 'bg-slate-800 border-fantasy-border text-fantasy-gold hover:bg-slate-700'
                      }`}
                    >
                      {isVaultUnlocked ? <Unlock className="w-3.5 h-3.5 text-emerald-400" /> : <Lock className="w-3.5 h-3.5" />}
                      <span>{isVaultUnlocked ? 'Vault Unlocked' : isVaultLockedOut ? 'Vault Access Denied' : 'Under the Counter / Vault Check'}</span>
                    </button>

                    {isVaultUnlocked && (
                      <button
                        onClick={() => {
                          relockVault(venueName);
                          addActivityLog({ player: activePlayer, action: 'Vault Relocked', details: `${venueName} private stock secured.` });
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex items-center space-x-1"
                        title="Relock the private vault back up"
                      >
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>Relock</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedSection('All')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center space-x-1.5 ${
                    selectedSection === 'All'
                      ? 'bg-fantasy-gold text-fantasy-dark shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{isFood ? 'All Menu Courses' : 'All Items'}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-mono">{venueInventory.length}</span>
                </button>

                {availableSections.map(s => (
                  <button
                    key={s.name}
                    onClick={() => setSelectedSection(s.name)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition flex items-center space-x-1.5 ${
                      selectedSection === s.name
                        ? 'bg-fantasy-gold text-fantasy-dark shadow'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{s.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/20 font-mono">{s.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Bar & View Density Toggle */}
            <div className="bg-fantasy-card border border-fantasy-border p-3.5 rounded-2xl mb-6 flex flex-col lg:flex-row gap-3 items-center justify-between shadow-lg">
              <div className="w-full lg:w-80 relative">
                <input
                  type="text"
                  placeholder={venueType === 'shops' ? 'Search storefront wares, properties, or categories...' : 'Search tavern dishes, ales, or meal perks...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-fantasy-gold transition"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between w-full lg:w-auto gap-3 flex-wrap">
                {!isFood && (
                  <div className="flex items-center space-x-1 overflow-x-auto pb-0.5">
                    {['All', 'Mundane', 'Common', 'Uncommon', 'Rare', 'Very Rare', 'Legendary'].map(r => (
                      <button
                        key={r}
                        onClick={() => setSelectedRarity(r)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap border ${
                          selectedRarity === r
                            ? 'bg-fantasy-gold text-fantasy-dark border-fantasy-gold shadow'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}

                {/* Storefront View Density Toggle */}
                <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setViewDensity && setViewDensity('comfortable')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                      viewDensity !== 'compact'
                        ? 'bg-fantasy-gold text-fantasy-dark shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Comfortable RPG Card Grid"
                  >
                    <span>🃏</span>
                    <span>Cards</span>
                  </button>
                  <button
                    onClick={() => setViewDensity && setViewDensity('compact')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1 ${
                      viewDensity === 'compact'
                        ? 'bg-fantasy-gold text-fantasy-dark shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Compact High-Density Ledger Table"
                  >
                    <span>📋</span>
                    <span>Compact</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section-Grouped Inventory Display (Supports Comfortable Cards & Compact Ledger Table) */}
            <div className="space-y-8">
              {Object.entries(itemsGroupedBySection).map(([sectionName, items]) => {
                const isVaultSection = sectionName.includes('The Vault');
                const isLockedForPlayer = isVaultSection && !isVaultUnlocked;

                return (
                  <div key={sectionName}>
                    <div className="flex items-center justify-between mb-3.5 border-b border-fantasy-border pb-2">
                      <h3 className="text-base font-display font-black uppercase tracking-wider text-fantasy-gold flex items-center space-x-2">
                        {isVaultSection && <Lock className="w-4 h-4 text-amber-400" />}
                        <span>{sectionName}</span>
                      </h3>
                      <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-700">
                        {items.length} {items.length === 1 ? 'ware' : 'wares'}
                      </span>
                    </div>

                    {isLockedForPlayer ? (
                      <div className="bg-slate-950/90 border border-dashed border-amber-700/60 rounded-2xl p-8 text-center shadow-inner">
                        <Lock className="w-9 h-9 text-fantasy-gold mx-auto mb-2.5 opacity-85" />
                        <h4 className="font-display font-bold text-white text-lg mb-1">Locked Behind the Counter</h4>
                        <p className="text-xs text-slate-400 max-w-md mx-auto mb-4 leading-relaxed">
                          The proprietor keeps these rare curios secured under arcane lock and key. Roll a check to earn access to their private stock.
                        </p>
                        <button
                          onClick={() => setVaultModalOpen(true)}
                          disabled={isVaultLockedOut}
                          className={`font-black px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg ${
                            isVaultLockedOut
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : 'bg-fantasy-gold hover:bg-fantasy-goldHover text-fantasy-dark'
                          }`}
                        >
                          {isVaultLockedOut ? 'Access Denied for Today' : 'Attempt Vault Access Check'}
                        </button>
                      </div>
                    ) : viewDensity === 'compact' ? (
                      /* COMPACT LEDGER TABLE VIEW */
                      <div className="overflow-x-auto rounded-2xl border border-fantasy-border bg-slate-950/90 shadow-xl">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 bg-slate-900/90 text-[10px] font-black uppercase tracking-wider text-slate-400">
                              <th className="py-2.5 px-4">Item Name & Rarity</th>
                              <th className="py-2.5 px-3">Category</th>
                              <th className="py-2.5 px-3 hidden md:table-cell">Properties / Effect</th>
                              <th className="py-2.5 px-3 text-center">Wt.</th>
                              {!isFood && <th className="py-2.5 px-3 text-center">Stock</th>}
                              <th className="py-2.5 px-3 text-right">Price</th>
                              <th className="py-2.5 px-4 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/70 text-xs">
                            {items.map((item, idx) => {
                              const isFoodItem = Boolean(selectedVenue?.['Eatery Name'] || selectedVenue?.['Eatery Type'] || venueType === 'eateries');
                              const name = item['Item Name'];
                              const rarity = item['Rarity'] || 'Common';
                              const baseCost = item['Base Cost'] || item['Baseline Cost'] || '1 gp';
                              const adjPrice = getAdjustedPrice(baseCost, selectedVenue['Socioeconomic Tier']);
                              const formattedPrice = formatGoldCost(adjPrice);
                              const weight = item['Weight (lbs)'] || item['Weight'] || '0.5';
                              const perk = item['Meal Perk / Roleplay Effect'];
                              const flavor = item['Properties / Flavor'] || item['Description & Mechanics'] || '';
                              const maxStock = item.quantity !== undefined ? item.quantity : 99;
                              const inCartQuantity = cart.find(c => {
                                const cName = c.item?.['Item Name'] || c.item?.name;
                                const cVenue = c.venueName || c.item?.venueName;
                                return cName === name && (cVenue === venueName || !cVenue);
                              })?.quantity || 0;
                              const remainingStock = Math.max(0, maxStock - inCartQuantity);
                              const isMaxInCart = remainingStock === 0 && inCartQuantity > 0;
                              const isOutOfStock = maxStock === 0;

                              return (
                                <tr key={idx} className="hover:bg-slate-900/80 transition group">
                                  <td className="py-2.5 px-4">
                                    <div className="flex items-center space-x-2">
                                      {!isFoodItem && (
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${getRarityBadgeStyle(rarity)}`}>
                                          {rarity}
                                        </span>
                                      )}
                                      <button
                                        onClick={() => setInspectingItem(item)}
                                        className="font-bold text-white hover:text-fantasy-gold text-left transition"
                                      >
                                        {name}
                                      </button>
                                    </div>
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">
                                    {item['Subcategory'] || item['Category'] || 'Item'}
                                  </td>
                                  <td className="py-2.5 px-3 text-slate-400 max-w-md hidden md:table-cell">
                                    <p className="line-clamp-1">{isFoodItem && perk && perk !== 'None' ? `🍽️ ${perk} — ${flavor}` : flavor}</p>
                                  </td>
                                  <td className="py-2.5 px-3 text-center font-mono text-slate-400 whitespace-nowrap">
                                    {weight} lb
                                  </td>
                                  {!isFoodItem && (
                                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        isOutOfStock ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                                        remainingStock <= 2 ? 'bg-amber-950 text-amber-300 border border-amber-700' :
                                        'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                                      }`}>
                                        {isOutOfStock ? '0' : `${remainingStock}${inCartQuantity > 0 ? ` (${inCartQuantity})` : ''}`}
                                      </span>
                                    </td>
                                  )}
                                  <td className="py-2.5 px-3 text-right font-mono font-bold text-fantasy-gold whitespace-nowrap">
                                    <span className="inline-flex items-center space-x-1.5">
                                      <span className={`w-2 h-2 rounded-full ${getCoinPipColor(formattedPrice)}`} />
                                      <span>{formattedPrice}</span>
                                    </span>
                                  </td>
                                  <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                    <div className="inline-flex items-center space-x-1">
                                      <button
                                        onClick={() => {
                                          if (isOutOfStock || isMaxInCart) return;
                                          addToCart({
                                            ...item,
                                            'Item Name': name,
                                            name,
                                            cost: baseCost,
                                            'Base Cost': baseCost,
                                            weight,
                                            maxStock,
                                            perk: isFoodItem ? perk : null,
                                            tier: selectedVenue['Socioeconomic Tier']
                                          }, venueName, maxStock);
                                          if (isFoodItem && perk && perk !== 'None') {
                                            consumeMeal({ name, location: venueName, ward: selectedWard, perk });
                                          }
                                        }}
                                        disabled={isOutOfStock || isMaxInCart}
                                        className={`px-2.5 py-1 rounded-lg font-black text-[11px] transition ${
                                          isOutOfStock || isMaxInCart
                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                            : 'bg-fantasy-gold hover:bg-fantasy-goldHover text-fantasy-dark shadow'
                                        }`}
                                      >
                                        {isMaxInCart ? 'Max' : isOutOfStock ? 'Out' : isFoodItem ? '+ Order' : '+ Cart'}
                                      </button>

                                      {!isFoodItem && !isOutOfStock && (
                                        <button
                                          onClick={() => {
                                            setHaggleModalItem(item);
                                            setItemHaggleResult(null);
                                            setHagglePhysicalD20('');
                                          }}
                                          className="p-1.5 rounded-lg bg-amber-950/50 hover:bg-amber-900/70 text-amber-300 border border-amber-700/50 transition"
                                          title="Haggle / Barter price (d20)"
                                        >
                                          <span className="text-xs leading-none">🤝</span>
                                        </button>
                                      )}

                                      {!isFoodItem && !isOutOfStock && (
                                        <button
                                          onClick={() => {
                                            if (suspiciousShops[venueName]) {
                                              alert('Staff is watching you closely today!');
                                              return;
                                            }
                                            setHeistModalItem(item);
                                            setHeistPhase(1);
                                            setHeistResult(null);
                                            setHeistMidRoll(false);
                                          }}
                                          disabled={Boolean(suspiciousShops[venueName])}
                                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
                                          title="Attempt Five-Finger Discount (3-Phase Heist)"
                                        >
                                          <Hand className="w-3.5 h-3.5" />
                                        </button>
                                      )}

                                      <button
                                        onClick={() => setInspectingItem(item)}
                                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-fantasy-gold border border-slate-700 transition"
                                        title="Inspect Full Lore & +1/+2/+3 Upgrades"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      /* COMFORTABLE GILDED RPG CARD GRID */
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {items.map((item, idx) => {
                          const isFoodItem = Boolean(selectedVenue?.['Eatery Name'] || selectedVenue?.['Eatery Type'] || venueType === 'eateries');
                          const name = item['Item Name'];
                          const rarity = item['Rarity'] || 'Common';
                          const baseCost = item['Base Cost'] || item['Baseline Cost'] || '1 gp';
                          const adjPrice = getAdjustedPrice(baseCost, selectedVenue['Socioeconomic Tier']);
                          const formattedPrice = formatGoldCost(adjPrice);
                          const weight = item['Weight (lbs)'] || item['Weight'] || '0.5';
                          const perk = item['Meal Perk / Roleplay Effect'];
                          const flavor = item['Properties / Flavor'] || item['Description & Mechanics'] || '';
                          const maxStock = item.quantity !== undefined ? item.quantity : 99;
                          const inCartQuantity = cart.find(c => {
                            const cName = c.item?.['Item Name'] || c.item?.name;
                            const cVenue = c.venueName || c.item?.venueName;
                            return cName === name && (cVenue === venueName || !cVenue);
                          })?.quantity || 0;
                          const remainingStock = Math.max(0, maxStock - inCartQuantity);
                          const isMaxInCart = remainingStock === 0 && inCartQuantity > 0;
                          const isOutOfStock = maxStock === 0;

                          return (
                            <div
                              key={idx}
                              className={`loot-item-card ${getRarityBorderClass(rarity)} rounded-2xl p-4 flex flex-col justify-between`}
                            >
                              <div>
                                {/* Top Rarity & Metallic Coin Pip Price Header */}
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <div className="flex items-center space-x-1.5 min-w-0">
                                    {!isFoodItem && (
                                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border shrink-0 ${getRarityBadgeStyle(rarity)}`}>
                                        {rarity}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-slate-400 font-medium truncate">
                                      {item['Subcategory'] || item['Category'] || 'Item'} • {weight} lb
                                    </span>
                                  </div>

                                  <div className="flex items-center space-x-1.5 bg-slate-950/90 border border-slate-800 px-2.5 py-0.5 rounded-full shrink-0 shadow-inner">
                                    <span className={`w-2 h-2 rounded-full ${getCoinPipColor(formattedPrice)}`} />
                                    <span className="text-xs font-mono font-black text-fantasy-gold">{formattedPrice}</span>
                                  </div>
                                </div>

                                {/* Item Title & Stock Pill */}
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <h4
                                    onClick={() => setInspectingItem(item)}
                                    className="font-display font-bold text-base text-white hover:text-fantasy-gold cursor-pointer transition leading-snug"
                                    title="Click to inspect full lore and +1/+2/+3 enchantments"
                                  >
                                    {name}
                                  </h4>
                                  {!isFoodItem && (
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${
                                      isOutOfStock ? 'bg-rose-950/80 text-rose-400 border border-rose-800' :
                                      remainingStock <= 2 ? 'bg-amber-950/80 text-amber-300 border border-amber-700/60' :
                                      'bg-emerald-950/70 text-emerald-300 border border-emerald-800/50'
                                    }`}>
                                      {isOutOfStock ? 'Sold Out' : `${remainingStock} left${inCartQuantity > 0 ? ` (${inCartQuantity} in cart)` : ''}`}
                                    </span>
                                  )}
                                </div>

                                {/* Description */}
                                <p
                                  onClick={() => setInspectingItem(item)}
                                  className="text-xs text-slate-300/90 line-clamp-2 leading-relaxed mb-3 cursor-pointer hover:text-white transition"
                                  title="Click to read full description"
                                >
                                  {flavor}
                                </p>

                                {isFoodItem && perk && perk !== 'None' && (
                                  <div className="bg-emerald-950/30 border border-emerald-800/50 p-2.5 rounded-xl mb-3">
                                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide block mb-0.5">Meal Boon (Until Rest)</span>
                                    <p className="text-xs text-emerald-200/90 leading-tight">{perk}</p>
                                  </div>
                                )}
                              </div>

                              {/* Un-Crammed Action Footer: Primary Add to Cart + Segmented 3-Icon Pill Group */}
                              <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-800/80">
                                <button
                                  onClick={() => {
                                    if (isOutOfStock || isMaxInCart) return;
                                    addToCart({
                                      ...item,
                                      'Item Name': name,
                                      name,
                                      cost: baseCost,
                                      'Base Cost': baseCost,
                                      weight,
                                      maxStock,
                                      perk: isFoodItem ? perk : null,
                                      tier: selectedVenue['Socioeconomic Tier']
                                    }, venueName, maxStock);
                                    if (isFoodItem && perk && perk !== 'None') {
                                      consumeMeal({ name, location: venueName, ward: selectedWard, perk });
                                    }
                                  }}
                                  disabled={isOutOfStock || isMaxInCart}
                                  className={`flex-1 py-2 px-3 rounded-xl font-black text-xs transition flex items-center justify-center space-x-1.5 ${
                                    isOutOfStock || isMaxInCart
                                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                      : 'bg-fantasy-gold hover:bg-fantasy-goldHover text-fantasy-dark shadow-md'
                                  }`}
                                >
                                  <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                                  <span>{isMaxInCart ? 'Max in Cart' : isOutOfStock ? 'Out of Stock' : isFoodItem ? 'Order Meal' : 'Add to Cart'}</span>
                                </button>

                                {/* Unified Secondary Action Group */}
                                <div className="flex items-center bg-slate-950/90 border border-slate-800 rounded-xl p-0.5 space-x-0.5">
                                  {!isFoodItem && !isOutOfStock && (
                                    <button
                                      onClick={() => {
                                        setHaggleModalItem(item);
                                        setItemHaggleResult(null);
                                        setHagglePhysicalD20('');
                                      }}
                                      className="px-2.5 py-1.5 rounded-lg hover:bg-amber-950/70 text-amber-300 transition flex items-center justify-center"
                                      title="Haggle / Barter price with merchant (d20)"
                                    >
                                      <span className="text-sm leading-none" role="img" aria-label="Haggle">🤝</span>
                                    </button>
                                  )}

                                  {!isFoodItem && !isOutOfStock && (
                                    <button
                                      onClick={() => {
                                        if (suspiciousShops[venueName]) {
                                          alert('Staff is watching you like a hawk after your earlier clumsy fumble. Shoplifting is impossible in this shop today!');
                                          return;
                                        }
                                        setHeistModalItem(item);
                                        setHeistPhase(1);
                                        setHeistResult(null);
                                        setHeistMidRoll(false);
                                      }}
                                      disabled={Boolean(suspiciousShops[venueName])}
                                      className={`px-2.5 py-1.5 rounded-lg transition ${
                                        suspiciousShops[venueName]
                                          ? 'text-slate-600 cursor-not-allowed opacity-50'
                                          : 'text-slate-400 hover:bg-rose-950/80 hover:text-rose-300'
                                      }`}
                                      title={suspiciousShops[venueName] ? 'Staff is watching you closely' : 'Attempt Five-Finger Discount (3-Phase Heist)'}
                                    >
                                      <Hand className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => setInspectingItem(item)}
                                    className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-fantasy-gold transition"
                                    title="Inspect Full Lore & +1/+2/+3 Upgrades"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>
            ) : (
            /* SELL & APPRAISAL COUNTER MODE */
            <div className="bg-fantasy-card border border-fantasy-border rounded-xl p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-fantasy-border pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-fantasy-gold block">
                    {selectedVenue['Shop Name']} • Liquidation Desk
                  </span>
                  <h3 className="text-xl font-black text-white tracking-wide">Pawn & Appraisal Counter</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sell salvaged weapons, armor, gems, and homebrew loot to {selectedVenue['Proprietor / Staff'].split(' - ')[0]}.
                  </p>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
                  <span className="text-slate-400 text-[11px] block font-semibold">Ward Pawn Rates:</span>
                  <span className="font-bold text-fantasy-gold block">
                    {selectedWard === 'Field' ? '35% Arms/Armor • 70% Gems (Scrap rate)' :
                     selectedWard === 'Dock' ? '40% Arms/Armor • 85% Gems (Salvage rate)' :
                     selectedWard === 'Trades' || selectedWard === 'South' ? '50% Arms/Armor • 100% Gems (Guild Standard)' :
                     selectedWard === 'Castle' || selectedWard === 'North' ? '60% Arms/Armor • 100% Gems (Certified Steel)' :
                     selectedWard === 'Sea' ? '70% Fine Arms • 110% Gems (Luxury Consignment)' :
                     selectedWard === 'Skullport' ? '45% Equipment • 85% Gems (No Questions Asked)' :
                     '50% Standard Rate'}
                  </span>
                </div>
              </div>

              {/* Item Selector & Smart Search */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Select Item from Inventory or Search {(data?.items?.length || 2159).toLocaleString()} D&D Beyond Catalog Items:</span>
                  <button
                    onClick={() => { setCustomItemMode(!customItemMode); setAppraisalItem(null); setAppraisalRollResult(null); }}
                    className="text-xs font-bold text-fantasy-gold hover:underline flex items-center space-x-1"
                  >
                    <span>{customItemMode ? '← Search Database Items' : '+ Appraise Custom / Homebrew Item'}</span>
                  </button>
                </div>

                {!customItemMode ? (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Type item name to sell (e.g. 'plate', 'shortsword', 'ruby', 'potion')..."
                      value={sellSearch}
                      onChange={(e) => setSellSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-fantasy-gold"
                    />
                    {sellSearch.trim().length > 1 && (
                      <div className="absolute top-full left-0 right-0 z-20 mt-1 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl max-h-56 overflow-y-auto divide-y divide-slate-800">
                        {(data.items || [])
                          .filter(it => (it['Item Name'] || '').toLowerCase().includes(sellSearch.toLowerCase()))
                          .slice(0, 10)
                          .map((it, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setAppraisalItem({
                                  name: it['Item Name'],
                                  category: it['Category'] || 'Gear',
                                  rarity: it['Rarity'] || 'Common',
                                  cost: it['Base Cost'] || '10 gp',
                                  weight: it['Weight (lbs)'] || '1',
                                  isCustom: false
                                });
                                setSellSearch('');
                                setAppraisalRollResult(null);
                              }}
                              className="p-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-white block">{it['Item Name']}</span>
                                <span className="text-[10px] text-slate-400">{it['Category']} • {it['Rarity']}</span>
                              </div>
                              <span className="font-bold text-fantasy-gold">{it['Base Cost']}</span>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Custom Item Form */
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Custom Item Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Goblin Chief's Horn"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Estimated Base Value (GP)</label>
                      <input
                        type="number"
                        placeholder="50"
                        value={customBaseCost}
                        onChange={(e) => setCustomBaseCost(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">Item Category</label>
                      <select
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs"
                      >
                        <option value="Weapon">Weapon / Blade</option>
                        <option value="Armor">Armor / Shield</option>
                        <option value="Gem">Gemstone / Jewelry / Art</option>
                        <option value="Magic">Magic Item / Curio</option>
                        <option value="Scrap">Mundane Scrap / Pelt</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <button
                        onClick={() => {
                          if (!customName.trim()) { alert('Please enter an item name'); return; }
                          setAppraisalItem({
                            name: customName,
                            category: customCategory,
                            rarity: 'Custom',
                            cost: `${customBaseCost || 10} gp`,
                            weight: '1',
                            isCustom: true
                          });
                          setAppraisalRollResult(null);
                        }}
                        className="px-4 py-2 bg-fantasy-gold text-fantasy-dark font-bold text-xs rounded hover:bg-fantasy-goldHover transition"
                      >
                        Lock In Custom Item for Appraisal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Appraisal & Pawn Worktable */}
              {appraisalItem && (
                <div className="bg-slate-900 border-2 border-slate-700 p-5 rounded-2xl space-y-4">
                  <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-fantasy-gold block">
                        Item on the Scale
                      </span>
                      <h4 className="text-lg font-black text-white">{appraisalItem.name}</h4>
                      <span className="text-xs text-slate-400">{appraisalItem.category} • Base Value: {appraisalItem.cost}</span>
                    </div>
                    <button onClick={() => setAppraisalItem(null)} className="text-slate-500 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Condition Selector */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
                    <span className="text-slate-400 font-semibold">Physical Condition:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setItemCondition('mint'); setAppraisalRollResult(null); }}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition ${itemCondition === 'mint' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
                      >
                        ✨ Flawless (+10%)
                      </button>
                      <button
                        onClick={() => { setItemCondition('standard'); setAppraisalRollResult(null); }}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition ${itemCondition === 'standard' ? 'bg-amber-950 text-amber-300 border border-amber-600' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
                      >
                        🛡️ Standard (0%)
                      </button>
                      <button
                        onClick={() => { setItemCondition('damaged'); setAppraisalRollResult(null); }}
                        className={`px-3 py-1 rounded-md text-xs font-bold transition ${itemCondition === 'damaged' ? 'bg-rose-950 text-rose-300 border border-rose-600' : 'bg-slate-900 text-slate-400 border border-slate-800'}`}
                      >
                        ⚔️ Battle-Notched (-20%)
                      </button>
                    </div>
                  </div>

                  {/* Magic Enhancement Level (+1, +2, +3) */}
                  {isEnchantableItem(appraisalItem) && (
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                        Magical Tempering & Rune Bonus (+1, +2, +3)
                      </span>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { lvl: 0, lbl: '+0 Standard' },
                          { lvl: 1, lbl: '+1 (+500 GP)' },
                          { lvl: 2, lbl: '+2 (+4k GP)' },
                          { lvl: 3, lbl: '+3 (+16k GP)' },
                        ].map(e => (
                          <button
                            key={e.lvl}
                            onClick={() => { setAppraisalEnchantGrade(e.lvl); setAppraisalRollResult(null); }}
                            className={`py-1.5 px-2 text-xs font-bold rounded-lg transition border ${
                              appraisalEnchantGrade === e.lvl
                                ? 'bg-fantasy-gold text-fantasy-dark border-fantasy-gold shadow'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
                            }`}
                          >
                            {e.lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Calculations */}
                  {(() => {
                    const enchBonus = isEnchantableItem(appraisalItem) ? (appraisalEnchantGrade === 1 ? 500 : appraisalEnchantGrade === 2 ? 4000 : appraisalEnchantGrade === 3 ? 16000 : 0) : 0;
                    const baseGold = parseGoldValue(appraisalItem.cost) + enchBonus;
                    const isGem = appraisalItem.category.includes('Gem') || appraisalItem.name.toLowerCase().includes('ruby') || appraisalItem.name.toLowerCase().includes('diamond') || appraisalItem.name.toLowerCase().includes('emerald');
                    const wardRate = getLiquidationRate(selectedVenue['Socioeconomic Tier'], isGem);
                    const condMod = itemCondition === 'mint' ? 1.10 : itemCondition === 'damaged' ? 0.80 : 1.00;
                    const appraisalBonusPercent = appraisalRollResult ? (appraisalRollResult.bonusPct / 100.0) : 0;
                    
                    const finalRate = Math.max(0.1, (wardRate * condMod) + appraisalBonusPercent);
                    const finalOffer = Math.max(1, Math.round(baseGold * finalRate));

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Base Value</span>
                            <span className="font-bold text-white text-sm">{baseGold} GP</span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Ward Pawn Rate</span>
                            <span className="font-bold text-fantasy-gold text-sm">{Math.round(wardRate * 100)}%</span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Appraisal Bonus</span>
                            <span className="font-bold text-emerald-400 text-sm">+{appraisalRollResult ? appraisalRollResult.bonusPct : 0}%</span>
                          </div>
                          <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                            <span className="text-[10px] text-slate-500 block">Merchant Offer</span>
                            <span className="font-black text-emerald-300 text-base">{finalOffer} GP</span>
                          </div>
                        </div>

                        {/* Interactive Appraisal Check (Player View: Skill Selection Only | DM View: DCs & Roleplay Prompts) */}
                        <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-white block">Select Skill for Appraisal Roll:</span>
                              {dmMode && (
                                <span className="text-[10px] text-amber-300 font-mono">
                                  DM Targets: DC 15 (+15% Offer) • DC 10 (+5% Offer) • Nat 20 (+25%) • Nat 1 (-10%)
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {['Investigation (Int)', 'History (Int)', 'Arcana (Int)', "Artisan's Tools"].map(sk => (
                                <button
                                  key={sk}
                                  onClick={() => setAppraisalSkillChoice(sk)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                                    appraisalSkillChoice === sk
                                      ? 'bg-amber-950/60 border-fantasy-gold text-fantasy-gold'
                                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                                  }`}
                                >
                                  {sk}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-900">
                            <span className="text-[10px] text-slate-400 font-semibold">Phys d20:</span>
                            <input
                              type="number"
                              placeholder="Roll"
                              value={appraisalPhysicalD20}
                              onChange={(e) => setAppraisalPhysicalD20(e.target.value)}
                              className="w-14 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center font-bold text-fantasy-gold text-xs"
                              title="Enter physical d20 roll from table, or leave blank to roll in app"
                            />
                            <span className="text-[10px] text-slate-400 font-semibold">Mod:</span>
                            <input
                              type="number"
                              value={appraisalBonus}
                              onChange={(e) => setAppraisalBonus(parseInt(e.target.value) || 0)}
                              className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center font-bold text-white text-xs"
                            />
                            <button
                              onClick={() => {
                                const rawDie = appraisalPhysicalD20 ? parseInt(appraisalPhysicalD20) : Math.floor(Math.random() * 20) + 1;
                                const d20 = Math.max(1, Math.min(20, rawDie));
                                const tot = d20 + (parseInt(appraisalBonus) || 0);
                                let bonusPct = 0;
                                let playerMsg = '';
                                let dmPrompt = '';
                                if (d20 === 20) {
                                  bonusPct = 25;
                                  playerMsg = 'Appraisal Modifier: +25%';
                                  dmPrompt = 'Examine hallmark with magnifying loupe, nod with respect at authentic provenance, raise offer by 25%.';
                                  confetti({ particleCount: 70, spread: 60 });
                                } else if (d20 === 1) {
                                  bonusPct = -10;
                                  playerMsg = 'Appraisal Modifier: -10%';
                                  dmPrompt = 'Point out structural blemish or worn maker mark, shake head skeptically, trim offer by 10%.';
                                } else if (tot >= 15) {
                                  bonusPct = 15;
                                  playerMsg = 'Appraisal Modifier: +15%';
                                  dmPrompt = 'Weigh item on brass scale, acknowledge solid craftsmanship, add 15% margin.';
                                } else if (tot >= 10) {
                                  bonusPct = 5;
                                  playerMsg = 'Appraisal Modifier: +5%';
                                  dmPrompt = 'Give brief nod at serviceable condition, add 5% to baseline rate.';
                                } else {
                                  bonusPct = 0;
                                  playerMsg = 'Appraisal Modifier: +0% (Base Rate)';
                                  dmPrompt = 'Shrug indifferently, tap standard guild ledger rate without budging.';
                                }

                                if (!dmMode && rollResolutionMode === 'approval') {
                                  submitPendingCheck({
                                    player: activePlayer,
                                    checkType: 'Pawn Appraisal',
                                    skillName: appraisalSkillChoice,
                                    d20,
                                    mod: parseInt(appraisalBonus) || 0,
                                    total: tot,
                                    dc: 15,
                                    venueName,
                                    itemName: appraisalItem.name,
                                    dmPrompt,
                                    dmConsequence: playerMsg
                                  });
                                  setAppraisalRollResult({ d20, tot, bonusPct: 0, playerMsg: `Rolled ${tot} (${appraisalSkillChoice}) — Sent to DM for adjudication`, dmPrompt });
                                } else {
                                  setAppraisalRollResult({ d20, tot, bonusPct, playerMsg, dmPrompt });
                                }
                              }}
                              className="px-3.5 py-1.5 bg-fantasy-gold text-fantasy-dark font-black text-xs rounded hover:bg-fantasy-goldHover transition shadow flex items-center space-x-1"
                            >
                              <Dices className="w-3.5 h-3.5" />
                              <span>Roll {appraisalSkillChoice.split(' ')[0]}</span>
                            </button>
                          </div>
                        </div>

                        {appraisalRollResult && (
                          <div className="bg-slate-950 p-3 rounded-lg border border-emerald-900/50 text-xs space-y-1">
                            <div className="text-emerald-300 font-bold">
                              🎲 Roll: {appraisalRollResult.d20} + {appraisalBonus} = {appraisalRollResult.tot} ({appraisalSkillChoice}) • {appraisalRollResult.playerMsg}
                            </div>
                            {dmMode && appraisalRollResult.dmPrompt && (
                              <div className="text-[11px] text-amber-200/90 pt-1 border-t border-slate-800">
                                <strong className="uppercase text-amber-400">[DM Roleplay Prompt]:</strong> {appraisalRollResult.dmPrompt}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Accept Offer Action */}
                        <div className="pt-2">
                          <button
                            onClick={() => {
                              alert(`💰 Transaction Complete! ${selectedVenue['Proprietor / Staff'].split(' - ')[0]} hands over ${finalOffer} GP in polished trade coin for ${appraisalItem.name}.`);
                              setSoldHistory(prev => [{ name: appraisalItem.name, payout: finalOffer, date: `Day ${daySeed}` }, ...prev]);
                              setAppraisalItem(null);
                              setAppraisalRollResult(null);
                              confetti({ particleCount: 100, spread: 70 });
                            }}
                            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-slate-950 font-black text-sm uppercase tracking-wide rounded-xl shadow-lg transition flex items-center justify-center space-x-2"
                          >
                            <Coins className="w-5 h-5" />
                            <span>Accept Offer: Sell for {finalOffer} GP</span>
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Sold Goods Ledger */}
              {soldHistory.length > 0 && (
                <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Today's Pawn Ledger:</span>
                  <div className="space-y-1.5 text-xs">
                    {soldHistory.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-300 border-b border-slate-800/40 pb-1">
                        <span>✓ Sold <strong>{s.name}</strong></span>
                        <span className="font-bold text-fantasy-gold">+{s.payout} GP</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        )}
          </>
        )}
      </main>

      {/* MODAL 1: Behind-the-Counter Vault Access Modal (Player View: Skill Selection Only | DM View: DCs, Prompts & Consequences) */}
      {vaultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-fantasy-card border border-fantasy-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-fantasy-border mb-4">
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5 text-fantasy-gold" />
                <h3 className="font-bold text-lg text-white">Behind the Counter Vault Check</h3>
              </div>
              <button onClick={() => { setVaultModalOpen(false); setPendingNotice(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {dmMode && (() => {
              const prof = getProprietorArchetypeProfile(selectedVenue?.['Socioeconomic Tier'], selectedVenue);
              return (
                <div className="bg-amber-950/30 border border-amber-700/50 p-3.5 rounded-xl mb-4 text-xs text-amber-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="uppercase text-amber-400">🧠 DM Proprietor Psychology: {prof.label}</strong>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{prof.summary}</p>
                  <div className="pt-1 text-[10px] text-emerald-300"><strong>✓ Rewards:</strong> {prof.favored}</div>
                  <div className="text-[10px] text-rose-300"><strong>✗ Resists / Backfires:</strong> {prof.hated}</div>
                </div>
              );
            })()}

            <div className="space-y-3 mb-5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {dmMode ? 'Select Skill & Review DM Target Matrix:' : 'Select Skill to Roll:'}
              </span>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {getTacticalApproaches(selectedVenue?.['Socioeconomic Tier'], true, selectedVenue).map((appr) => {
                  const isSelected = selectedVaultApproach === appr.id;
                  return (
                    <div
                      key={appr.id}
                      onClick={() => setSelectedVaultApproach(appr.id)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-950/40 border-fantasy-gold shadow-md' 
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-white">
                        <span className={isSelected ? 'text-fantasy-gold' : 'text-slate-200'}>
                          {dmMode ? appr.title : appr.playerSkill}
                        </span>
                        {dmMode && (
                          <span className="text-fantasy-gold font-mono font-black text-xs">DC {appr.dc}</span>
                        )}
                      </div>
                      {dmMode && (
                        <>
                          <p className="text-[11px] text-slate-300 leading-snug mt-1">
                            <strong className="text-amber-300">[DM Prompt]:</strong> {appr.desc}
                          </p>
                          <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-rose-300">
                            <strong className="uppercase">⚠️ [Failure Consequence]:</strong> {appr.penalty}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* In-App Vault Dice Roller */}
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Roll Selected Skill Check:</span>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Phys d20"
                    value={vaultPhysicalD20}
                    onChange={(e) => setVaultPhysicalD20(e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-center text-xs font-bold text-fantasy-gold"
                    title="Enter physical d20 roll from table or leave blank to roll in app"
                  />
                  <div className="flex items-center space-x-1 bg-slate-900 px-2.5 py-2 rounded-lg border border-slate-700 text-xs">
                    <span className="text-slate-400 font-mono text-[10px]">Mod:</span>
                    <input
                      type="number"
                      value={skillMod}
                      onChange={(e) => setSkillMod(parseInt(e.target.value, 10) || 0)}
                      className="w-8 bg-transparent text-center font-bold text-white focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const approaches = getTacticalApproaches(selectedVenue?.['Socioeconomic Tier'], true, selectedVenue);
                      const chosen = approaches.find(a => a.id === selectedVaultApproach) || approaches[0];
                      const d20 = vaultPhysicalD20 ? parseInt(vaultPhysicalD20, 10) : Math.floor(Math.random() * 20) + 1;
                      const total = d20 + (parseInt(skillMod, 10) || 0);
                      const pass = d20 === 20 || total >= chosen.dc;

                      if (!dmMode && rollResolutionMode === 'approval') {
                        submitPendingCheck({
                          player: activePlayer,
                          checkType: 'Vault Access',
                          skillName: chosen.playerSkill,
                          d20,
                          mod: parseInt(skillMod, 10) || 0,
                          total,
                          dc: chosen.dc,
                          venueName,
                          dmPrompt: chosen.desc,
                          dmConsequence: chosen.penalty
                        });
                        setPendingNotice(`🎲 Rolled ${total} (d20: ${d20} + ${skillMod}) on ${chosen.playerSkill} — Sent to DM for adjudication.`);
                        return;
                      }
                      
                      if (chosen.isBackfireTrap && total >= chosen.dc) {
                        lockOutVault(venueName);
                        if (banPlayerFromVenue) banPlayerFromVenue(venueName, activePlayer);
                        addActivityLog({
                          player: activePlayer,
                          action: '🚨 Watch Called / Ejected',
                          details: `Rolled ${total} on ${chosen.playerSkill} at ${venueName} — Proprietor recognized the threat display, summoned the City Watch / Temple Guardians, and banned ${activePlayer}!`
                        });
                        alert(`🚨 WATCH SUMMONED! Rolling ${total} (DC ${chosen.dc}) on ${chosen.playerSkill} caused the proprietor at ${venueName} to take your threat display seriously—they pulled the alarm cord, notified the City Watch, locked down the vault, and kicked you out!`);
                        setVaultModalOpen(false);
                        setPendingNotice(null);
                      } else if (pass && !chosen.isBackfireTrap) {
                        unlockVault(venueName);
                        addActivityLog({ player: activePlayer, action: 'Vault Unlocked', details: `Rolled ${total} (${chosen.playerSkill}) at ${venueName}` });
                        setVaultModalOpen(false);
                        setPendingNotice(null);
                        confetti({ particleCount: 80, spread: 70 });
                      } else {
                        lockOutVault(venueName);
                        addActivityLog({ player: activePlayer, action: 'Vault Lockout', details: `Rolled ${total} (${chosen.playerSkill}) at ${venueName}` });
                        setVaultModalOpen(false);
                        setPendingNotice(null);
                      }
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow transition flex items-center justify-center space-x-1"
                  >
                    <Dices className="w-4 h-4" />
                    <span>Roll Skill Check</span>
                  </button>
                </div>

                {pendingNotice && (
                  <div className="p-2.5 rounded-lg bg-sky-950/70 border border-sky-600 text-xs text-sky-200 font-semibold">
                    {pendingNotice}
                  </div>
                )}
              </div>
            </div>

            {/* DM Direct Override Buttons (DM View Only) */}
            {dmMode && (
              <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">DM Direct Override:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      unlockVault(venueName);
                      setVaultModalOpen(false);
                      confetti({ particleCount: 70, spread: 60 });
                    }}
                    className="flex-1 py-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold text-xs border border-emerald-700"
                  >
                    ✓ Unlock Vault
                  </button>
                  <button
                    onClick={() => {
                      lockOutVault(venueName);
                      setVaultModalOpen(false);
                    }}
                    className="flex-1 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-xs border border-rose-800"
                  >
                    ✗ Lock Out Vault
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: 3-Phase Shoplifting Heist Modal (Player View: Skill Selection & Roll Only | DM View: DCs, Prompts & Overrides) */}
      {heistModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-fantasy-card border border-fantasy-border rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-fantasy-border mb-4">
              <div className="flex items-center space-x-2">
                <Hand className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-base text-white">Five-Finger Discount</h3>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-xs">
                  <span className="text-slate-400 text-[10px]">Actor:</span>
                  <select
                    value={heistActingPlayer || activePlayer}
                    onChange={(e) => setHeistActingPlayer(e.target.value)}
                    className="bg-transparent text-amber-300 font-bold text-xs focus:outline-none"
                  >
                    {partyMembers.map(p => (
                      <option key={p} value={p} className="bg-slate-900 text-white">{p}</option>
                    ))}
                  </select>
                </div>
                <button onClick={() => { setHeistModalItem(null); setPendingNotice(null); }} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Phase Tracker Stepper */}
            <div className="flex items-center justify-between mb-4 px-2">
              <div className={`flex items-center space-x-1 text-xs font-bold ${heistPhase >= 1 ? 'text-fantasy-gold' : 'text-slate-600'}`}>
                <span>Phase 1</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <div className={`flex items-center space-x-1 text-xs font-bold ${heistPhase >= 2 ? 'text-fantasy-gold' : 'text-slate-600'}`}>
                <span>Phase 2</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <div className={`flex items-center space-x-1 text-xs font-bold ${heistPhase >= 3 ? 'text-fantasy-gold' : 'text-slate-600'}`}>
                <span>Phase 3</span>
              </div>
            </div>

            {(() => {
              const phaseSkills = heistPhase === 1
                ? ['Perception (Wisdom)', 'Investigation (Intelligence)', 'Insight (Wisdom)']
                : heistPhase === 2
                ? ['Sleight of Hand (Dexterity)', 'Stealth (Dexterity)']
                : ['Deception (Charisma)', 'Performance (Charisma)', 'Stealth (Dexterity)'];
              const activeHeistSkill = phaseSkills.includes(heistSkillChoice) ? heistSkillChoice : phaseSkills[0];
              const phaseDc = heistPhase === 1 ? 14 : heistPhase === 2 ? 16 : 16;
              const dmPhasePrompt = heistPhase === 1
                ? 'Survey sightlines, track clerk patrol rhythm, identify blind spots near display counter.'
                : heistPhase === 2
                ? 'Slip item into cloak lining silently without clinking metal or disturbing adjacent stock.'
                : 'Maintain relaxed posture, cross threshold smoothly without arousing doorkeeper suspicion.';
              const dmPhaseConsequence = heistPhase === 1
                ? 'Fail (< DC 14): Clerk notices lingering gaze; opportunity aborted without alarm.'
                : heistPhase === 2
                ? 'Fail (< DC 16): Item shifts noisily; staff goes on high alert and blocks further heist attempts today.'
                : 'DC 16+: Clean 0 gp getaway | DC 12-15: Questioned at door (put back or pay +25% surcharge) | < DC 12: Caught red-handed, actor banned & vault locked.';

              return (
                <div className="space-y-4">
                  {/* Skill Selection List (Strictly Skill Names Only in Player View) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Select Skill for Phase {heistPhase}:
                    </span>
                    <div className="grid grid-cols-1 gap-1.5 text-xs">
                      {phaseSkills.map(sk => (
                        <button
                          key={sk}
                          onClick={() => setHeistSkillChoice(sk)}
                          className={`p-2.5 rounded-xl border text-left font-bold transition flex items-center justify-between ${
                            activeHeistSkill === sk
                              ? 'bg-rose-950/40 border-rose-500 text-rose-200'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span>{sk}</span>
                          {dmMode && <span className="text-fantasy-gold font-mono text-xs">DC {phaseDc}</span>}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* DM Roleplay Prompt & Consequence Box (DM View Only) */}
                  {dmMode && (
                    <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-xs space-y-1.5">
                      <p className="text-slate-300">
                        <strong className="text-amber-300 uppercase">[DM Prompt]:</strong> {dmPhasePrompt}
                      </p>
                      <p className="text-rose-300 text-[11px] pt-1 border-t border-slate-800">
                        <strong className="uppercase">⚠️ [Thresholds]:</strong> {dmPhaseConsequence}
                      </p>
                    </div>
                  )}

                  {/* Dice Roll Bar */}
                  {!heistMidRoll && (
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          placeholder="Phys d20"
                          value={heistPhysicalD20}
                          onChange={(e) => setHeistPhysicalD20(e.target.value)}
                          className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-center text-xs font-bold text-fantasy-gold"
                        />
                        <div className="flex items-center space-x-1 bg-slate-900 px-2.5 py-2 rounded-lg border border-slate-700 text-xs">
                          <span className="text-slate-400 font-mono text-[10px]">Mod:</span>
                          <input
                            type="number"
                            value={skillMod}
                            onChange={(e) => setSkillMod(parseInt(e.target.value, 10) || 0)}
                            className="w-8 bg-transparent text-center font-bold text-white focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => {
                            const d20 = heistPhysicalD20 ? parseInt(heistPhysicalD20, 10) : Math.floor(Math.random() * 20) + 1;
                            const total = d20 + (parseInt(skillMod, 10) || 0);
                            const actor = heistActingPlayer || activePlayer;
                            setHeistPhysicalD20('');

                            if (!dmMode && rollResolutionMode === 'approval') {
                              submitPendingCheck({
                                player: actor,
                                checkType: heistPhase === 3 ? 'Heist Walk-Out' : `Heist Phase ${heistPhase}`,
                                skillName: activeHeistSkill,
                                d20,
                                mod: parseInt(skillMod, 10) || 0,
                                total,
                                dc: phaseDc,
                                venueName,
                                itemName: heistModalItem['Item Name'],
                                dmPrompt: dmPhasePrompt,
                                dmConsequence: dmPhaseConsequence
                              });
                              setPendingNotice(`🎲 Rolled ${total} on ${activeHeistSkill} — Sent to DM for adjudication.`);
                              return;
                            }

                            if (heistPhase === 1) {
                              if (d20 === 20 || total >= 14) {
                                setHeistPhase(2);
                                setHeistSkillChoice('Sleight of Hand (Dexterity)');
                              } else {
                                addActivityLog({ player: actor, action: 'Heist Aborted (Phase 1)', details: `Rolled ${total} on ${activeHeistSkill} at ${venueName}` });
                                setHeistModalItem(null);
                              }
                            } else if (heistPhase === 2) {
                              if (d20 === 20 || total >= 16) {
                                setHeistPhase(3);
                                setHeistSkillChoice('Deception (Charisma)');
                              } else {
                                setSuspiciousShops(prev => ({ ...prev, [venueName]: true }));
                                addActivityLog({ player: actor, action: 'Heist Fumbled (Phase 2)', details: `Rolled ${total} on ${activeHeistSkill} at ${venueName} — Staff alerted` });
                                setHeistModalItem(null);
                              }
                            } else {
                              if (d20 === 20 || total >= 16) {
                                addToCart({
                                  name: `[Stolen] ${heistModalItem['Item Name']}`,
                                  cost: '0 gp',
                                  weight: heistModalItem['Weight (lbs)'] || '0.5',
                                  maxStock: 1,
                                  tier: selectedVenue['Socioeconomic Tier'],
                                  shopper: actor
                                }, venueName, 1);
                                addActivityLog({ player: actor, action: 'Heist Succeeded!', details: `Stole ${heistModalItem['Item Name']} (Rolled ${total}) at ${venueName}` });
                                setHeistModalItem(null);
                                confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
                              } else if (d20 !== 1 && total >= 12) {
                                setHeistMidRoll(true);
                              } else {
                                banPlayerFromVenue(venueName, actor);
                                lockOutVault(venueName);
                                addActivityLog({
                                  player: actor,
                                  action: 'Heist Caught!',
                                  details: `Caught stealing ${heistModalItem['Item Name']} (Rolled ${total}) at ${venueName}. Banned!`
                                });
                                setHeistModalItem(null);
                              }
                            }
                          }}
                          className="flex-1 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow transition flex items-center justify-center space-x-1"
                        >
                          <Dices className="w-4 h-4" />
                          <span>Roll Check</span>
                        </button>
                      </div>

                      {pendingNotice && (
                        <div className="p-2 rounded bg-sky-950/70 border border-sky-600 text-xs text-sky-200 font-semibold">
                          {pendingNotice}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mid-Roll Resolution Sub-Menu (Zero scripted dialogue quotes) */}
                  {heistMidRoll && (
                    <div className="bg-slate-900/90 border border-amber-700/60 p-4 rounded-xl space-y-3">
                      <span className="text-xs font-bold text-amber-300 block">
                        Threshold Questioning (Choose Resolution):
                      </span>
                      {dmMode && (
                        <p className="text-[11px] text-slate-300">
                          <strong className="text-amber-400">[DM Prompt]:</strong> Proprietor blocks doorway, eyes bulging sleeve suspiciously, demands immediate return or 25% surcharge payment.
                        </p>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setHeistModalItem(null);
                            setHeistMidRoll(false);
                          }}
                          className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-lg border border-slate-700 transition"
                        >
                          ↩ Return Item to Shelf
                        </button>
                        <button
                          onClick={() => {
                            const baseCost = heistModalItem['Base Cost'];
                            const match = String(baseCost).match(/([\d,]+)\s*(cp|sp|ep|gp|pp)/i);
                            let hikedCost = baseCost;
                            if (match) {
                              const val = parseFloat(match[1].replace(/,/g, '')) * 1.25;
                              hikedCost = `${Math.ceil(val)} ${match[2]}`;
                            }
                            addToCart({
                              name: `${heistModalItem['Item Name']} (+25% Surcharge)`,
                              cost: hikedCost,
                              weight: heistModalItem['Weight (lbs)'] || '0.5',
                              maxStock: 1,
                              tier: selectedVenue['Socioeconomic Tier'],
                              shopper: heistActingPlayer || activePlayer
                            }, venueName, 1);
                            setHeistModalItem(null);
                            setHeistMidRoll(false);
                          }}
                          className="flex-1 py-2 bg-amber-950 hover:bg-amber-900 text-amber-300 font-bold text-xs rounded-lg border border-amber-700 transition"
                        >
                          💰 Pay +25% Surcharge
                        </button>
                      </div>
                    </div>
                  )}

                  {/* DM Manual Phase Override Controls */}
                  {dmMode && !heistMidRoll && (
                    <div className="pt-2 border-t border-slate-800 flex gap-2">
                      <button
                        onClick={() => {
                          if (heistPhase < 3) setHeistPhase(heistPhase + 1);
                          else {
                            addToCart({
                              name: `[Stolen] ${heistModalItem['Item Name']}`,
                              cost: '0 gp',
                              weight: heistModalItem['Weight (lbs)'] || '0.5',
                              maxStock: 1,
                              tier: selectedVenue['Socioeconomic Tier'],
                              shopper: heistActingPlayer || activePlayer
                            }, venueName, 1);
                            setHeistModalItem(null);
                          }
                        }}
                        className="flex-1 py-1.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-bold"
                      >
                        DM: Force Pass Phase {heistPhase}
                      </button>
                      <button
                        onClick={() => {
                          const caughtActor = heistActingPlayer || activePlayer;
                          banPlayerFromVenue(venueName, caughtActor);
                          lockOutVault(venueName);
                          setHeistModalItem(null);
                        }}
                        className="flex-1 py-1.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-bold"
                      >
                        DM: Force Catch & Ban
                      </button>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 3: Item Inspection & Lore Modal */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-fantasy-card border-2 border-fantasy-border rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Header */}
            {(() => {
              const isEnch = isEnchantableItem(inspectingItem);
              const { enchantedName, enchantedCost, enchantedRarity, bonusText } = isEnch 
                ? getEnchantedItemDetails(inspectingItem, itemEnchantGrade)
                : { enchantedName: inspectingItem['Item Name'], enchantedCost: inspectingItem['Base Cost'], enchantedRarity: inspectingItem['Rarity'], bonusText: '' };
              
              return (
                <div>
                  <div className="flex items-start justify-between pb-3.5 border-b border-fantasy-border mb-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-1.5 flex-wrap gap-y-1">
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                          enchantedRarity === 'Legendary' ? 'bg-amber-950/80 text-amber-300 border-amber-600' :
                          enchantedRarity === 'Very Rare' ? 'bg-purple-950/80 text-purple-300 border-purple-700' :
                          enchantedRarity === 'Rare' ? 'bg-blue-950/80 text-blue-300 border-blue-700' :
                          enchantedRarity === 'Uncommon' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700' :
                          Boolean(inspectingItem['Contraband']) ? 'bg-rose-950/80 text-rose-300 border-rose-700' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {enchantedRarity || 'Common'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {inspectingItem['Category'] || 'Item'} • {inspectingItem['Subcategory'] || 'General'}
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-white tracking-wide">{enchantedName}</h3>
                    </div>
                    <button 
                      onClick={() => { setInspectingItem(null); setItemEnchantGrade(0); }} 
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Quality & Magic Enchantment Selector (+1, +2, +3) */}
                  {isEnch && (
                    <div className="bg-slate-900 border border-fantasy-border p-3.5 rounded-xl mb-4 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-fantasy-gold uppercase tracking-wider flex items-center space-x-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-fantasy-gold" />
                          <span>Magical Enhancement & Rune Grade</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Select grade (+1, +2, +3)</span>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[
                          { level: 0, label: '+0 Standard', costDesc: 'Base' },
                          { level: 1, label: '+1 Enhanced', costDesc: '+500 GP' },
                          { level: 2, label: '+2 Masterwork', costDesc: '+4k GP' },
                          { level: 3, label: '+3 Relic', costDesc: '+16k GP' },
                        ].map(g => (
                          <button
                            key={g.level}
                            onClick={() => setItemEnchantGrade(g.level)}
                            className={`py-1.5 px-1.5 rounded-lg text-center font-bold text-xs transition border flex flex-col items-center ${
                              itemEnchantGrade === g.level
                                ? 'bg-fantasy-gold text-fantasy-dark border-fantasy-gold shadow'
                                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <span>{g.label}</span>
                            <span className="text-[9px] font-normal opacity-80">{g.costDesc}</span>
                          </button>
                        ))}
                      </div>
                      {itemEnchantGrade > 0 && (
                        <p className="text-[11px] text-amber-200/90 italic mt-2.5 bg-amber-950/40 p-2.5 rounded border border-amber-800/40">
                          ✨ {bonusText}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Price & Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900/90 border border-slate-800 p-3 rounded-xl mb-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Price</span>
                <span className="font-bold text-fantasy-gold text-sm">
                  {formatGoldCost(getAdjustedPrice(isEnchantableItem(inspectingItem) ? getEnchantedItemDetails(inspectingItem, itemEnchantGrade).enchantedCost : inspectingItem['Base Cost'], selectedVenue ? selectedVenue['Socioeconomic Tier'] : '3'))}
                </span>
                <span className="text-[10px] text-slate-500 block">Base: {inspectingItem['Base Cost']}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Weight</span>
                <span className="font-bold text-white flex items-center space-x-1 mt-0.5">
                  <Weight className="w-3.5 h-3.5 text-slate-400" />
                  <span>{inspectingItem['Weight (lbs)'] || '0.5'} lbs</span>
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Availability</span>
                <span className="font-bold text-emerald-400 mt-0.5 block">
                  {venueType === 'eateries' ? 'Ready to Serve' : `${inspectingItem.quantity !== undefined ? inspectingItem.quantity : 1} in stock`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Sourcebook</span>
                <span className="font-bold text-slate-300 mt-0.5 block">
                  {inspectingItem['Sourcebook'] || 'D&D 5e'}
                </span>
              </div>
            </div>

            {/* Full Unabridged Properties & Flavor Text */}
            <div className="mb-4">
              <span className="text-[10px] font-bold text-fantasy-gold uppercase tracking-wider block mb-1.5 flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Description & Properties</span>
              </span>
              <div className="bg-slate-900/70 border border-slate-800/80 p-4 rounded-xl text-slate-200 text-xs sm:text-sm leading-relaxed whitespace-pre-line font-serif italic">
                {inspectingItem['Properties / Flavor']}
              </div>
            </div>

            {/* Food Meal Perk Banner (If applicable) */}
            {inspectingItem['Meal Perk / Roleplay Effect'] && inspectingItem['Meal Perk / Roleplay Effect'] !== 'None' && (
              <div className="bg-emerald-950/70 border border-emerald-700/60 p-3 rounded-xl mb-4">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1 mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Meal Roleplay Benefit (Until Next Rest)</span>
                </span>
                <p className="text-xs text-emerald-200/90 leading-normal font-medium">
                  {inspectingItem['Meal Perk / Roleplay Effect']}
                </p>
              </div>
            )}

            {/* Lore & Provenance Tags */}
            <div className="space-y-1.5 mb-5 text-xs bg-slate-900/40 border border-slate-800/60 p-3 rounded-xl">
              <div className="flex items-center justify-between text-slate-400">
                <span>Available at Storefront:</span>
                <span className="text-white font-semibold">
                  {selectedVenue ? (selectedVenue['Shop Name'] || selectedVenue['Eatery Name']) : (inspectingItem['Iconic Storefront'] || 'Waterdeep Vendor')} ({selectedWard ? `${activeWards.find(w => w.id === selectedWard)?.name || selectedWard} Ward` : `${inspectingItem['Waterdeep Ward']} Ward`})
                </span>
              </div>
              {inspectingItem['Iconic Storefront'] && selectedVenue && inspectingItem['Iconic Storefront'] !== (selectedVenue['Shop Name'] || selectedVenue['Eatery Name']) && (
                <div className="flex items-center justify-between text-slate-400">
                  <span>Guild / Artisan Lineage:</span>
                  <span className="text-amber-300 font-medium">
                    Signature of {inspectingItem['Iconic Storefront']}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-400">
                <span>Origin Realm:</span>
                <span className="text-slate-300">{inspectingItem['Origin Realm'] || 'Sword Coast / Toril'}</span>
              </div>
              {inspectingItem['Theme Tags'] && (
                <div className="flex items-start justify-between text-slate-400 pt-1 border-t border-slate-800/60">
                  <span className="shrink-0 mr-2">Theme Tags:</span>
                  <span className="text-amber-300/80 text-right truncate">
                    {inspectingItem['Theme Tags']}
                  </span>
                </div>
              )}
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center space-x-2 pt-3 border-t border-fantasy-border mt-auto">
              <button
                onClick={() => {
                  const isFood = Boolean(selectedVenue?.['Eatery Name'] || selectedVenue?.['Eatery Type'] || venueType === 'eateries');
                  const name = inspectingItem['Item Name'];
                  const baseCost = inspectingItem['Base Cost'];
                  const weight = inspectingItem['Weight (lbs)'] || '0.5';
                  const perk = inspectingItem['Meal Perk / Roleplay Effect'];
                  const maxStock = inspectingItem.quantity !== undefined ? inspectingItem.quantity : 99;
                  const inCartQuantity = cart.find(c => (c.item?.name || c.name) === name)?.quantity || 0;
                  if (maxStock > 0 && inCartQuantity >= maxStock) return;

                  const isEnch = isEnchantableItem(inspectingItem) && itemEnchantGrade > 0;
                  const enchDetails = isEnch ? getEnchantedItemDetails(inspectingItem, itemEnchantGrade) : null;
                  const finalName = enchDetails ? enchDetails.enchantedName : name;
                  const finalCost = enchDetails ? enchDetails.enchantedCost : baseCost;
                  const finalRarity = enchDetails ? enchDetails.enchantedRarity : inspectingItem['Rarity'];

                  addToCart({
                    ...inspectingItem,
                    'Item Name': finalName,
                    'Base Cost': finalCost,
                    'Rarity': finalRarity,
                    name: finalName,
                    cost: finalCost,
                    weight,
                    maxStock,
                    perk: isFood ? perk : null,
                    tier: selectedVenue ? selectedVenue['Socioeconomic Tier'] : '3'
                  }, venueName, maxStock);
                  if (isFood && perk && perk !== 'None') {
                    consumeMeal({ name, location: venueName, ward: selectedWard, perk });
                  }
                  setInspectingItem(null);
                }}
                disabled={(() => {
                  const maxStock = inspectingItem.quantity !== undefined ? inspectingItem.quantity : 99;
                  const inCartQuantity = cart.find(c => (c.item?.name || c.name) === inspectingItem['Item Name'])?.quantity || 0;
                  return maxStock === 0 || (maxStock > 0 && inCartQuantity >= maxStock);
                })()}
                className="flex-1 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wide transition flex items-center justify-center space-x-1.5 bg-fantasy-gold hover:bg-fantasy-goldHover text-fantasy-dark disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed shadow"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>
                  {(() => {
                    const maxStock = inspectingItem.quantity !== undefined ? inspectingItem.quantity : 99;
                    const inCartQuantity = cart.find(c => (c.item?.name || c.name) === inspectingItem['Item Name'])?.quantity || 0;
                    if (maxStock === 0) return 'Out of Stock';
                    if (maxStock > 0 && inCartQuantity >= maxStock) return 'Max in Cart';
                    return venueType === 'eateries' ? 'Order Meal' : 'Add to Cart';
                  })()}
                </span>
              </button>

              {/* Haggle Shortcut from Modal */}
              {venueType === 'shops' && inspectingItem.quantity !== 0 && (
                <button
                  onClick={() => {
                    setHaggleModalItem(inspectingItem);
                    setItemHaggleResult(null);
                    setHagglePhysicalD20('');
                    setInspectingItem(null);
                  }}
                  className="py-2.5 px-3.5 rounded-lg font-bold text-xs bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-fantasy-gold border border-slate-700 transition flex items-center space-x-1"
                  title="Haggle price with merchant on this item (d20)"
                >
                  <span className="text-sm leading-none" role="img" aria-label="Haggle">🤝</span>
                  <span>Haggle</span>
                </button>
              )}

              {/* Shoplift Shortcut from Modal */}
              {venueType === 'shops' && inspectingItem.quantity !== 0 && (
                <button
                  onClick={() => {
                    if (suspiciousShops[venueName]) {
                      alert('Staff is watching you closely today. Shoplifting is blocked in this shop!');
                      return;
                    }
                    const target = inspectingItem;
                    setInspectingItem(null);
                    setHeistModalItem(target);
                    setHeistPhase(1);
                    setHeistResult(null);
                    setHeistMidRoll(false);
                  }}
                  disabled={Boolean(suspiciousShops[venueName])}
                  className="px-3.5 py-2.5 bg-slate-900 hover:bg-rose-950 text-slate-300 hover:text-rose-300 font-bold text-xs rounded-lg border border-slate-800 transition flex items-center space-x-1.5"
                  title="Attempt Five-Finger Discount on this item"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span>Heist</span>
                </button>
              )}

              <button
                onClick={() => setInspectingItem(null)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg border border-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

            {/* MODAL 4: "Ask a Local" Street Oracle Modal */}
      {askLocalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-fantasy-card border-2 border-fantasy-border rounded-2xl max-w-xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-fantasy-border mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-fantasy-gold block mb-0.5">
                  {selectedWard ? `${activeWards.find(w => w.id === selectedWard)?.name} • ` : ''}Street Oracle
                </span>
                <h3 className="text-xl font-black text-white tracking-wide flex items-center space-x-2">
                  <span>Ask a Local for Directions</span>
                </h3>
              </div>
              <button 
                onClick={() => setAskLocalModalOpen(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Select a Local */}
            <div className="mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                1. Approach a Passerby on the Street:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(WARD_LOCALS[selectedWard] || WARD_LOCALS['Trades']).map((npc, idx) => {
                  const isSelected = selectedLocalNpc?.name === npc.name;
                  return (
                    <div
                      key={idx}
                      onClick={() => { setSelectedLocalNpc(npc); setLocalRollResult(null); }}
                      className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-amber-950/40 border-amber-600 shadow' 
                          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className={`font-bold text-xs block ${isSelected ? 'text-fantasy-gold' : 'text-white'}`}>
                          {npc.name}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{npc.role}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 italic mt-1.5 line-clamp-1">
                        {npc.demeanor}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Inquire About Trade / Category */}
            <div className="mb-4 bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl space-y-3">
              <div>
                <span className="text-[10px] font-bold text-fantasy-gold uppercase tracking-wider block mb-1">
                  2. What are you asking for?
                </span>
                <select
                  value={localQueryTrade}
                  onChange={(e) => { setLocalQueryTrade(e.target.value); setLocalRollResult(null); }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-fantasy-gold"
                >
                  <option value="Weapons">⚔️ Masterwork Blades, Swords & Weaponsmiths</option>
                  <option value="Armor">🛡️ Plate Armor, Shields & Armorers</option>
                  <option value="Apothecary">🧪 Potions, Healing Salves & Rare Herbs</option>
                  <option value="Arcane">📜 Spell Scrolls, Wands & High Arcana</option>
                  <option value="Outfitters">🎒 Adventuring Gear, Rope & Exploration Packs</option>
                  <option value="Stables">🐴 Horses, Caravan Wagons & Pack Saddles</option>
                  <option value="Jewelers">💎 Fine Jewelry, Gemstones & Signet Rings</option>
                  <option value="Tailors">🧵 Luxury Silks, Fur Cloaks & Court Clothes</option>
                  <option value="Crafts">🔨 Precision Locksmiths, Glassblowers & Bowyers</option>
                  <option value="BlackMarket">💀 Shady Fences, Poisons & Contraband</option>
                  <option value="Taverns">🍺 Good Food, Strong Ale & Warm Hearth Beds</option>
                </select>
              </div>

              {/* Roll Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-3">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400 text-[11px]">Skill Modifier:</span>
                  <input
                    type="number"
                    value={localRollBonus}
                    onChange={(e) => setLocalRollBonus(parseInt(e.target.value) || 0)}
                    className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-white text-xs"
                  />
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-400 text-[11px]">Physical d20:</span>
                  <input
                    type="number"
                    placeholder="Roll"
                    value={oraclePhysicalD20}
                    onChange={(e) => setOraclePhysicalD20(e.target.value)}
                    className="w-14 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-center font-bold text-fantasy-gold text-xs"
                    title="Enter physical d20 roll from table, or leave blank to roll in app"
                  />
                </div>

                <button
                  onClick={() => {
                    const rawDie = oraclePhysicalD20 ? parseInt(oraclePhysicalD20) : Math.floor(Math.random() * 20) + 1;
                    const d20 = Math.max(1, Math.min(20, rawDie));
                    const total = d20 + (parseInt(localRollBonus) || 0);

                    // TRUE NATURAL 20: Only a raw 20 on the die is a Nat 20 (not 16+4!)
                    const isNat20 = (d20 === 20);
                    const isCritFail = (d20 === 1);
                    const isHigh = !isNat20 && total >= 15;
                    const isMid = !isNat20 && total >= 10 && total < 15;
                    const isLow = !isNat20 && !isCritFail && total < 10;

                    // Match shop by trade
                    const matchingShops = (data.shops || []).filter(s => {
                      const v = s['Primary Vendor Type'] || '';
                      if (localQueryTrade === 'Weapons') return v.includes('Smithy');
                      if (localQueryTrade === 'Armor') return v.includes('Armorer');
                      if (localQueryTrade === 'Apothecary') return v.includes('Apothecary');
                      if (localQueryTrade === 'Arcane') return v.includes('Arcane');
                      if (localQueryTrade === 'Outfitters') return v.includes('Outfitter');
                      if (localQueryTrade === 'Stables') return v.includes('Stablemaster');
                      if (localQueryTrade === 'Jewelers') return v.includes('Jeweler');
                      if (localQueryTrade === 'Tailors') return v.includes('Tailor');
                      if (localQueryTrade === 'Crafts') return v.includes('Locksmith') || v.includes('Woodcarver') || v.includes('Glassblower');
                      if (localQueryTrade === 'BlackMarket') return s.Ward.includes('Skullport') || v.includes('Fence');
                      return true;
                    });

                    const targetShop = matchingShops.length > 0 ? matchingShops[0] : (data.shops || [])[0];

                    // Find vault item for Nat 20
                    let vaultItem = null;
                    if (targetShop) {
                      const shopItems = (data.items || []).filter(it => 
                        it['Iconic Storefront'] === targetShop['Shop Name'] && 
                        ['Rare', 'Very Rare', 'Legendary'].includes(it['Rarity'])
                      );
                      if (shopItems.length > 0) vaultItem = shopItems[0];
                    }

                    // Build outcome
                    let tierName = '';
                    let colorClass = '';
                    let intelText = '';
                    let recommendedShop = targetShop;
                    let recommendedWard = targetShop ? targetShop.Ward : 'Trades';
                    let grantsVaultUnlock = false;

                    let emotion = '';
                    let gesture = '';
                    let intelBullets = [];

                    if (isNat20) {
                      tierName = 'Natural 20 • Master Insider Intel (Vault Secret)';
                      colorClass = 'border-purple-600 bg-purple-950/40 text-purple-200';
                      emotion = 'Secretive, Reverent & Conspiratorial';
                      gesture = 'leans in close, winks knowingly, and checks both shoulders for eavesdroppers';
                      grantsVaultUnlock = true;
                      intelBullets = [
                        `Identifies premier destination: ${targetShop['Shop Name']} (${targetShop.Ward} Ward).`,
                        `Names the proprietor: Ask for ${targetShop['Proprietor / Staff'].split(' - ')[0]}.`,
                        `Reveals back-room secret: They have ${vaultItem ? `a rare ${vaultItem['Item Name']}` : 'legendary relics'} locked in the private safe behind the counter!`,
                        `Roleplay Hook: The local suggests telling the merchant that an insider sent them for the private guild reserve.`
                      ];
                      confetti({ particleCount: 90, spread: 70 });
                    } else if (isHigh) {
                      tierName = 'High Roll (15-19) • Specific Storefront Pointer';
                      colorClass = 'border-emerald-600 bg-emerald-950/40 text-emerald-200';
                      emotion = 'Friendly, Professional & Knowledgeable';
                      gesture = 'nods with genuine appreciation and points out a direct route';
                      intelBullets = [
                        `Directs party straight to ${targetShop['Shop Name']} in ${targetShop.Ward} Ward.`,
                        `Proprietor contact: Look for ${targetShop['Proprietor / Staff'].split(' - ')[0]}.`,
                        `Vibe note: Known for authentic, reliable masterwork stock without filler.`
                      ];
                    } else if (isMid) {
                      tierName = 'Mid Roll (10-14) • Ward & Quarter Direction';
                      colorClass = 'border-blue-600 bg-blue-950/40 text-blue-200';
                      emotion = 'Helpful, Practical & Busy';
                      gesture = 'thinks for a moment, then jerks a thumb toward the city thoroughfares';
                      intelBullets = [
                        `Points the party toward ${targetShop.Ward} Ward.`,
                        `Explains that the guild crafters and merchants for this trade cluster in this quarter.`,
                        `Suggests asking around the local market square once they arrive.`
                      ];
                    } else if (isLow) {
                      tierName = 'Low Roll (5-9) • Clueless or Dubious Rumor';
                      colorClass = 'border-amber-600 bg-amber-950/40 text-amber-200';
                      emotion = 'Baffled, Distracted or Confidently Misinformed';
                      gesture = 'scratches their chin, shrugs, and offers a dubious rumor';
                      const bogusShops = (data.shops || []).filter(s => s['Shop Name'].includes('Fish') || s['Shop Name'].includes('Scrap') || s['Shop Name'].includes('Muddy'));
                      recommendedShop = bogusShops.length > 0 ? bogusShops[0] : targetShop;
                      recommendedWard = recommendedShop.Ward;
                      intelBullets = [
                        `The local has never personally shopped for such high-end goods.`,
                        `Passes along an unverified street rumor pointing toward ${recommendedShop['Shop Name']} in ${recommendedShop.Ward} Ward.`,
                        `Roleplay Hook: Confidently swears someone told them about a secret stash there, even if it makes little sense.`
                      ];
                    } else {
                      tierName = 'Crit Fail (1-4) • Hostile & Annoyed Dismissal';
                      colorClass = 'border-rose-600 bg-rose-950/40 text-rose-200';
                      emotion = 'Furious, Insulted or Paranoiac';
                      gesture = 'glares with intense irritation, clutches their coat, and steps backward';
                      recommendedShop = null;
                      intelBullets = [
                        `Refuses to cooperate: suspects the party of being cutpurses or tax assessors.`,
                        `Hostile dismissal: tells the party to get lost before they call for the City Watch.`,
                        `Zero intelligence gained.`
                      ];
                    }

                    setLocalRollResult({
                      d20,
                      total,
                      tierName,
                      colorClass,
                      emotion,
                      gesture,
                      intelBullets,
                      recommendedShop,
                      recommendedWard,
                      grantsVaultUnlock
                    });
                  }}
                  className="px-4 py-2 bg-fantasy-gold hover:bg-fantasy-goldHover text-fantasy-dark font-black text-xs uppercase tracking-wider rounded-lg shadow transition flex items-center space-x-1.5"
                >
                  <Dices className="w-4 h-4" />
                  <span>Roll d20</span>
                </button>
              </div>
            </div>

            {/* Step 3: Street Oracle Result (Player View: Clean Roll & Lead Button | DM View: Full Roleplay Cues) */}
            {localRollResult && (
              <div className={`border-2 rounded-xl p-4 mb-4 space-y-3 ${dmMode ? localRollResult.colorClass : 'border-slate-700 bg-slate-900 text-slate-200'}`}>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-black text-xs uppercase tracking-wide">
                    {dmMode ? localRollResult.tierName : 'Street Inquiry Roll'}
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-black/40 text-fantasy-gold">
                    Roll: {localRollResult.d20} + {localRollBonus} = {localRollResult.total}
                  </span>
                </div>

                {!dmMode && (
                  <p className="text-xs text-slate-300">
                    🎲 Rolled <strong>{localRollResult.total}</strong>. Your DM describes the passerby's reaction and directions.
                  </p>
                )}

                {dmMode && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-0.5">🎭 Demeanor & Emotion</span>
                        <span className="font-bold text-white text-xs">{localRollResult.emotion}</span>
                      </div>
                      <div className="bg-black/30 p-2.5 rounded-lg border border-white/5">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-0.5">👁️ Physical Tell / Gesture</span>
                        <span className="italic text-slate-300 text-xs">{localRollResult.gesture}</span>
                      </div>
                    </div>

                    <div className="bg-black/40 p-3 rounded-lg border border-white/5 space-y-1.5 text-xs">
                      <span className="text-[10px] font-bold text-fantasy-gold uppercase tracking-wider block mb-1">
                        📜 DM Roleplay Prompts (Verbs & Adjectives)
                      </span>
                      <ul className="space-y-1 text-slate-200 list-disc list-inside leading-relaxed">
                        {localRollResult.intelBullets.map((b, bIdx) => (
                          <li key={bIdx} className="leading-snug">{b}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {localRollResult.recommendedShop && (dmMode || rollResolutionMode === 'trusted') && (
                  <button
                    onClick={() => {
                      const target = localRollResult.recommendedShop;
                      setAskLocalModalOpen(false);
                      const wardId = target.Ward && target.Ward.includes('Skullport') ? 'Skullport' : target.Ward;
                      selectWard(wardId);
                      selectVenue(target);
                      if (localRollResult.grantsVaultUnlock) {
                        unlockVault(target['Shop Name']);
                        confetti({ particleCount: 100, spread: 80 });
                      }
                    }}
                    className="w-full py-2.5 rounded-lg bg-fantasy-gold hover:bg-fantasy-goldHover text-fantasy-dark font-black text-xs uppercase tracking-wider shadow transition flex items-center justify-center space-x-2"
                  >
                    <span>Follow Lead: Enter {localRollResult.recommendedShop['Shop Name']}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 5: Shady Alley Peddler ("Psst... Wanna Buy a Ring?") */}
      {shadyPeddlerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-fantasy-card border-2 border-purple-800/60 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-fantasy-border mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 block mb-1">
                  Alleyway Black Market Encounter • {selectedWard ? `${selectedWard} Ward` : 'Waterdeep Alleys'}
                </span>
                <h3 className="text-2xl font-black text-white tracking-wide flex items-center space-x-2">
                  <span>🕵️ "Psst... Over Here!"</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 italic">
                  A shadowy figure in a patched wool trenchcoat beckons from between the damp buildings, looking both ways for the City Watch.
                </p>
              </div>
              <button 
                onClick={() => setShadyPeddlerModalOpen(false)} 
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* The Trenchcoat Spread: 3 Wares */}
            <div className="mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Inside the Trenchcoat Lining (3 Wares Pinned):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {shadyWares.map((w, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setShadyActiveIndex(idx);
                      setShadyInspectResult(null);
                      setShadySpellRevealed(false);
                      setShadyPhysicalD20('');
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      shadyActiveIndex === idx
                        ? 'bg-purple-950/60 border-purple-500 shadow-lg shadow-purple-950/50'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold text-purple-300 block mb-0.5">Ware #{idx + 1}</span>
                      <h4 className="font-bold text-sm text-white truncate">{w.item['Item Name']}</h4>
                      <span className="text-[10px] text-slate-400 block">{w.item['Category']}</span>
                    </div>
                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs line-through text-slate-500">{w.item['Base Cost']}</span>
                      <span className="text-xs font-black text-emerald-400">{w.stealPrice}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Selected Ware Inspection Workspace */}
            {shadyWares[shadyActiveIndex] && (() => {
              const activeWare = shadyWares[shadyActiveIndex];
              return (
                <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-lg font-black text-white">{activeWare.item['Item Name']}</h4>
                      <p className="text-xs text-slate-400">{activeWare.item['Properties / Flavor'] || 'An intriguing magical wonder held out under the lantern light.'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-500 block uppercase">Hustler Steal Price</span>
                      <span className="text-xl font-black text-emerald-400">{activeWare.stealPrice}</span>
                    </div>
                  </div>

                  {/* Player Decision Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {/* Action 1: Investigation Check */}
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Examine Closely (Investigation d20)
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <input
                          type="number"
                          placeholder="Phys d20"
                          value={shadyPhysicalD20}
                          onChange={(e) => setShadyPhysicalD20(e.target.value)}
                          className="w-20 bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-center text-xs font-bold text-fantasy-gold"
                        />
                        <button
                          onClick={() => {
                            const d20 = shadyPhysicalD20 ? parseInt(shadyPhysicalD20, 10) : Math.floor(Math.random() * 20) + 1;
                            setShadyInspectResult({ roll: d20 });
                          }}
                          className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-fantasy-gold text-slate-200 font-bold rounded transition"
                        >
                          Examine Wares
                        </button>
                      </div>

                      {/* Anti-Metagame Player Feedback: Neutral, zero spoilers */}
                      {shadyInspectResult && (
                        <div className="bg-slate-900/90 p-2 rounded border border-slate-800 text-[11px] text-amber-200">
                          🔍 <strong>Investigation Check: {shadyInspectResult.roll}</strong>. Your DM describes what you observe.
                        </div>
                      )}
                    </div>

                    {/* Action 2: Spell Slot Burn */}
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Burn Spell Slot (Detect Magic / Identify)
                      </span>
                      <button
                        onClick={() => setShadySpellRevealed(true)}
                        className="w-full py-2 bg-gradient-to-r from-indigo-900 to-purple-900 hover:from-indigo-800 hover:to-purple-800 text-indigo-200 hover:text-white font-bold rounded transition border border-indigo-700/50 flex items-center justify-center space-x-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                        <span>Cast Detect Magic / Identify</span>
                      </button>

                      {shadySpellRevealed && (
                        <div className="bg-slate-900/90 p-2 rounded border border-purple-800/40 text-[11px] text-purple-200">
                          ✨ <strong>Spell Slot Expended</strong>. Your DM describes the magical aura resonance.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* DM Mode Behind the Screen Panel */}
                  {dmMode && (
                    <div className="bg-purple-950/40 border-2 border-purple-700/70 p-4 rounded-xl space-y-2.5 text-xs">
                      <div className="flex items-center justify-between border-b border-purple-800/60 pb-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-purple-300">
                          DM Screen Only • Secret Peddler Truth
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          activeWare.outcome === 'real' ? 'bg-emerald-950 text-emerald-300 border border-emerald-600' :
                          activeWare.outcome === 'cursed' ? 'bg-rose-950 text-rose-300 border border-rose-600' :
                          'bg-amber-950 text-amber-300 border border-amber-600'
                        }`}>
                          Secret: {activeWare.outcome.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-slate-300">
                          <strong className="text-slate-400">Surface Cue (&lt; DC 15):</strong> "{activeWare.dmSurfaceCue}"
                        </p>
                        <p className="text-amber-200">
                          <strong className="text-amber-400">Tell Cue (DC 15+):</strong> "{activeWare.dmTellCue}"
                        </p>
                        {shadySpellRevealed && (
                          <p className="text-indigo-200 bg-indigo-950/40 p-2 rounded border border-indigo-800/50">
                            <strong>Spell Slot Reveal:</strong> "{activeWare.dmSpellCue}"
                          </p>
                        )}
                        <p className="text-rose-200 bg-rose-950/40 p-2 rounded border border-rose-800/50">
                          <strong>Immediate Corner-Turn Result:</strong> "{activeWare.cornerPunchline}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Purchase & Outcome Buttons */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        addToCart({
                          ...activeWare.item,
                          'Item Name': `${activeWare.item['Item Name']} (Alley Purchase)`,
                          'Base Cost': activeWare.stealPrice,
                          cost: activeWare.stealPrice,
                          name: `${activeWare.item['Item Name']} (Alley Purchase)`,
                          maxStock: 1,
                          secretOutcome: activeWare.outcome,
                          secretPunchline: activeWare.cornerPunchline
                        }, 'Alley Peddler', 1);
                        setShadyPurchased(true);
                        confetti({ particleCount: 40, spread: 50 });
                      }}
                      disabled={shadyPurchased}
                      className={`flex-1 py-2.5 rounded-lg font-black text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1.5 ${
                        shadyPurchased
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-lg'
                      }`}
                    >
                      <Coins className="w-4 h-4" />
                      <span>{shadyPurchased ? 'Purchased! Peddler Fleeing...' : `Buy for ${activeWare.stealPrice}`}</span>
                    </button>

                    <button
                      onClick={() => setShadyPeddlerModalOpen(false)}
                      className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg transition"
                    >
                      Walk Away
                    </button>
                  </div>

                  {shadyPurchased && (
                    <div className="bg-emerald-950/60 border border-emerald-600/60 p-3 rounded-lg text-xs text-emerald-200">
                      👣 Item added to Cart. Peddler pockets coin, glances down alleyway, and retreats into the crowd.
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="bg-fantasy-card w-full max-w-md h-full border-l border-fantasy-border flex flex-col justify-between shadow-2xl p-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-fantasy-border">
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-5 h-5 text-fantasy-gold" />
                  <h3 className="font-bold text-lg text-white">Party Cart</h3>
                </div>
                <button onClick={() => setCartOpen(false)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto max-h-[45vh] py-4 space-y-3">
                {cart.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Your cart is empty.</p>
                ) : (
                  cart.map((c, i) => {
                    const basePrice = getAdjustedPrice(c.item['Base Cost'] || c.item.cost, c.item.tier || '3');
                    const hasHaggled = c.item.haggledPrice !== null && c.item.haggledPrice !== undefined;
                    const effectivePrice = hasHaggled ? parseFloat(c.item.haggledPrice) : basePrice;
                    const maxStock = c.item.maxStock !== undefined ? c.item.maxStock : 99;
                    const atLimit = c.quantity >= maxStock;

                    return (
                      <div key={i} className="bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-bold text-sm text-white truncate max-w-[200px]">{c.item.name}</h4>
                            <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                              <span className="text-amber-300 font-semibold">{c.venueName || 'Waterdeep'}</span>
                              <span>•</span>
                              <span>Shopper: <strong className="text-white">{c.item.shopper || 'Party'}</strong></span>
                            </div>
                            <div className="mt-1 flex items-center space-x-1.5">
                              {hasHaggled ? (
                                <>
                                  <span className="text-xs text-slate-500 line-through">{formatGoldCost(basePrice * c.quantity)}</span>
                                  <span className="text-xs font-bold text-emerald-400">{formatGoldCost(effectivePrice * c.quantity)} ({c.item.haggleStatus === 'legendary' ? '-20%' : c.item.haggleStatus === 'success' ? '-10%' : '+10%'})</span>
                                </>
                              ) : c.item.cost === '0 gp' || (c.item.name && c.item.name.includes('[Stolen]')) ? (
                                <span className="text-xs font-bold text-emerald-400">0 gp (Heisted / Loot)</span>
                              ) : (
                                <span className="text-xs text-fantasy-gold font-bold">{formatGoldCost(effectivePrice * c.quantity)}</span>
                              )}
                            </div>
                          </div>

                          {/* Working Cart Quantity & Delete Controls */}
                          <div className="flex items-center space-x-1.5 shrink-0 bg-slate-950 p-1 rounded-lg border border-slate-800">
                            <button 
                              onClick={() => updateQuantity(i, c.quantity - 1)}
                              className="h-6 w-6 rounded bg-slate-800 text-white flex items-center justify-center font-bold text-xs hover:bg-slate-700 transition"
                              title="Decrease quantity"
                            >-</button>
                            <span className="text-xs font-bold text-white px-1.5 min-w-[20px] text-center">{c.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(i, c.quantity + 1)}
                              disabled={atLimit}
                              className={`h-6 w-6 rounded flex items-center justify-center font-bold text-xs transition ${
                                atLimit ? 'bg-slate-900 text-slate-600 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-700'
                              }`}
                              title={atLimit ? "Max available stock reached" : "Increase quantity"}
                            >+</button>
                            <button 
                              onClick={() => removeFromCart(i)}
                              className="h-6 w-6 rounded text-slate-500 hover:text-rose-400 flex items-center justify-center transition ml-1"
                              title="Remove item from cart"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Optional DM-Only Flaw & Boon Badges (Discreet / Tabletop-Friendly) */}
                        {dmMode && (c.item.flaw || c.item.boon) && (
                          <div className="pt-1.5 border-t border-slate-800/80 text-[10px] space-y-1">
                            {c.item.flaw && (
                              <div className="p-1.5 rounded bg-rose-950/60 border border-rose-800 text-rose-300 flex items-center justify-between">
                                <div>
                                  <span className="font-bold uppercase tracking-wider block">⚠️ [DM Flaw]: {c.item.flaw.name}</span>
                                  <span className="text-rose-200/90 text-[10px]">{c.item.flaw.desc}</span>
                                </div>
                                <button 
                                  onClick={() => dismissItemAnomaly(i)}
                                  className="text-rose-400 hover:text-white underline text-[10px] ml-2 shrink-0"
                                  title="Dismiss / ignore this flaw"
                                >
                                  Dismiss
                                </button>
                              </div>
                            )}
                            {c.item.boon && (
                              <div className="p-1.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center justify-between">
                                <div>
                                  <span className="font-bold uppercase tracking-wider block">✨ [DM Boon]: {c.item.boon.name}</span>
                                  <span className="text-emerald-200/90 text-[10px]">{c.item.boon.desc}</span>
                                </div>
                                <button 
                                  onClick={() => dismissItemAnomaly(i)}
                                  className="text-emerald-400 hover:text-white underline text-[10px] ml-2 shrink-0"
                                  title="Dismiss / ignore this boon"
                                >
                                  Dismiss
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="border-t border-fantasy-border pt-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>Encumbrance Weight:</span>
                <span className="font-bold text-white flex items-center space-x-1">
                  <Weight className="w-3.5 h-3.5 text-slate-400" />
                  <span>{totalWeightLbs.toFixed(1)} lbs</span>
                </span>
              </div>
              <div className="flex items-center justify-between text-sm font-bold text-white mb-3">
                <span>Total Due:</span>
                <div className="text-right">
                  {haggleResult && haggleResult.discountMultiplier !== 1.0 && (
                    <span className="text-xs line-through text-slate-500 mr-2">
                      {formatGoldCost(rawCartCostGold)}
                    </span>
                  )}
                  <span className={`text-base font-black ${haggleResult && haggleResult.discountMultiplier < 1.0 ? 'text-emerald-400' : 'text-fantasy-gold'}`}>
                    {formatGoldCost(totalCostGold)}
                  </span>
                </div>
              </div>

              {/* Complete Transaction Button (Clean Static Cart Across All Shops & Taverns) */}
              <button 
                onClick={() => {
                  completeCheckout();
                  setCartOpen(false);
                  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
                }}
                disabled={cart.length === 0}
                className="w-full bg-fantasy-gold hover:bg-fantasy-goldHover text-fantasy-dark font-black py-3 rounded-lg text-sm transition uppercase tracking-wide disabled:opacity-50 shadow-lg"
              >
                Complete Transaction (Update Inventory)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: Project L.O.O.T. Per-Item Haggle Modal (Player View: Skill Selection Only | DM View: DCs, Prompts & Consequences) */}
      {haggleModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-fantasy-card border border-fantasy-border rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-fantasy-border mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-xl leading-none" role="img" aria-label="Haggle">🤝</span>
                <h3 className="font-bold text-lg text-white">Haggle Item Price</h3>
              </div>
              <button onClick={() => { setHaggleModalItem(null); setItemHaggleResult(null); setPendingNotice(null); }} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 mb-4 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Target Item:</span>
                <span className="font-bold text-white truncate max-w-[200px]">{haggleModalItem['Item Name']}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Listed Storefront Price:</span>
                <span className="font-bold text-fantasy-gold">
                  {formatGoldCost(getAdjustedPrice(haggleModalItem['Base Cost'], selectedVenue ? selectedVenue['Socioeconomic Tier'] : '3'))}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Active Shopper:</span>
                <span className="font-bold text-sky-400">{activePlayer}</span>
              </div>
            </div>

            {/* DM Proprietor Psychology Card (DM View Only) */}
            {dmMode && (() => {
              const prof = getProprietorArchetypeProfile(selectedVenue?.['Socioeconomic Tier'], selectedVenue);
              return (
                <div className="bg-amber-950/30 border border-amber-700/50 p-3 rounded-xl mb-3 text-xs text-amber-200 space-y-1">
                  <strong className="uppercase text-amber-400 block">🧠 Proprietor Archetype: {prof.label}</strong>
                  <p className="text-[11px] text-slate-300 leading-snug">{prof.summary}</p>
                  <div className="text-[10px] text-emerald-300"><strong>✓ Favors:</strong> {prof.favored}</div>
                  <div className="text-[10px] text-rose-300"><strong>✗ Tired Of / Backfires:</strong> {prof.hated}</div>
                </div>
              );
            })()}

            {/* Skill Selection List (Strictly Skill Names Only in Player View; Full DCs, Prompts & Penalties in DM View) */}
            <div className="space-y-2 mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {dmMode ? 'Select Skill & Review DM Negotiation Matrix:' : 'Select Skill to Roll:'}
              </span>
              <div className="grid grid-cols-1 gap-2 text-xs">
                {getTacticalApproaches(selectedVenue ? selectedVenue['Socioeconomic Tier'] : '3', false, selectedVenue).map((appr) => {
                  const isSelected = selectedHaggleApproach === appr.id;
                  return (
                    <div
                      key={appr.id}
                      onClick={() => setSelectedHaggleApproach(appr.id)}
                      className={`p-2.5 rounded-xl border transition cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-950/40 border-fantasy-gold shadow-md' 
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold text-white">
                        <span className={isSelected ? 'text-fantasy-gold' : 'text-slate-200'}>
                          {dmMode ? appr.title : appr.playerSkill}
                        </span>
                        {dmMode && (
                          <span className="text-fantasy-gold font-mono font-black text-xs">DC {appr.dc}</span>
                        )}
                      </div>
                      {dmMode && (
                        <>
                          <p className="text-[11px] text-slate-300 leading-snug mt-1">
                            <strong className="text-amber-300">[DM Prompt]:</strong> {appr.desc}
                          </p>
                          <div className="mt-1 pt-1 border-t border-slate-800 text-[10px] text-rose-300">
                            <strong className="uppercase">⚠️ [Failure Consequence]:</strong> {appr.penalty}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Roll Controls */}
            {!itemHaggleResult ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    placeholder="Phys d20"
                    value={hagglePhysicalD20}
                    onChange={(e) => setHagglePhysicalD20(e.target.value)}
                    className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-2 text-center text-xs font-bold text-fantasy-gold"
                    title="Enter physical d20 roll from table (or leave blank to roll in-app)"
                  />
                  <div className="flex items-center space-x-1 bg-slate-900 px-2.5 py-2 rounded-lg border border-slate-700 text-xs">
                    <span className="text-slate-400 font-mono text-[10px]">Mod:</span>
                    <input
                      type="number"
                      value={skillMod}
                      onChange={(e) => setSkillMod(parseInt(e.target.value, 10) || 0)}
                      className="w-8 bg-transparent text-center font-bold text-white focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const tier = selectedVenue ? selectedVenue['Socioeconomic Tier'] : '3';
                      const approaches = getTacticalApproaches(tier, false, selectedVenue);
                      const chosenApproach = approaches.find(a => a.id === selectedHaggleApproach) || approaches[0];
                      const d20 = hagglePhysicalD20 ? parseInt(hagglePhysicalD20, 10) : Math.floor(Math.random() * 20) + 1;
                      const total = d20 + (parseInt(skillMod, 10) || 0);
                      const basePrice = getAdjustedPrice(haggleModalItem['Base Cost'], tier);
                      const targetDc = chosenApproach.dc;

                      let discountMultiplier = 1.0;
                      let label = '';
                      let dmPrompt = '';
                      let status = 'neutral';

                      if (chosenApproach.isBackfireTrap && total >= targetDc) {
                        discountMultiplier = 1.25;
                        label = `🚨 Total ${total} (DC ${targetDc}+) • Watch Notified & Kicked Out!`;
                        dmPrompt = 'Recognize menacing threat display, pull alarm cord to notify City Watch / Temple Guardians, order shopper out immediately.';
                        status = 'fumble';
                        lockOutVault(venueName);
                        if (banPlayerFromVenue) banPlayerFromVenue(venueName, activePlayer);
                      } else if (chosenApproach.isBackfireTrap && total < targetDc) {
                        discountMultiplier = 1.15;
                        label = `Total ${total} • Scoffed At (+15% Surcharge)`;
                        dmPrompt = 'Scoff at unconvincing posturing, warn that another threat will summon the Watch, add 15% nuisance surcharge.';
                        status = 'fail';
                      } else if (chosenApproach.bonusRespectOnPass && total >= targetDc) {
                        discountMultiplier = 0.80; // -20% Earned Veteran Respect!
                        label = `⚔️ Total ${total} (Beat DC ${targetDc}) • -20% Warrior's Respect!`;
                        dmPrompt = 'Grin with genuine veteran respect at iron grit, clasp forearm, slash 20% off ledger price.';
                        status = 'legendary';
                        confetti({ particleCount: 60, spread: 70 });
                      } else if (chosenApproach.bonusRespectOnPass && total < targetDc) {
                        discountMultiplier = 1.0; // Hardened veterans just chuckle at <20 intimidation without calling Watch
                        label = `Total ${total} (vs DC ${targetDc}) • Unfazed Veteran (0% Markup)`;
                        dmPrompt = 'Chuckle unimpressed at casual bluster, cross scarred arms, hold firm to standard price without calling Watch.';
                        status = 'neutral';
                      } else if (d20 === 20) {
                        discountMultiplier = 0.80; // -20%
                        label = 'Nat 20 • -20% Discount';
                        dmPrompt = 'Laugh heartily, respect bold negotiation, grant 20% discount.';
                        status = 'legendary';
                        confetti({ particleCount: 60, spread: 70 });
                      } else if (total >= targetDc + 3) {
                        discountMultiplier = 0.85; // -15%
                        label = `Total ${total} • -15% Discount`;
                        dmPrompt = 'Nod approvingly at persuasive leverage, trim 15% off ledger price.';
                        status = 'success';
                        confetti({ particleCount: 30, spread: 40 });
                      } else if (total >= targetDc) {
                        discountMultiplier = 0.90; // -10%
                        label = `Total ${total} • -10% Discount`;
                        dmPrompt = 'Exhale reluctantly, accept cash-in-hand deal, shave 10% off.';
                        status = 'success';
                      } else if (total >= targetDc - 4) {
                        discountMultiplier = 1.0; // 0%
                        label = `Total ${total} • Standard Price (0%)`;
                        dmPrompt = 'Tap counter firmly, hold stance at standard guild rate.';
                        status = 'neutral';
                      } else if (d20 === 1) {
                        discountMultiplier = 1.20; // +20% surcharge
                        label = 'Nat 1 • +20% Surcharge';
                        dmPrompt = 'Bristle at offensive lowball, slam ledger shut, add 20% insolence surcharge.';
                        status = 'fumble';
                      } else {
                        discountMultiplier = 1.10; // +10% surcharge
                        label = `Total ${total} • +10% Surcharge`;
                        dmPrompt = 'Frown sourly at clumsy pitch, tack on 10% markup.';
                        status = 'fail';
                      }

                      const haggledPrice = Number((basePrice * discountMultiplier).toFixed(2));

                      if (!dmMode && rollResolutionMode === 'approval') {
                        submitPendingCheck({
                          player: activePlayer,
                          checkType: 'Item Haggle',
                          skillName: chosenApproach.playerSkill,
                          d20,
                          mod: parseInt(skillMod, 10) || 0,
                          total,
                          dc: targetDc,
                          venueName,
                          itemName: haggleModalItem['Item Name'],
                          dmPrompt,
                          dmConsequence: `${label} (${formatGoldCost(haggledPrice)})`
                        });
                        setPendingNotice(`🎲 Rolled ${total} on ${chosenApproach.playerSkill} — Sent to DM for adjudication.`);
                      }

                      setItemHaggleResult({ d20, total, discountMultiplier, label, dmPrompt, status, haggledPrice, basePrice, skillName: chosenApproach.playerSkill });
                      addActivityLog({
                        player: activePlayer,
                        action: 'Haggle Roll',
                        details: `${haggleModalItem['Item Name']} (${chosenApproach.playerSkill}: ${label}) -> ${haggledPrice} gp`
                      });
                    }}
                    className="flex-1 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow transition flex items-center justify-center space-x-1"
                  >
                    <Dices className="w-4 h-4" />
                    <span>Roll Check</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black ${
                      itemHaggleResult.status === 'legendary' ? 'text-amber-300' :
                      itemHaggleResult.status === 'success' ? 'text-emerald-400' :
                      itemHaggleResult.status === 'fumble' ? 'text-rose-400' :
                      itemHaggleResult.status === 'fail' ? 'text-rose-300' : 'text-slate-300'
                    }`}>
                      {itemHaggleResult.label} ({itemHaggleResult.skillName})
                    </span>
                    <button
                      onClick={() => { setItemHaggleResult(null); setHagglePhysicalD20(''); setPendingNotice(null); }}
                      className="text-[10px] text-slate-400 hover:text-white underline"
                    >
                      Re-roll
                    </button>
                  </div>

                  {dmMode && itemHaggleResult.dmPrompt && (
                    <p className="text-[11px] text-amber-200/90 pt-1 border-t border-slate-800">
                      <strong className="uppercase text-amber-400">[DM Prompt]:</strong> {itemHaggleResult.dmPrompt}
                    </p>
                  )}

                  {pendingNotice && !dmMode && (
                    <p className="text-[11px] text-sky-300 pt-1 border-t border-slate-800">
                      {pendingNotice}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                    <span className="text-slate-400">Adjusted Item Price:</span>
                    <div className="text-right">
                      <span className="text-slate-500 line-through mr-1.5">{formatGoldCost(itemHaggleResult.basePrice)}</span>
                      <span className="font-black text-emerald-400">{formatGoldCost(itemHaggleResult.haggledPrice)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    const name = haggleModalItem['Item Name'];
                    const maxStock = haggleModalItem.quantity !== undefined ? haggleModalItem.quantity : 99;
                    addToCart({
                      ...haggleModalItem,
                      name,
                      'Item Name': name,
                      cost: `${itemHaggleResult.haggledPrice} gp`,
                      haggledPrice: itemHaggleResult.haggledPrice,
                      'Base Cost': haggleModalItem['Base Cost'],
                      weight: haggleModalItem['Weight (lbs)'] || '0.5',
                      maxStock,
                      tier: selectedVenue ? selectedVenue['Socioeconomic Tier'] : '3',
                      shopper: activePlayer,
                      haggleStatus: itemHaggleResult.status,
                      hagglePrompt: itemHaggleResult.dmPrompt
                    }, venueName, maxStock);
                    setHaggleModalItem(null);
                    setItemHaggleResult(null);
                    setPendingNotice(null);
                  }}
                  className="w-full py-2.5 bg-fantasy-gold hover:bg-fantasy-goldHover text-fantasy-dark font-black text-xs uppercase tracking-wider rounded-lg shadow-lg transition flex items-center justify-center space-x-1.5"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Add Haggled Item to Cart ({formatGoldCost(itemHaggleResult.haggledPrice)})</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 7: Kahoot / Jackbox Live Session Room & Cross-Device Host Dashboard */}
      {roomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-fantasy-card border-2 border-sky-600/70 rounded-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-fantasy-border">
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl">{roomConnectionStatus === 'hosting' || roomConnectionStatus === 'connected' ? '🟢' : '📡'}</span>
                <div>
                  <h3 className="font-black text-lg text-white">
                    {isPlayerLocked ? 'Live Player Session Connection' : 'DM Live Session Host & Player Invite'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {roomStatusMessage}
                  </p>
                </div>
              </div>
              <button onClick={() => setRoomModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {isPlayerLocked ? (
              /* PLAYER VIEW OF ROOM MODAL */
              <div className="space-y-4">
                <div className="bg-slate-900 border border-emerald-600/50 p-4 rounded-xl text-center space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 block">
                    Connected to DM Room
                  </span>
                  <div className="text-3xl font-black font-mono tracking-widest text-fantasy-gold">
                    {sessionCode}
                  </div>
                  <p className="text-xs text-slate-300">
                    Playing as <strong className="text-white">{activePlayer}</strong>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setRoomModalOpen(false);
                      openPlayerJoinLobby(sessionCode);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700 transition"
                  >
                    Switch Character / Room Code
                  </button>
                  <button
                    onClick={() => {
                      leaveLiveRoom();
                      setRoomModalOpen(false);
                    }}
                    className="py-2.5 px-4 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-xs font-bold text-rose-200 border border-rose-700/60 transition"
                  >
                    Leave Room (Return to DM Mode)
                  </button>
                </div>
              </div>
            ) : (
              /* DM HOST VIEW OF ROOM MODAL */
              <>
                {/* Step 1: Create / Host Live Room & Share Link + QR Code */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-400 block">
                        Step 1 • Table Room Code
                      </span>
                      <div className="flex items-center space-x-3 mt-0.5">
                        <span className="text-4xl font-black font-mono tracking-[0.2em] text-fantasy-gold">
                          {sessionCode}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          roomConnectionStatus === 'hosting'
                            ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300'
                            : 'bg-slate-800 border border-slate-700 text-slate-400'
                        }`}>
                          {roomConnectionStatus === 'hosting' ? '🟢 Live On Air' : '⚪ Standby'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {roomConnectionStatus !== 'hosting' ? (
                        <button
                          onClick={async () => {
                            const code = await hostLiveRoom(sessionCode);
                            setRoomCodeInput(code);
                          }}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition"
                        >
                          🚀 Start Live Room
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                            let newCode = '';
                            for (let i = 0; i < 5; i++) newCode += chars[Math.floor(Math.random() * chars.length)];
                            setRoomCodeInput(newCode);
                            await hostLiveRoom(newCode);
                          }}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-amber-600/40 transition"
                        >
                          🎲 New Random Code
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Shareable Join Link & Scannable QR Code */}
                  {typeof window !== 'undefined' && (() => {
                    const joinUrl = `${window.location.origin}${window.location.pathname}?room=${sessionCode}`;
                    const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=6&data=${encodeURIComponent(joinUrl)}`;
                    return (
                      <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                        <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
                          <img
                            src={qrSrc}
                            alt={`QR Code for Room ${sessionCode}`}
                            className="w-28 h-28 object-contain"
                          />
                        </div>
                        <div className="flex-1 w-full space-y-2">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 block">
                            Step 2 • Share This Link or Scan QR Code
                          </span>
                          <p className="text-[11px] text-slate-400 leading-relaxed">
                            When players click this link on their phone or laptop, they land on the <strong>Player Join Lobby</strong>, type their character name, and connect to your live session:
                          </p>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              readOnly
                              value={joinUrl}
                              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-[11px] font-mono text-sky-300 select-all"
                            />
                            <button
                              onClick={() => {
                                navigator.clipboard?.writeText(joinUrl);
                                setCopyLinkFeedback(true);
                                setTimeout(() => setCopyLinkFeedback(false), 2500);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs transition shrink-0"
                            >
                              {copyLinkFeedback ? '✓ Copied!' : '🔗 Copy Join Link'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* DM Roll Resolution Mode Toggle: Trusted Mode vs DM Approval Mode */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    Step 3 • Player Dice Roll Resolution Mode
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      onClick={() => setRollResolutionMode('trusted')}
                      className={`p-3 rounded-xl border text-left transition ${
                        rollResolutionMode === 'trusted'
                          ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-black block text-xs mb-0.5">⚡ Trusted Mode (Auto)</span>
                      <span className="text-[10px] opacity-80 block leading-tight">
                        Player rolls resolve immediately (DCs &amp; DM cues stay hidden).
                      </span>
                    </button>
                    <button
                      onClick={() => setRollResolutionMode('approval')}
                      className={`p-3 rounded-xl border text-left transition ${
                        rollResolutionMode === 'approval'
                          ? 'bg-amber-950/50 border-fantasy-gold text-amber-200 shadow'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-black block text-xs mb-0.5">🛡️ DM Approval Mode</span>
                      <span className="text-[10px] opacity-80 block leading-tight">
                        Player rolls go to DM Pending Queue for manual Pass/Fail approval.
                      </span>
                    </button>
                  </div>
                </div>

                {/* Connected Party Roster & Live Player Locations */}
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Connected Party Roster &amp; Live Locations ({partyMembers.length})
                    </span>
                    {partyMembers.length > 1 && resetPartyRoster && (
                      <button
                        onClick={() => resetPartyRoster()}
                        className="text-[10px] text-rose-400 hover:text-rose-300 font-bold underline"
                        title="Clear joined players and reset Shopper to DM only"
                      >
                        Reset to DM Only
                      </button>
                    )}
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {partyMembers.map((member) => (
                      <div key={member} className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                        <button
                          onClick={() => setActivePlayer(member)}
                          className={`font-bold text-left ${member === activePlayer ? 'text-fantasy-gold' : 'text-white hover:text-amber-200'}`}
                        >
                          {member} {member === activePlayer && '(Selected on DM Screen)'}
                        </button>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] text-sky-300 font-medium truncate max-w-[170px]">
                            📍 {playerLocations?.[member] || `${selectedSettlement || 'Waterdeep'}`}
                          </span>
                          {partyMembers.length > 1 && member !== 'DM' && removePartyMember && (
                            <button
                              onClick={() => removePartyMember(member)}
                              className="text-slate-500 hover:text-rose-400 transition"
                              title={`Remove ${member} from roster`}
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center space-x-2 pt-2 border-t border-slate-800">
                    <input
                      type="text"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      placeholder="Manually add character (e.g. 'Tasha (Sorcerer)')"
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                    />
                    <button
                      onClick={() => {
                        if (!newPlayerName.trim()) return;
                        addPartyMember(newPlayerName.trim());
                        setNewPlayerName('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white border border-slate-700"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Option to Join Another DM's Room as a Player */}
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Want to test or join a session as a player on this device?</span>
                  <button
                    onClick={() => {
                      setRoomModalOpen(false);
                      setPlayerJoinCodeInput(sessionCode);
                      openPlayerJoinLobby(sessionCode);
                    }}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold border border-slate-700 transition"
                  >
                    🎮 Open Player Join Screen
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 8: Modular City Data Pack Manager & JSON Uploader */}
      {cityPackModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-fantasy-card border-2 border-emerald-700/60 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-fantasy-border">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-black text-lg text-white">Modular City Data Packs</h3>
                  <p className="text-[11px] text-slate-400">Decoupled from the 1,832-item Universal Catalog</p>
                </div>
              </div>
              <button onClick={() => setCityPackModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Loaded City Data Packs (Click to Switch Active City):
              </span>
              <div className="grid grid-cols-1 gap-2">
                {Object.values(cityPacks || {}).map((pack) => {
                  const isCurrent = selectedSettlement === pack.name || activeCityPackId === pack.id;
                  return (
                    <div
                      key={pack.id || pack.name}
                      onClick={() => {
                        setSettlement(pack.name);
                        setCityPackModalOpen(false);
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        isCurrent
                          ? 'bg-emerald-950/40 border-emerald-500 shadow'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div>
                        <span className="font-black text-sm text-white block">{pack.name} • <span className="text-emerald-300 font-normal text-xs">{pack.subtitle}</span></span>
                        <span className="text-[11px] text-slate-400 block">
                          {(pack.wards || []).length} Districts • {(pack.shops || []).length} Shops • {(pack.eateries || []).length} Eateries
                        </span>
                      </div>
                      <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase ${
                        isCurrent ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                      }`}>
                        {isCurrent ? 'Active' : 'Load City'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Drag & Drop / File Picker for Custom City Pack JSON */}
            <div className="bg-slate-900 border-2 border-dashed border-slate-700 hover:border-emerald-500 p-4 rounded-xl text-center space-y-2 transition">
              <span className="text-xs font-bold text-white block">Upload Custom City Pack (`.json`)</span>
              <p className="text-[11px] text-slate-400">
                Drop in any city pack file (e.g. <code>baldurs_gate_city_pack.json</code>) and its storefronts will automatically stock from the 1,832-item catalog.
              </p>
              <input
                type="file"
                accept=".json,application/json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    try {
                      const parsed = JSON.parse(ev.target.result);
                      if (!parsed.name || !Array.isArray(parsed.wards)) {
                        alert('Invalid City Pack JSON: must include "name" and "wards" array.');
                        return;
                      }
                      loadCustomCityPack(parsed);
                      setCityPackModalOpen(false);
                      confetti({ particleCount: 70, spread: 60 });
                    } catch (err) {
                      alert('Could not parse JSON file: ' + err.message);
                    }
                  };
                  reader.readAsText(file);
                }}
                className="block w-full text-xs text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-600 file:text-slate-950 hover:file:bg-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* DRAWER: DM Live Table Audit Log & Pending Roll Approval Queue */}
      {activityLogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-0">
          <div className="bg-fantasy-card border-l border-fantasy-border w-full max-w-md h-full flex flex-col p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-fantasy-border mb-3">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-fantasy-gold" />
                <h3 className="font-bold text-lg text-white">DM Live Table Log & Queue</h3>
              </div>
              <button onClick={() => setActivityLogOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Pending Player Rolls Queue (DM Approval Mode) */}
            {pendingChecks.length > 0 && (
              <div className="mb-4 bg-rose-950/30 border border-rose-700/70 rounded-xl p-3 space-y-2.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 block">
                  ⏳ Pending Player Rolls Awaiting DM Adjudication ({pendingChecks.length})
                </span>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {pendingChecks.map((chk) => (
                    <div key={chk.id} className="bg-slate-950 border border-slate-800 p-2.5 rounded-lg text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-300">{chk.player} • {chk.checkType}</span>
                        <span className="font-mono font-black text-fantasy-gold">
                          Roll {chk.total} (d20:{chk.d20}) vs DC {chk.dc}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-300 block">
                        Skill: <strong>{chk.skillName}</strong> @ {chk.venueName} {chk.itemName ? `(${chk.itemName})` : ''}
                      </span>
                      <p className="text-[10px] text-amber-200/90">
                        <strong>[DM Prompt]:</strong> {chk.dmPrompt}
                      </p>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => resolvePendingCheck(chk.id, true)}
                          className="flex-1 py-1 rounded bg-emerald-900 hover:bg-emerald-800 text-emerald-200 font-bold text-[11px]"
                        >
                          ✓ Approve (Pass)
                        </button>
                        <button
                          onClick={() => resolvePendingCheck(chk.id, false)}
                          className="flex-1 py-1 rounded bg-rose-900 hover:bg-rose-800 text-rose-200 font-bold text-[11px]"
                        >
                          ✗ Deny (Fail)
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-400 mb-2">Live audit trail of player locations, rolls, vault access, and transactions.</p>
            
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {activityLog.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-12">No activity logged yet today.</p>
              ) : (
                activityLog.map((log) => (
                  <div key={log.id} className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-0.5">
                      <span className="font-mono text-slate-500">{log.timestamp}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-sky-300 font-semibold">{log.player}</span>
                    </div>
                    <span className="font-bold text-fantasy-gold block">{log.action}</span>
                    <p className="text-[11px] text-slate-300 leading-snug">{log.details}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
