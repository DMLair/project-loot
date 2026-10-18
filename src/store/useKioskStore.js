import { create } from 'zustand';
import kioskData from '../data/waterdeep_kiosk_data.json';

export function formatGoldCost(cost) {
  if (typeof cost === 'string') return cost;
  if (cost === undefined || cost === null || isNaN(cost)) return '0 gp';
  if (cost < 0.1) {
    const cp = Math.round(cost * 100);
    return `${cp} cp`;
  }
  if (cost < 1) {
    const sp = Math.round(cost * 10);
    return `${sp} sp`;
  }
  const formattedVal = Number(cost.toFixed(2)).toLocaleString('en-US', { maximumFractionDigits: 2 });
  return `${formattedVal} gp`;
}

export function parseCostToGold(costStr) {
  if (!costStr) return 0;
  const cleanStr = String(costStr).replace(/,/g, '').trim();
  const parts = cleanStr.split(/\s+/);
  const val = parseFloat(parts[0]) || 0;
  const unit = (parts[1] || 'gp').toLowerCase();
  if (unit === 'cp') return val / 100;
  if (unit === 'sp') return val / 10;
  if (unit === 'ep') return val / 2;
  if (unit === 'pp') return val * 10;
  return val;
}

export function getAdjustedPrice(costStr, tier) {
  const baseGold = parseCostToGold(costStr);
  let mod = 1.0;
  const t = String(tier || '3');
  if (t === '1') mod = 0.60;
  else if (t === '2') mod = 0.80;
  else if (t === '3') mod = 1.00;
  else if (t === '4') mod = 1.20;
  else if (t === '5') mod = 1.60;
  else if (t === 'BM') mod = 1.10;
  return baseGold * mod;
}

// Generate fair, tier-gated flaws and boons (DM-facing only)
export function generateAnomaly(item, tier) {
  const cat = (item.Category || item.category || 'Item').toLowerCase();
  const t = String(tier || '3');

  const flawChance = t === '1' ? 0.15 : (t === '2' ? 0.10 : (t === 'BM' ? 0.10 : 0.0));
  const boonChance = t === '5' ? 0.20 : (t === '4' ? 0.10 : (t === 'BM' ? 0.10 : 0.0));

  const roll = Math.random();
  const hasFlaw = roll < flawChance;
  const hasBoon = !hasFlaw && (roll < (flawChance + boonChance));

  if (!hasFlaw && !hasBoon) return { flaw: null, boon: null };

  const d100 = Math.floor(Math.random() * 100) + 1;

  if (cat.includes('weapon')) {
    if (hasFlaw) {
      if (d100 === 1) return { flaw: { name: 'Brittle Core (Catastrophic)', desc: 'Microscopic structural fracture; blade snaps on first natural 1 attack.' }, boon: null };
      if (d100 < 50) return { flaw: { name: 'Salt-Pitted Edge', desc: 'Harbor dampness wear; first critical hit rolls normal damage instead of extra dice.' }, boon: null };
      return { flaw: { name: 'Loose Tang & Rattle', desc: 'Slightly loose grip wrap; disadvantage on stealth checks made to draw weapon quietly.' }, boon: null };
    }
    if (hasBoon) {
      if (d100 === 100) return { flaw: null, boon: { name: 'Mislabelled Masterwork +1', desc: 'Authentic +1 magic weapon (+1 attack and damage) sold as mundane stock!' } };
      if (d100 < 50) return { flaw: null, boon: { name: 'High-Carbon Quench', desc: 'Master craftsmanship; immune to water rust, salt rot, and mundane acid corrosion.' } };
      return { flaw: null, boon: { name: 'Hairline Balance', desc: 'Exceptional counter-weighting; grants +1 to initiative rolls while drawn.' } };
    }
  } else if (cat.includes('armor') || cat.includes('shield')) {
    if (hasFlaw) {
      if (d100 === 1) return { flaw: { name: 'Compromised Rivets (Catastrophic)', desc: 'Weak seam; taking a critical hit reduces armor AC bonus by 1 until repaired.' }, boon: null };
      return { flaw: { name: 'Stiff Squeaking Leather', desc: 'Harsh salt tanning; donning takes double time and squeaks when moving in rain.' }, boon: null };
    }
    if (hasBoon) {
      if (d100 === 100) return { flaw: null, boon: { name: 'Masterwork Tailoring (+1 AC)', desc: 'Artisan guild fit; grants +1 AC bonus above standard catalog specifications.' } };
      return { flaw: null, boon: { name: 'Bespoke Velvet Lining', desc: 'Padded comfort; +1 to Constitution saving throws against forced march exhaustion.' } };
    }
  } else if (cat.includes('potion') || cat.includes('consumable')) {
    if (hasFlaw) {
      if (d100 === 1) return { flaw: { name: 'Inert / Spoiled (Catastrophic)', desc: 'Reagents separated into inert sludge; no magical benefit and induces mild nausea.' }, boon: null };
      return { flaw: { name: 'Pungent Sediment', desc: 'Requires an action to shake before drinking; foul bitter odor.' }, boon: null };
    }
    if (hasBoon) {
      if (d100 === 100) return { flaw: null, boon: { name: 'Maximized Potency', desc: 'Brewed with pristine reagents; maximize all healing or duration dice.' } };
      return { flaw: null, boon: { name: 'Concentrated Distillate', desc: 'Rapid absorption; can be consumed as a bonus action instead of an action.' } };
    }
  } else {
    if (hasFlaw) {
      return { flaw: { name: 'Cosmetic Scuffs', desc: 'Visible merchant wear; sells for 10% less at pawn counters.' }, boon: null };
    }
    if (hasBoon) {
      return { flaw: null, boon: { name: 'Noble Provenance', desc: 'Stamped with an aristocratic house crest; +1 on social checks with local nobility.' } };
    }
  }

  return { flaw: null, boon: null };
}

// Built-in Waterdeep City Pack (derived from master data)
const WATERDEEP_CITY_PACK = {
  packType: 'PROJECT_LOOT_CITY_PACK',
  schemaVersion: '2.0.0',
  id: 'Waterdeep',
  name: 'Waterdeep',
  subtitle: 'The City of Splendors',
  planet: 'Toril',
  continent: 'Faerûn',
  region: 'Sword Coast',
  banner: '/banners/waterdeep.jpg',
  desc: 'Crown of the North. A sprawling metropolis of guildhalls, noble villas, deepwater docks, and subterranean black markets.',
  wards: [
    { id: 'Castle', name: 'Castle Ward', tier: '4', desc: 'Seat of government, Mount Waterdeep, palaces, and elite military suppliers.' },
    { id: 'Sea', name: 'Sea Ward', tier: '5', desc: 'Opulent noble villas, marble temples, high-magic boutiques, and master jewelers.' },
    { id: 'North', name: 'North Ward', tier: '4', desc: 'Quiet tree-lined avenues, wealthy merchant estates, and refined bespoke salons.' },
    { id: 'Trades', name: 'Trades Ward', tier: '3', desc: 'The beating commercial heart of the city. Guild headquarters and bustling markets.' },
    { id: 'South', name: 'South Ward', tier: '3', desc: 'Caravan staging grounds, teamsters, monster-hide tanners, and working-class shops.' },
    { id: 'Dock', name: 'Dock Ward', tier: '2', desc: 'Cramped harbor streets, maritime chandlers, rowdy taverns, and salt-worn wares.' },
    { id: 'Field', name: 'Field Ward', tier: '1', desc: 'Unregulated muddy shantytown outside the inner walls. Cheap salvage and desperate scrap.' },
    { id: 'Dead', name: 'City of the Dead', tier: '3', desc: 'Park-like necropolis of marble mausoleums, historians, and dusk grave-keepers.' },
    { id: 'Skullport', name: 'Skullport (Port of Shadows)', tier: 'BM', desc: 'Subterranean Underdark smuggling haven beneath Undermountain. Contraband and poisons.' }
  ],
  shops: kioskData?.shops || [],
  eateries: kioskData?.eateries || []
};

// Built-in Neverwinter Starter City Pack (for immediate multi-city testing)
const NEVERWINTER_CITY_PACK = {
  packType: 'PROJECT_LOOT_CITY_PACK',
  schemaVersion: '2.0.0',
  id: 'Neverwinter',
  name: 'Neverwinter',
  subtitle: 'The Jewel of the North',
  planet: 'Toril',
  continent: 'Faerûn',
  region: 'Sword Coast',
  banner: '/banners/neverwinter.jpg',
  desc: 'City of Skilled Hands. Rebuilt along the warm, ice-free waters of the Neverwinter River under Lord Dagult Neverember.',
  wards: [
    { id: 'Enclave', name: "Protector's Enclave", tier: '4', desc: 'Heart of governance, the Hall of Justice, bustling markets, and grand guild academies.' },
    { id: 'Blacklake', name: 'Blacklake District', tier: '5', desc: 'Walled noble estates, manicured gardens, high-end jewelers, and old aristocratic bloodlines.' },
    { id: 'River', name: 'River District', tier: '3', desc: 'Master clockmakers, glassblowers, bridges, and busy artisan workshops lining the warm river.' },
    { id: 'Docks', name: 'Neverwinter Docks', tier: '2', desc: 'Deepwater piers, Mintarn mercenary barracks, shipwrights, and weathered sea-traders.' },
    { id: 'BeggarNest', name: "Beggar's Nest & Chasm Rim", tier: '1', desc: 'Scarred ruins near the sealed Chasm, salvaged dungeon gear, and desperate street stalls.' },
    { id: 'Undercliffs', name: 'Skull Crag & Smuggler Caves', tier: 'BM', desc: 'Hidden sea-caves beneath the cliffs where pirates and Zhentarim agents trade contraband.' }
  ],
  shops: [
    {
      'Shop Name': 'The Shining Knight Arms & Armor',
      'Ward': 'Enclave',
      'Socioeconomic Tier': '4',
      'Primary Vendor Type': 'Armorer & Shieldmaker',
      'Proprietor / Staff': 'Danneth Waylen - Veteran shield dwarf armorer with a braided silver beard',
      'Vibe & Decor': 'Polished half-plate stands beneath banners of Tyr; the ring of dwarven hammers echoes from the rear forge.',
      'DM Read-Aloud': 'Heavy oak doors swing open into The Shining Knight. Suits of polished dwarven half-plate gleam beneath crimson banners of Tyr while Danneth Waylen inspects a freshly quenched shield.',
      'DNA / Inventory Tags': 'armor, shield, plate, chain, helm, barding'
    },
    {
      'Shop Name': 'Blades of the Dolphin Bridge',
      'Ward': 'River',
      'Socioeconomic Tier': '3',
      'Primary Vendor Type': 'Smithy & Weaponsmith',
      'Proprietor / Staff': 'Serissa Vance - Sharp-eyed human swordsmith with heat-scarred forearms',
      'Vibe & Decor': 'Water-powered grindstones spin beside racks of river-quenched steel longswords, rapiers, and crossbows.',
      'DM Read-Aloud': 'The rush of the Neverwinter River turns the great grindstones outside. Inside, Serissa Vance tests the balance of a river-quenched steel rapier.',
      'DNA / Inventory Tags': 'sword, dagger, axe, bow, crossbow, weapon, ammunition'
    },
    {
      'Shop Name': 'The Starlight Mantle Arcanum',
      'Ward': 'Enclave',
      'Socioeconomic Tier': '4',
      'Primary Vendor Type': 'Arcane Emporium & Scribe',
      'Proprietor / Staff': 'Magister Elindra Moonflower - Sun elf illusionist in star-embroidered robes',
      'Vibe & Decor': 'Floating driftglobes illuminate cedar shelves packed with spell scrolls, component pouches, and wands.',
      'DM Read-Aloud': 'Soft violet driftglobes hover near the vaulted ceiling of the Starlight Mantle Arcanum. The scent of ozone and cedar rises from rows of ciphered spell scrolls.',
      'DNA / Inventory Tags': 'scroll, wand, staff, rod, focus, grimoire, spellbook, ink, crystal'
    },
    {
      'Shop Name': 'Many-Starred Apothecary',
      'Ward': 'River',
      'Socioeconomic Tier': '3',
      'Primary Vendor Type': 'Apothecary & Herbalist',
      'Proprietor / Staff': 'Barnaby Copperkettle - Cheerful rock gnome herbalist wearing magnifying goggles',
      'Vibe & Decor': 'Warm glass alembics bubble with crimson healing draughts, antitoxins, and Neverwinter botanical tinctures.',
      'DM Read-Aloud': 'Copper alembics bubble cheerfully along the counter while Barnaby Copperkettle adjusts his brass magnifying goggles over a tray of ruby healing potions.',
      'DNA / Inventory Tags': 'potion, elixir, salve, antitoxin, herb, poison, vial, alchemical'
    },
    {
      'Shop Name': 'High Road Caravan Outfitters',
      'Ward': 'Docks',
      'Socioeconomic Tier': '2',
      'Primary Vendor Type': 'General Outfitter & Provisions',
      'Proprietor / Staff': 'Garrick "Two-Mules" Thorne - Grizzled caravan master chewing pipeweed',
      'Vibe & Decor': 'Coils of hemp rope, waxed canvas tents, lanterns, rations, and iron pitons stacked to the rafters.'
    },
    {
      'Shop Name': 'Blacklake Crown Lapidary',
      'Ward': 'Blacklake',
      'Socioeconomic Tier': '5',
      'Primary Vendor Type': 'Jeweler & Gemcutter',
      'Proprietor / Staff': 'Lady Vespera Marcello - Poised Tethyrian gemologist with a crystal loupe',
      'Vibe & Decor': 'Velvet display cases guarded by arcane wards showcase cut sapphires, platinum filigree rings, and noble regalia.'
    },
    {
      'Shop Name': 'Neverwinter Clockwork & Lock',
      'Ward': 'River',
      'Socioeconomic Tier': '3',
      'Primary Vendor Type': 'Locksmith & Security',
      'Proprietor / Staff': 'Tock Brassfinger - Lantanese tinker with brass spectacles',
      'Vibe & Decor': 'Ticking wall clocks, precision tumblers, thieves tools, spyglasses, and delicate brass mechanisms.'
    },
    {
      'Shop Name': 'Chasm-Rim Salvage & Scrap',
      'Ward': 'BeggarNest',
      'Socioeconomic Tier': '1',
      'Primary Vendor Type': 'Smithy & Weaponsmith',
      'Proprietor / Staff': 'Grimjaw - Half-orc scavenger sorting dented shields and dungeon pulls',
      'Vibe & Decor': 'Tarpaulins stretched over timber beams; barrels of notched axes, scavenged daggers, and cheap iron.'
    },
    {
      'Shop Name': 'The Whispering Grotto Fence',
      'Ward': 'Undercliffs',
      'Socioeconomic Tier': 'BM',
      'Primary Vendor Type': 'Shady Fence & Black Market',
      'Proprietor / Staff': 'Nyx "The Tide" - Tiefling smuggler draped in sea-wolf furs',
      'Vibe & Decor': 'Lantern-lit sea cave smelling of brine and drow poison; crates of untaxed luxuries and illicit blades.'
    }
  ],
  eateries: [
    {
      'Eatery Name': 'The Moonstone Mask',
      'Ward': 'Enclave',
      'Socioeconomic Tier': '5',
      'Eatery Type': 'Fine Dining & Salons',
      'Proprietor / Staff': 'Ophala Cheldarstorn - Gracious hostess with masked servers',
      'Vibe & Decor': 'Floating earthmote tethered by massive iron chains; silk divans, harp music, and exquisite vintages.'
    },
    {
      'Eatery Name': 'The Driftwood Tavern',
      'Ward': 'River',
      'Socioeconomic Tier': '3',
      'Eatery Type': 'Taverns & Taprooms',
      'Proprietor / Staff': 'Madam Rosene - No-nonsense retired sea captain',
      'Vibe & Decor': 'Built from the ribs of wrecked galleons; roaring hearth, roast river-trout, and frothy amber ale.'
    },
    {
      'Eatery Name': 'The Beached Leviathan',
      'Ward': 'Docks',
      'Socioeconomic Tier': '2',
      'Eatery Type': 'Taverns & Taprooms',
      'Proprietor / Staff': 'Harrag - Boisterous pirate turned barkeep',
      'Vibe & Decor': 'An entire caravel wedged permanently into the pier; hammocks, spiced rum, and salt-pork stew.'
    },
    {
      'Eatery Name': 'The Fallen Tower',
      'Ward': 'BeggarNest',
      'Socioeconomic Tier': '1',
      'Eatery Type': 'Taverns & Taprooms',
      'Proprietor / Staff': 'Brakka - Stout shield dwarf with an iron ladle',
      'Vibe & Decor': 'Cracked wizard tower converted into a gritty taproom; cheap bitter stout and hot mutton pies.'
    }
  ]
};

function buildCombinedCityData(cityPack) {
  const pack = cityPack || WATERDEEP_CITY_PACK;
  return {
    cityPack: pack,
    wards: pack.wards || [],
    shops: pack.shops || [],
    eateries: pack.eateries || [],
    items: kioskData?.items || [],
    food_menu: kioskData?.food_menu || kioskData?.menu || [],
    menu: kioskData?.menu || kioskData?.food_menu || []
  };
}

function loadLocalJson(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveLocalJson(key, val) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {}
}

// Dynamically ensure PeerJS is available in browser (even if index.html wasn't updated)
function ensurePeerJsLoaded() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.Peer) return Promise.resolve(window.Peer);
  return new Promise((resolve) => {
    const existing = document.querySelector('script[data-peerjs="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Peer || null));
      existing.addEventListener('error', () => resolve(null));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
    script.async = true;
    script.setAttribute('data-peerjs', 'true');
    script.onload = () => resolve(window.Peer || null);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

function generateRandomRoomCode(len = 5) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < len; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

const initialCustomPacks = loadLocalJson('project_loot_custom_cities', {});
const initialCityPacks = {
  Waterdeep: WATERDEEP_CITY_PACK,
  Neverwinter: NEVERWINTER_CITY_PACK,
  ...initialCustomPacks
};

const initialHiddenNodes = loadLocalJson('project_loot_hidden_nodes', {});
const initialSessionCode = loadLocalJson('project_loot_session_code', generateRandomRoomCode(5));

let roomChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    roomChannel = new BroadcastChannel('project_loot_live_room');
  } catch (e) {
    roomChannel = null;
  }
}

// Module-scoped WebRTC references for Host & Client
let activePeerInstance = null;
let hostPeerConnections = new Map(); // peerId -> DataConnection
let clientHostConnection = null;     // DataConnection from player -> DM host

export const useLootStore = create((set, get) => {
  // Build authoritative snapshot of room state for syncing
  const getAuthoritativeRoomState = () => {
    const s = get();
    return {
      cart: s.cart,
      purchasedStock: s.purchasedStock,
      unlockedVaults: s.unlockedVaults,
      vaultLockedOut: s.vaultLockedOut,
      disabledVenues: s.disabledVenues,
      hiddenNodes: s.hiddenNodes,
      bannedPlayersByVenue: s.bannedPlayersByVenue,
      pendingChecks: s.pendingChecks,
      rollResolutionMode: s.rollResolutionMode,
      daySeed: s.daySeed,
      activityLog: s.activityLog,
      partyMembers: s.partyMembers,
      playerLocations: s.playerLocations,
      selectedSettlement: s.selectedSettlement
    };
  };

  // Send packet across BroadcastChannel AND WebRTC DataChannels
  const broadcastRoomSync = (partialPayload) => {
    const state = get();
    const packet = {
      sessionCode: state.sessionCode,
      sender: state.activePlayer,
      senderRole: state.sessionRole,
      timestamp: Date.now(),
      ...partialPayload
    };

    // 1. Save to localStorage for same-browser fallback
    saveLocalJson(`project_loot_room_${state.sessionCode}`, getAuthoritativeRoomState());

    // 2. Broadcast via same-browser BroadcastChannel
    if (roomChannel) {
      try {
        roomChannel.postMessage(packet);
      } catch (e) {}
    }

    // 3. Broadcast via WebRTC PeerJS across devices (phones, tablets, laptops)
    if (state.sessionRole === 'host' && hostPeerConnections.size > 0) {
      const fullPacket = {
        ...packet,
        type: 'SYNC_STATE',
        state: getAuthoritativeRoomState()
      };
      hostPeerConnections.forEach((conn, peerId) => {
        if (conn && conn.open) {
          try {
            conn.send(fullPacket);
          } catch (e) {}
        } else {
          hostPeerConnections.delete(peerId);
        }
      });
    } else if (state.sessionRole === 'player' && clientHostConnection && clientHostConnection.open) {
      try {
        clientHostConnection.send({
          ...packet,
          type: 'PLAYER_SYNC',
          player: state.activePlayer,
          state: partialPayload.state || {}
        });
      } catch (e) {}
    }

    // 4. Optional webhook relay
    if (state.syncRelayUrl && typeof fetch !== 'undefined') {
      fetch(state.syncRelayUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(packet)
      }).catch(() => {});
    }
  };

  // Handle incoming messages from either BroadcastChannel or WebRTC DataChannel
  const handleIncomingRoomPacket = (msg, sourceConn = null) => {
    const state = get();
    if (!msg || msg.sessionCode !== state.sessionCode) return;

    // Player joining the DM's room
    if (msg.type === 'PLAYER_JOIN' && state.sessionRole === 'host') {
      const joiner = (msg.playerName || 'Adventurer').trim();
      const joinLoc = msg.location || `${state.selectedSettlement || 'Waterdeep'} • City Directory`;
      const nextMembers = state.partyMembers.includes(joiner)
        ? state.partyMembers
        : [...state.partyMembers, joiner];
      const nextLocs = {
        ...state.playerLocations,
        [joiner]: joinLoc
      };
      const joinLog = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        player: joiner,
        action: 'Joined Live Session',
        details: `${joiner} connected to Room ${state.sessionCode}`,
        type: 'info'
      };
      const nextLog = [joinLog, ...(state.activityLog || [])].slice(0, 100);
      saveLocalJson('project_loot_party_members', nextMembers);
      saveLocalJson('project_loot_player_locations', nextLocs);

      set({
        partyMembers: nextMembers,
        playerLocations: nextLocs,
        activityLog: nextLog,
        connectedPeersCount: hostPeerConnections.size
      });

      // Immediately push authoritative room state to the new player and all peers
      setTimeout(() => {
        const snapshot = getAuthoritativeRoomState();
        if (sourceConn && sourceConn.open) {
          try {
            sourceConn.send({
              sessionCode: state.sessionCode,
              type: 'SYNC_STATE',
              state: snapshot
            });
          } catch (e) {}
        }
        broadcastRoomSync({ type: 'SYNC_STATE', state: snapshot });
      }, 40);
      return;
    }

    // Player sending a state/action update to DM Host
    if ((msg.type === 'PLAYER_SYNC' || msg.type === 'SYNC_STATE') && state.sessionRole === 'host' && msg.senderRole === 'player') {
      const incoming = msg.state || {};
      set((prev) => {
        const mergedLocs = incoming.playerLocations
          ? { ...prev.playerLocations, ...incoming.playerLocations }
          : prev.playerLocations;
        const mergedMembers = incoming.partyMembers
          ? Array.from(new Set([...prev.partyMembers, ...incoming.partyMembers]))
          : prev.partyMembers;
        return {
          ...prev,
          ...incoming,
          partyMembers: mergedMembers,
          playerLocations: mergedLocs
        };
      });
      // Re-broadcast authoritative state to all other connected players
      setTimeout(() => {
        broadcastRoomSync({ type: 'SYNC_STATE', state: getAuthoritativeRoomState() });
      }, 30);
      return;
    }

    // Player receiving authoritative SYNC_STATE from DM Host
    if (msg.type === 'SYNC_STATE' && msg.state) {
      set((prev) => ({
        ...prev,
        ...msg.state,
        // Preserve player's own locked identity on their device
        activePlayer: prev.isPlayerLocked ? prev.activePlayer : (msg.state.activePlayer || prev.activePlayer)
      }));
    }
  };

  if (roomChannel) {
    roomChannel.onmessage = (event) => {
      handleIncomingRoomPacket(event.data, null);
    };
  }

  return {
    cityPacks: initialCityPacks,
    activeCityPackId: 'Waterdeep',
    data: buildCombinedCityData(initialCityPacks['Waterdeep']),
    selectedPlanet: null,
    selectedContinent: null,
    selectedRegion: null,
    selectedSettlement: null,
    selectedWard: null,
    venueType: null,
    selectedVenue: null,
    daySeed: 1,
    cart: [],
    purchasedStock: {},
    activeMeal: null,
    unlockedVaults: {},
    vaultLockedOut: {},
    disabledVenues: {},
    hiddenNodes: initialHiddenNodes,
    bannedPlayersByVenue: {},
    partyMembers: loadLocalJson('project_loot_party_members', ['DM']),
    activePlayer: loadLocalJson('project_loot_active_player', 'DM'),
    playerLocations: loadLocalJson('project_loot_player_locations', {
      'DM': 'Cosmic Atlas • Multiverse'
    }),
    activityLog: [],
    rollResolutionMode: 'trusted',
    viewDensity: loadLocalJson('project_loot_view_density', 'comfortable'),
    setViewDensity: (density) => {
      saveLocalJson('project_loot_view_density', density);
      set({ viewDensity: density });
    },
    pendingChecks: [],
    sessionCode: initialSessionCode,
    sessionRole: 'host',
    isPlayerLocked: false,
    playerHasJoinedLobby: true,
    roomConnectionStatus: 'idle', // 'idle' | 'hosting' | 'connecting' | 'connected' | 'error'
    roomStatusMessage: 'Local Mode — Click "Host Live Room" to let players join from their phones/laptops.',
    connectedPeersCount: 0,
    syncRelayUrl: loadLocalJson('project_loot_relay_url', ''),

    // Open the Kahoot/Jackbox Player Join Lobby Screen on this device
    openPlayerJoinLobby: (prefillCode) => {
      const code = (prefillCode || get().sessionCode || '').toUpperCase().trim();
      set({
        sessionCode: code,
        sessionRole: 'player',
        isPlayerLocked: true,
        playerHasJoinedLobby: false,
        roomConnectionStatus: 'idle',
        roomStatusMessage: 'Enter the DM Room Code and your Character Name to join.'
      });
    },

    // Leave Player Mode and return to standalone DM/Host device mode
    leaveLiveRoom: () => {
      if (clientHostConnection) {
        try { clientHostConnection.close(); } catch (e) {}
        clientHostConnection = null;
      }
      if (activePeerInstance) {
        try { activePeerInstance.destroy(); } catch (e) {}
        activePeerInstance = null;
      }
      hostPeerConnections.clear();
      set({
        sessionRole: 'host',
        isPlayerLocked: false,
        playerHasJoinedLobby: true,
        activePlayer: 'DM',
        roomConnectionStatus: 'idle',
        roomStatusMessage: 'Disconnected from live room.',
        connectedPeersCount: 0
      });
    },

    // DM ACTION: Create & Host a Live Cross-Device Room via WebRTC (PeerJS) + BroadcastChannel
    hostLiveRoom: async (customCode) => {
      const rawCode = customCode ? String(customCode).toUpperCase().replace(/[^A-Z0-9]/g, '') : generateRandomRoomCode(5);
      const code = rawCode.length >= 3 ? rawCode.slice(0, 8) : generateRandomRoomCode(5);
      saveLocalJson('project_loot_session_code', code);

      // Clean up any existing peer instance
      if (clientHostConnection) {
        try { clientHostConnection.close(); } catch (e) {}
        clientHostConnection = null;
      }
      if (activePeerInstance) {
        try { activePeerInstance.destroy(); } catch (e) {}
        activePeerInstance = null;
      }
      hostPeerConnections.clear();

      set({
        sessionCode: code,
        sessionRole: 'host',
        isPlayerLocked: false,
        playerHasJoinedLobby: true,
        roomConnectionStatus: 'connecting',
        roomStatusMessage: `Starting live room ${code}...`,
        connectedPeersCount: 0
      });

      const PeerClass = await ensurePeerJsLoaded();
      if (!PeerClass) {
        set({
          roomConnectionStatus: 'hosting',
          roomStatusMessage: `Room ${code} active on local network (Same-Browser Tab Sync ready).`
        });
        return code;
      }

      const peerId = `project-loot-room-${code}`;
      try {
        const peer = new PeerClass(peerId, { debug: 0 });
        activePeerInstance = peer;

        peer.on('open', () => {
          set({
            sessionCode: code,
            sessionRole: 'host',
            roomConnectionStatus: 'hosting',
            roomStatusMessage: `Live Room ${code} is OPEN! Share the Join Link or QR code with your players.`,
            connectedPeersCount: hostPeerConnections.size
          });
          broadcastRoomSync({ type: 'SYNC_STATE', state: getAuthoritativeRoomState() });
        });

        peer.on('connection', (conn) => {
          hostPeerConnections.set(conn.peer, conn);
          set({ connectedPeersCount: hostPeerConnections.size });

          conn.on('open', () => {
            set({ connectedPeersCount: hostPeerConnections.size });
            // Send current authoritative state immediately on link open
            try {
              conn.send({
                sessionCode: get().sessionCode,
                type: 'SYNC_STATE',
                state: getAuthoritativeRoomState()
              });
            } catch (e) {}
          });

          conn.on('data', (data) => {
            handleIncomingRoomPacket(data, conn);
          });

          conn.on('close', () => {
            hostPeerConnections.delete(conn.peer);
            set({ connectedPeersCount: hostPeerConnections.size });
          });

          conn.on('error', () => {
            hostPeerConnections.delete(conn.peer);
            set({ connectedPeersCount: hostPeerConnections.size });
          });
        });

        peer.on('error', (err) => {
          if (err && err.type === 'unavailable-id') {
            // Room code already taken on signaling server; generate a fresh one
            const fallbackCode = generateRandomRoomCode(5);
            get().hostLiveRoom(fallbackCode);
          } else {
            set({
              roomConnectionStatus: 'hosting',
              roomStatusMessage: `Room ${code} active (Local/Tab sync active; WebRTC note: ${err?.type || 'ready'}).`
            });
          }
        });
      } catch (e) {
        set({
          roomConnectionStatus: 'hosting',
          roomStatusMessage: `Room ${code} active.`
        });
      }

      return code;
    },

    // PLAYER ACTION: Join a DM's Live Room by Room Code + Character Name
    joinLiveRoom: async (inputCode, inputCharacterName) => {
      const code = String(inputCode || get().sessionCode || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
      const charName = String(inputCharacterName || '').trim();
      if (!code || !charName) return false;

      saveLocalJson('project_loot_session_code', code);
      saveLocalJson('project_loot_active_player', charName);

      // Clean up old peer connections
      if (clientHostConnection) {
        try { clientHostConnection.close(); } catch (e) {}
        clientHostConnection = null;
      }
      if (activePeerInstance) {
        try { activePeerInstance.destroy(); } catch (e) {}
        activePeerInstance = null;
      }

      const initialLocation = get().selectedSettlement ? `${get().selectedSettlement} • City Directory` : 'Cosmic Atlas • Multiverse';

      // Check if same-browser snapshot exists first
      const localSnapshot = loadLocalJson(`project_loot_room_${code}`, null);

      set((state) => {
        const nextMembers = state.partyMembers.includes(charName)
          ? state.partyMembers
          : [...state.partyMembers.filter(p => p !== 'DM'), charName];
        const nextLocs = {
          ...(localSnapshot?.playerLocations || state.playerLocations),
          [charName]: initialLocation
        };
        return {
          ...(localSnapshot || {}),
          sessionCode: code,
          sessionRole: 'player',
          activePlayer: charName,
          partyMembers: nextMembers,
          playerLocations: nextLocs,
          isPlayerLocked: true,
          playerHasJoinedLobby: true,
          roomConnectionStatus: 'connecting',
          roomStatusMessage: `Connecting to DM Room ${code} as ${charName}...`
        };
      });

      // 1. Announce join over same-browser BroadcastChannel immediately
      if (roomChannel) {
        try {
          roomChannel.postMessage({
            sessionCode: code,
            type: 'PLAYER_JOIN',
            playerName: charName,
            location: initialLocation,
            sender: charName,
            senderRole: 'player',
            timestamp: Date.now()
          });
        } catch (e) {}
      }

      // 2. Connect across devices via PeerJS WebRTC
      const PeerClass = await ensurePeerJsLoaded();
      if (!PeerClass) {
        set({
          roomConnectionStatus: 'connected',
          roomStatusMessage: `Joined Room ${code} as ${charName}`
        });
        return true;
      }

      try {
        const clientPeer = new PeerClass(undefined, { debug: 0 });
        activePeerInstance = clientPeer;

        clientPeer.on('open', () => {
          const targetHostId = `project-loot-room-${code}`;
          const conn = clientPeer.connect(targetHostId, { reliable: true });
          clientHostConnection = conn;

          conn.on('open', () => {
            set({
              roomConnectionStatus: 'connected',
              roomStatusMessage: `Connected live to DM Room ${code} as ${charName}`
            });
            try {
              conn.send({
                sessionCode: code,
                type: 'PLAYER_JOIN',
                playerName: charName,
                location: get().selectedSettlement ? `${get().selectedSettlement} • City Directory` : 'Cosmic Atlas • Multiverse',
                sender: charName,
                senderRole: 'player',
                timestamp: Date.now()
              });
            } catch (e) {}
          });

          conn.on('data', (data) => {
            handleIncomingRoomPacket(data, conn);
          });

          conn.on('close', () => {
            set({
              roomConnectionStatus: 'error',
              roomStatusMessage: `DM closed Room ${code} or connection dropped.`
            });
          });

          conn.on('error', () => {
            set({
              roomConnectionStatus: 'connected',
              roomStatusMessage: `Joined Room ${code} as ${charName}`
            });
          });
        });

        clientPeer.on('error', () => {
          // Even if WebRTC peer couldn't reach remote host (e.g. same-browser local testing without hostLiveRoom clicked yet), keep player in room
          set({
            roomConnectionStatus: 'connected',
            roomStatusMessage: `In Room ${code} as ${charName}`
          });
        });
      } catch (e) {
        set({
          roomConnectionStatus: 'connected',
          roomStatusMessage: `In Room ${code} as ${charName}`
        });
      }

      return true;
    },

    setRollResolutionMode: (mode) => {
      set({ rollResolutionMode: mode });
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { rollResolutionMode: mode } }), 0);
    },

    setSessionConfig: ({ sessionCode, sessionRole, syncRelayUrl }) => set((state) => {
      const code = (sessionCode || state.sessionCode || 'LOOT').toUpperCase().trim();
      const role = sessionRole || state.sessionRole || 'host';
      const relay = syncRelayUrl !== undefined ? syncRelayUrl : state.syncRelayUrl;
      saveLocalJson('project_loot_session_code', code);
      saveLocalJson('project_loot_relay_url', relay);
      const roomSnapshot = loadLocalJson(`project_loot_room_${code}`, null);
      if (roomSnapshot && role === 'player') {
        return {
          sessionCode: code,
          sessionRole: role,
          syncRelayUrl: relay,
          ...roomSnapshot
        };
      }
      return { sessionCode: code, sessionRole: role, syncRelayUrl: relay };
    }),

    pushRoomStateNow: () => {
      broadcastRoomSync({
        type: 'SYNC_STATE',
        state: getAuthoritativeRoomState()
      });
    },

    loadCustomCityPack: (packJson) => set((state) => {
      if (!packJson || !packJson.name || !Array.isArray(packJson.wards)) {
        return state;
      }
      const packId = packJson.id || packJson.name;
      const updatedPacks = {
        ...state.cityPacks,
        [packId]: packJson
      };
      const customOnly = { ...initialCustomPacks, [packId]: packJson };
      saveLocalJson('project_loot_custom_cities', customOnly);

      return {
        cityPacks: updatedPacks,
        activeCityPackId: packId,
        selectedPlanet: packJson.planet || state.selectedPlanet || 'Toril',
        selectedContinent: packJson.continent || state.selectedContinent || 'Faerûn',
        selectedRegion: packJson.region || state.selectedRegion || 'Sword Coast',
        selectedSettlement: packJson.name,
        selectedWard: null,
        selectedVenue: null,
        venueType: null,
        data: buildCombinedCityData(packJson)
      };
    }),

    toggleNodeHidden: (nodeKey) => set((state) => {
      if (!nodeKey) return state;
      const next = { ...state.hiddenNodes, [nodeKey]: !state.hiddenNodes[nodeKey] };
      if (!next[nodeKey]) delete next[nodeKey];
      saveLocalJson('project_loot_hidden_nodes', next);
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { hiddenNodes: next } }), 0);
      return { hiddenNodes: next };
    }),

    isNodeHidden: (nodeKey) => {
      const s = get();
      return Boolean(s.hiddenNodes[nodeKey]);
    },

    submitPendingCheck: (checkEntry) => set((state) => {
      const newCheck = {
        id: `chk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        player: checkEntry.player || state.activePlayer || 'Party',
        checkType: checkEntry.checkType || 'Skill Check',
        skillName: checkEntry.skillName || 'Check',
        d20: checkEntry.d20,
        mod: checkEntry.mod || 0,
        total: checkEntry.total,
        dc: checkEntry.dc || 15,
        venueName: checkEntry.venueName || (state.selectedVenue ? (state.selectedVenue['Shop Name'] || state.selectedVenue['Eatery Name']) : 'City'),
        itemName: checkEntry.itemName || null,
        dmPrompt: checkEntry.dmPrompt || 'Observe posture, weigh leverage, and adjudicate outcome.',
        dmConsequence: checkEntry.dmConsequence || 'Standard success or failure.',
        payload: checkEntry.payload || {}
      };
      const nextPending = [newCheck, ...state.pendingChecks];
      const nextLog = [
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: newCheck.timestamp,
          player: newCheck.player,
          action: `Pending ${newCheck.checkType}`,
          details: `Rolled ${newCheck.total} (d20: ${newCheck.d20}) on ${newCheck.skillName} at ${newCheck.venueName} — Awaiting DM`,
          type: 'pending'
        },
        ...(state.activityLog || [])
      ].slice(0, 100);
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { pendingChecks: nextPending, activityLog: nextLog } }), 0);
      return { pendingChecks: nextPending, activityLog: nextLog };
    }),

    resolvePendingCheck: (checkId, approved) => set((state) => {
      const target = state.pendingChecks.find(c => c.id === checkId);
      if (!target) return state;
      const remaining = state.pendingChecks.filter(c => c.id !== checkId);
      let nextUnlocked = { ...state.unlockedVaults };
      let nextLockedOut = { ...state.vaultLockedOut };
      let nextBanned = { ...state.bannedPlayersByVenue };

      if (target.checkType === 'Vault Access') {
        if (approved) {
          nextUnlocked[target.venueName] = true;
          nextLockedOut[target.venueName] = false;
        } else {
          nextLockedOut[target.venueName] = true;
          nextUnlocked[target.venueName] = false;
        }
      } else if (target.checkType === 'Heist Walk-Out' && !approved) {
        const curBanned = nextBanned[target.venueName] || [];
        if (!curBanned.includes(target.player)) {
          nextBanned[target.venueName] = [...curBanned, target.player];
        }
        nextLockedOut[target.venueName] = true;
      }

      const logEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        player: target.player,
        action: `DM ${approved ? 'Approved' : 'Denied'}: ${target.checkType}`,
        details: `${target.skillName} (Roll ${target.total} vs DC ${target.dc}) at ${target.venueName}${target.itemName ? ` • ${target.itemName}` : ''}`,
        type: approved ? 'success' : 'fail'
      };

      const nextLog = [logEntry, ...(state.activityLog || [])].slice(0, 100);
      setTimeout(() => broadcastRoomSync({
        type: 'SYNC_STATE',
        state: {
          pendingChecks: remaining,
          unlockedVaults: nextUnlocked,
          vaultLockedOut: nextLockedOut,
          bannedPlayersByVenue: nextBanned,
          activityLog: nextLog
        }
      }), 0);

      return {
        pendingChecks: remaining,
        unlockedVaults: nextUnlocked,
        vaultLockedOut: nextLockedOut,
        bannedPlayersByVenue: nextBanned,
        activityLog: nextLog
      };
    }),

    setActivePlayer: (player) => {
      saveLocalJson('project_loot_active_player', player);
      set({ activePlayer: player });
    },

    addPartyMember: (name) => set((state) => {
      const clean = (name || '').trim();
      if (!clean) return state;
      if (state.partyMembers.includes(clean)) {
        saveLocalJson('project_loot_active_player', clean);
        return { activePlayer: clean };
      }
      const nextMembers = [...state.partyMembers, clean];
      const nextLocs = { ...state.playerLocations, [clean]: `${state.selectedSettlement || 'Waterdeep'} • Directory` };
      saveLocalJson('project_loot_party_members', nextMembers);
      saveLocalJson('project_loot_active_player', clean);
      saveLocalJson('project_loot_player_locations', nextLocs);
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { partyMembers: nextMembers, playerLocations: nextLocs } }), 0);
      return { partyMembers: nextMembers, activePlayer: clean, playerLocations: nextLocs };
    }),

    removePartyMember: (name) => set((state) => {
      if (name === 'DM' && state.partyMembers.length === 1) return state;
      const nextMembers = state.partyMembers.filter(p => p !== name);
      if (nextMembers.length === 0) nextMembers.push('DM');
      const nextActive = state.activePlayer === name ? nextMembers[0] : state.activePlayer;
      const nextLocs = { ...state.playerLocations };
      delete nextLocs[name];
      saveLocalJson('project_loot_party_members', nextMembers);
      saveLocalJson('project_loot_active_player', nextActive);
      saveLocalJson('project_loot_player_locations', nextLocs);
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { partyMembers: nextMembers, playerLocations: nextLocs } }), 0);
      return { partyMembers: nextMembers, activePlayer: nextActive, playerLocations: nextLocs };
    }),

    resetPartyRoster: () => {
      const baseMembers = ['DM'];
      const baseLocs = { 'DM': 'Cosmic Atlas • Multiverse' };
      saveLocalJson('project_loot_party_members', baseMembers);
      saveLocalJson('project_loot_active_player', 'DM');
      saveLocalJson('project_loot_player_locations', baseLocs);
      set({ partyMembers: baseMembers, activePlayer: 'DM', playerLocations: baseLocs });
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { partyMembers: baseMembers, playerLocations: baseLocs } }), 0);
    },

    addActivityLog: (entry) => set((state) => {
      const nextLog = [
        {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          player: entry.player || state.activePlayer || 'Party',
          action: entry.action || 'Action',
          details: entry.details || '',
          type: entry.type || 'info'
        },
        ...(state.activityLog || [])
      ].slice(0, 100);
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { activityLog: nextLog } }), 0);
      return { activityLog: nextLog };
    }),

    toggleVenueDisabled: (venueName) => set((state) => {
      const current = Boolean(state.disabledVenues[venueName]);
      const updated = { ...state.disabledVenues, [venueName]: !current };
      const nodeKey = `venue::${venueName}`;
      const nextHidden = { ...state.hiddenNodes, [nodeKey]: !current };
      if (!nextHidden[nodeKey]) delete nextHidden[nodeKey];
      saveLocalJson('project_loot_hidden_nodes', nextHidden);
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { disabledVenues: updated, hiddenNodes: nextHidden } }), 0);
      return { disabledVenues: updated, hiddenNodes: nextHidden };
    }),

    banPlayerFromVenue: (venueName, playerName) => set((state) => {
      const currentBanned = state.bannedPlayersByVenue[venueName] || [];
      if (currentBanned.includes(playerName)) return state;
      const nextBanned = {
        ...state.bannedPlayersByVenue,
        [venueName]: [...currentBanned, playerName]
      };
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { bannedPlayersByVenue: nextBanned } }), 0);
      return { bannedPlayersByVenue: nextBanned };
    }),

    setPlanet: (planet) => set({ selectedPlanet: planet, selectedContinent: null, selectedRegion: null, selectedSettlement: null, selectedWard: null, selectedVenue: null, venueType: null }),
    setContinent: (continent) => set({ selectedContinent: continent, selectedRegion: null, selectedSettlement: null, selectedWard: null, selectedVenue: null, venueType: null }),
    setRegion: (region) => set({ selectedRegion: region, selectedSettlement: null, selectedWard: null, selectedVenue: null, venueType: null }),
    setSettlement: (settlement) => set((state) => {
      if (!settlement) {
        return { selectedSettlement: null, selectedWard: null, selectedVenue: null, venueType: null };
      }
      const matchedPack = state.cityPacks[settlement] || Object.values(state.cityPacks).find(
        p => (p.name || '').toLowerCase() === settlement.toLowerCase() || (p.id || '').toLowerCase() === settlement.toLowerCase()
      );
      const nextData = matchedPack ? buildCombinedCityData(matchedPack) : state.data;
      const nextPackId = matchedPack ? (matchedPack.id || matchedPack.name) : state.activeCityPackId;
      const nextLocs = {
        ...state.playerLocations,
        [state.activePlayer]: `${settlement} • City Directory`
      };
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { playerLocations: nextLocs } }), 0);
      return {
        selectedSettlement: settlement,
        activeCityPackId: nextPackId,
        data: nextData,
        selectedWard: null,
        selectedVenue: null,
        venueType: null,
        playerLocations: nextLocs
      };
    }),
    selectWard: (ward) => set((state) => {
      const nextLocs = {
        ...state.playerLocations,
        [state.activePlayer]: ward ? `${state.selectedSettlement || 'City'} • ${ward} District` : `${state.selectedSettlement || 'City'} • Directory`
      };
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { playerLocations: nextLocs } }), 0);
      return { selectedWard: ward, selectedVenue: null, venueType: 'shops', playerLocations: nextLocs };
    }),
    setVenueType: (type) => set({ venueType: type, selectedVenue: null }),
    selectVenue: (venue) => {
      if (!venue) {
        set({ selectedVenue: null });
        return;
      }
      const isEatery = Boolean(venue['Eatery Name'] || venue['Eatery Type']);
      const vName = venue['Shop Name'] || venue['Eatery Name'] || 'Venue';
      set((state) => {
        const nextLocs = {
          ...state.playerLocations,
          [state.activePlayer]: `${vName} (${state.selectedWard || 'City'})`
        };
        setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { playerLocations: nextLocs } }), 0);
        return { selectedVenue: venue, venueType: isEatery ? 'eateries' : 'shops', playerLocations: nextLocs };
      });
    },
    clearNavigation: () => set({ selectedWard: null, venueType: null, selectedVenue: null }),
    resetToCosmos: () => set({
      selectedPlanet: null,
      selectedContinent: null,
      selectedRegion: null,
      selectedSettlement: null,
      selectedWard: null,
      selectedVenue: null,
      venueType: null
    }),

    rerollStock: () => set((state) => {
      const nextSeed = (state.daySeed || 1) + 1;
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { daySeed: nextSeed, purchasedStock: {}, bannedPlayersByVenue: {} } }), 0);
      return {
        daySeed: nextSeed,
        purchasedStock: {},
        bannedPlayersByVenue: {}
      };
    }),

    addToCart: (itemInput, venueNameInput, maxStockInput) => set((state) => {
      if (!itemInput) return state;

      const itemName = itemInput['Item Name'] || itemInput.name || 'Unnamed Item';
      const itemCost = itemInput['Base Cost'] || itemInput.cost || '0 gp';
      const itemWeight = itemInput['Weight (lbs)'] || itemInput.weight || '0.5';
      const venue = venueNameInput || itemInput.venueName || (state.selectedVenue ? (state.selectedVenue['Shop Name'] || state.selectedVenue['Eatery Name']) : (state.selectedSettlement || 'Market'));
      const tier = itemInput.tier || (state.selectedVenue ? state.selectedVenue['Socioeconomic Tier'] : '3');

      const maxStock = typeof maxStockInput === 'number'
        ? maxStockInput
        : (typeof itemInput.maxStock === 'number'
            ? itemInput.maxStock
            : (typeof itemInput.quantity === 'number' ? itemInput.quantity : 99));

      const anomaly = (itemInput.flaw || itemInput.boon)
        ? { flaw: itemInput.flaw || null, boon: itemInput.boon || null }
        : generateAnomaly(itemInput, tier);

      const normalizedItem = {
        ...itemInput,
        'Item Name': itemName,
        name: itemName,
        'Base Cost': itemCost,
        cost: itemCost,
        'Weight (lbs)': itemWeight,
        weight: itemWeight,
        venueName: venue,
        maxStock: maxStock,
        shopper: itemInput.shopper || state.activePlayer || 'Party',
        flaw: anomaly.flaw,
        boon: anomaly.boon,
        haggledPrice: itemInput.haggledPrice !== undefined ? itemInput.haggledPrice : null,
        haggleStatus: itemInput.haggleStatus || null,
        hagglePrompt: itemInput.hagglePrompt || null
      };

      const existingIndex = state.cart.findIndex((c) => {
        const cName = c.item?.['Item Name'] || c.item?.name;
        const cVenue = c.venueName || c.item?.venueName;
        const cShopper = c.item?.shopper;
        const cPrice = c.item?.haggledPrice || c.item?.cost;
        const thisPrice = normalizedItem.haggledPrice || normalizedItem.cost;
        return cName === itemName && cVenue === venue && cShopper === normalizedItem.shopper && cPrice === thisPrice;
      });

      let nextCart;
      if (existingIndex > -1) {
        const existing = state.cart[existingIndex];
        const maxAllowed = existing.maxStock !== undefined ? existing.maxStock : maxStock;
        if (existing.quantity >= maxAllowed) return state;
        nextCart = [...state.cart];
        nextCart[existingIndex] = { ...existing, quantity: existing.quantity + 1 };
      } else {
        nextCart = [...state.cart, { item: normalizedItem, venueName: venue, quantity: 1, maxStock }];
      }

      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { cart: nextCart } }), 0);
      return { cart: nextCart };
    }),

    removeFromCart: (identifier) => set((state) => {
      const nextCart = state.cart.filter((c, idx) =>
        typeof identifier === 'number'
          ? idx !== identifier
          : (c.item?.['Item Name'] !== identifier && c.item?.name !== identifier)
      );
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { cart: nextCart } }), 0);
      return { cart: nextCart };
    }),

    updateQuantity: (identifier, targetQty) => set((state) => {
      const idx = typeof identifier === 'number'
        ? identifier
        : state.cart.findIndex(c => c.item?.['Item Name'] === identifier || c.item?.name === identifier);

      if (idx === -1 || !state.cart[idx]) return state;

      const qty = typeof targetQty === 'number' ? targetQty : 1;
      let nextCart;
      if (qty <= 0) {
        nextCart = state.cart.filter((_, i) => i !== idx);
      } else {
        nextCart = [...state.cart];
        const maxAllowed = nextCart[idx].maxStock !== undefined ? nextCart[idx].maxStock : 99;
        nextCart[idx] = { ...nextCart[idx], quantity: Math.min(qty, maxAllowed) };
      }
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { cart: nextCart } }), 0);
      return { cart: nextCart };
    }),

    clearCart: () => {
      set({ cart: [] });
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { cart: [] } }), 0);
    },

    completeCheckout: () => set((state) => {
      if (state.cart.length === 0) return state;
      const newPurchased = { ...(state.purchasedStock || {}) };

      state.cart.forEach((cartEntry) => {
        const vName = cartEntry.venueName || cartEntry.item?.venueName || (state.selectedVenue ? (state.selectedVenue['Shop Name'] || state.selectedVenue['Eatery Name']) : 'Market');
        const iName = cartEntry.item?.['Item Name'] || cartEntry.item?.name;
        if (vName && iName) {
          const key = `${vName}::${iName}`;
          newPurchased[key] = (newPurchased[key] || 0) + (cartEntry.quantity || 1);
        }
      });

      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { purchasedStock: newPurchased, cart: [] } }), 0);
      return {
        purchasedStock: newPurchased,
        cart: []
      };
    }),

    consumeMeal: (meal, eateryName) => set({
      activeMeal: { ...meal, eateryName, consumedAt: new Date().toLocaleTimeString() }
    }),

    clearActiveMeal: () => set({ activeMeal: null }),

    unlockVault: (shopName) => set((state) => {
      const nextU = { ...state.unlockedVaults, [shopName]: true };
      const nextL = { ...state.vaultLockedOut, [shopName]: false };
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { unlockedVaults: nextU, vaultLockedOut: nextL } }), 0);
      return { unlockedVaults: nextU, vaultLockedOut: nextL };
    }),

    lockOutVault: (shopName) => set((state) => {
      const nextL = { ...state.vaultLockedOut, [shopName]: true };
      const nextU = { ...state.unlockedVaults, [shopName]: false };
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { unlockedVaults: nextU, vaultLockedOut: nextL } }), 0);
      return { vaultLockedOut: nextL, unlockedVaults: nextU };
    }),

    relockVault: (shopName) => set((state) => {
      const nextU = { ...state.unlockedVaults, [shopName]: false };
      const nextL = { ...state.vaultLockedOut, [shopName]: false };
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { unlockedVaults: nextU, vaultLockedOut: nextL } }), 0);
      return { unlockedVaults: nextU, vaultLockedOut: nextL };
    }),

    dismissItemAnomaly: (cartIdx) => set((state) => {
      if (!state.cart[cartIdx]) return state;
      const updated = [...state.cart];
      updated[cartIdx] = {
        ...updated[cartIdx],
        item: { ...updated[cartIdx].item, flaw: null, boon: null }
      };
      setTimeout(() => broadcastRoomSync({ type: 'SYNC_STATE', state: { cart: updated } }), 0);
      return { cart: updated };
    }),

    getAdjustedPrice: (costStr, tier) => getAdjustedPrice(costStr, tier),
    formatGoldCost: (cost) => formatGoldCost(cost)
  };
});

export const useKioskStore = useLootStore;
