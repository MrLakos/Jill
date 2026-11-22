export type BookTab =
  | 'story'
  | 'diary'
  | 'quests'
  | 'map'
  | 'characters'
  | 'inventory'
  | 'skills'
  | 'settings';

export type SkillKey = 'mechanics' | 'stealth' | 'combat' | 'medium';

export type RightMode =
  | 'narrative'
  | 'trade'
  | 'combat'
  | 'lockpick'
  | 'resonance'
  | 'ending';

export type SceneArtId =
  | 'bar_admiral'
  | 'bar_brawl'
  | 'storeroom'
  | 'jill_john_bond'
  | 'silver_pouring'
  | 'silver_smoking'
  | 'flint_parlor'
  | 'scrapyard'
  | 'submarine_dock'
  | 'whispering_reef'
  | 'sunken_wreck'
  | 'imperial_patrol'
  | 'mutant_trench'
  | 'atlantis_gate'
  | 'bounty_ambush';

export type PortraitId =
  | 'jill'
  | 'john'
  | 'silver'
  | 'flint'
  | 'salli'
  | 'krag'
  | 'morven'
  | 'vex'
  | 'enemy_thug'
  | 'enemy_imperial'
  | 'enemy_bounty'
  | 'enemy_mutant'
  | 'enemy_abyssal';

export interface InventoryItem {
  id: string;
  name: string;
  category: 'tool' | 'part' | 'consumable' | 'artifact' | 'document';
  description: string;
  jillNote: string;
  quantity: number;
  price: number;
  icon: string;
  effect?: {
    hp?: number;
    johnHp?: number;
    energy?: number;
    sanity?: number;
    oxygen?: number;
    hull?: number;
    combatDamage?: number;
    combatStun?: boolean;
  };
  droidSlot?: DroidSlotKey;
  droidBonus?: {
    maxHp?: number;
    attack?: number;
    armor?: number;
    stealth?: number;
    specialAbility?: string;
    memoryFragment?: string;
  };
}

export type DroidSlotKey = 'servo' | 'armor' | 'arm' | 'lantern' | 'core';

export interface CrewMember {
  id: 'krag' | 'salli' | 'morven' | 'vex';
  name: string;
  role: string;
  portrait: PortraitId;
  hp: number;
  maxHp: number;
  morale: number; // 0..100
  loyalty: number; // -100..100
  hired: boolean;
  hireCost: number;
  publicBio: string;
  hiddenSecret: string;
  secretRevealed: boolean;
  combatBonus: string;
  attackPower: number;
  passiveBonus: {
    oxygenSave?: number;
    sanityRegen?: number;
    scrapBonus?: number;
    stealthBonus?: number;
    combatAttack?: number;
  };
}

export interface DiaryEntry {
  id: string;
  day: number;
  weekday: string;
  title: string;
  jillText: string[];
  hiddenTruthHint: string;
  sketchLabel: string;
  photoArt: SceneArtId;
  unlockedAt: number;
}

export interface DiaryConclusion {
  id: string;
  text: string;
  checked: boolean;
  category: 'mystery' | 'john' | 'flint' | 'atlantis';
}

export interface Quest {
  id: string;
  title: string;
  type: 'main' | 'side' | 'expedition';
  giver: string;
  description: string;
  objective: string;
  completed: boolean;
  rewardText: string;
}

export interface StoryChoice {
  id: string;
  label: string;
  icon?: 'talk' | 'gear' | 'coin' | 'stealth' | 'combat' | 'medium' | 'move' | 'lock' | 'moral';
  primary?: boolean;
  styleTag?: 'Скрытно' | 'Бой' | 'Механика' | 'Медиум' | 'Торг' | 'Мораль';
  reqSkill?: { skill: SkillKey; level: number };
  reqItem?: string;
  reqFlag?: string;
  hideIfFlag?: string;
  costCoins?: number;
  costScrap?: number;
  costEnergy?: number;
  disabledReason?: string;
  action: ChoiceAction;
}

export type ChoiceAction =
  | { type: 'goto_scene'; sceneId: string; logNote?: string }
  | { type: 'start_lockpick'; lockId: string; difficulty: number; pins: number; onSuccessScene: string; onFailScene?: string; rewardScrap?: number; rewardCoins?: number; rewardItem?: string; title: string }
  | { type: 'start_resonance'; puzzleId: string; difficulty: number; onSuccessScene: string; onFailScene?: string; title: string; subtitle: string }
  | { type: 'start_combat'; encounterId: string; title: string; sceneArt: SceneArtId; enemies: EnemyTemplate[]; onVictoryScene: string; onRetreatScene: string; rewardCoins: number; rewardScrap: number; rewardXp: number; rewardItem?: string; canRetreat?: boolean }
  | { type: 'open_trade'; merchantId: 'silver' | 'gaika' | 'salli' }
  | { type: 'open_map' }
  | { type: 'advance_expedition'; option: 'stealth' | 'combat' | 'salvage' | 'medium' | 'mercy' | 'ruthless' }
  | { type: 'finish_expedition' }
  | { type: 'trigger_ending'; endingId: EndingId }
  | { type: 'custom'; handlerId: string };

export interface NpcDialogueState {
  speaker: string;
  portrait: PortraitId;
  text: string;
  mood?: string;
}

export interface StoryScene {
  id: string;
  chapterLabel: string;
  title: string;
  locationId: HubLocationId | 'expedition';
  art: SceneArtId;
  paragraphs: string[];
  npc?: NpcDialogueState;
  merchantId?: 'silver' | 'gaika' | 'salli';
  choices: StoryChoice[];
  onEnterFlags?: string[];
  diaryUnlockId?: string;
  inspectText?: string;
  vignette?: 'keys' | 'cylinder' | 'mug' | 'octopus' | 'submarine' | 'compass';
}

export type HubLocationId = 'bar_admiral' | 'scrapyard' | 'submarine_dock' | 'whispering_reef';

export interface EnemyTemplate {
  id: string;
  name: string;
  role: string;
  portrait: PortraitId;
  maxHp: number;
  attack: number;
  armor: number;
  sanityDamage?: number;
  intents: EnemyIntentType[];
}

export type EnemyIntentType = 'strike' | 'heavy' | 'guard' | 'whisper' | 'debuff';

export interface CombatEnemy extends EnemyTemplate {
  uid: string;
  hp: number;
  block: number;
  stunned: boolean;
  distracted: boolean;
  currentIntent: EnemyIntentType;
  intentIndex: number;
}

export interface CombatState {
  encounterId: string;
  title: string;
  sceneArt: SceneArtId;
  turn: number;
  phase: 'jill_turn' | 'john_turn' | 'enemy_turn' | 'victory' | 'defeat';
  selectedEnemyUid: string;
  jillBlock: number;
  johnBlock: number;
  stealthCharge: number; // builds up when distracting/hiding for big strike or clean escape
  enemies: CombatEnemy[];
  combatLog: string[];
  onVictoryScene: string;
  onRetreatScene: string;
  rewardCoins: number;
  rewardScrap: number;
  rewardXp: number;
  rewardItem?: string;
  canRetreat: boolean;
  lastHitTarget?: string;
}

export interface LockpickState {
  lockId: string;
  title: string;
  difficulty: number;
  pins: number;
  onSuccessScene: string;
  onFailScene?: string;
  rewardScrap?: number;
  rewardCoins?: number;
  rewardItem?: string;
}

export interface ResonanceState {
  puzzleId: string;
  title: string;
  subtitle: string;
  difficulty: number;
  onSuccessScene: string;
  onFailScene?: string;
}

export type SectorType =
  | 'salvage'
  | 'imperial'
  | 'bounty'
  | 'mutant'
  | 'atlantis_ruin'
  | 'atlantis_vault';

export interface ProceduralSector {
  id: string;
  name: string;
  depthMeters: number;
  type: SectorType;
  danger: 1 | 2 | 3 | 4 | 5;
  oxygenCost: number;
  description: string;
  rewardPreview: string;
  grantsKey: boolean;
  completed: boolean;
  unlocked: boolean;
  x: number; // % coordinate on sonar chart
  y: number; // % coordinate on sonar chart
  art: SceneArtId;
  stages: ExpeditionStage[];
}

export interface ExpeditionStage {
  id: string;
  title: string;
  narrative: string[];
  art: SceneArtId;
  npc?: NpcDialogueState;
  type: 'choice' | 'lock' | 'resonance' | 'combat' | 'moral';
  enemies?: EnemyTemplate[];
  lockPins?: number;
  rewardScrap: number;
  rewardCoins: number;
  rewardXp: number;
  rewardItem?: string;
}

export interface ActiveExpedition {
  sectorId: string;
  stageIndex: number;
  oxygen: number;
  maxOxygen: number;
  hull: number;
  maxHull: number;
  collectedScrap: number;
  collectedCoins: number;
  collectedXp: number;
  stealthRun: boolean;
  statusNote: string;
}

export type EndingId =
  | 'light_in_the_deep'
  | 'smuggler_queen'
  | 'whisper_of_atlantis'
  | 'iron_protocol_j17';

export interface GameState {
  started: boolean;
  seed: number;
  day: number;
  activeTab: BookTab;
  rightMode: RightMode;
  currentSceneId: string;
  currentLocation: HubLocationId;

  // Core Hero & Party Resources
  jillHp: number;
  jillMaxHp: number;
  johnHp: number;
  johnMaxHp: number;
  energy: number;
  maxEnergy: number;
  sanity: number;
  maxSanity: number;
  scrap: number;
  coins: number;

  // Progression
  xp: number;
  skillPoints: number;
  skills: Record<SkillKey, number>;

  // Morality & Hidden Narrative Axes
  compassion: number; // -100 (Ruthless/Flint) to +100 (Compassionate/Silver)
  abyssAffinity: number; // 0 to 100 (Medium / Eldritch attunement)
  atlantisKeys: number; // Need 3 to unlock Atlantis Vault
  johnMemoryRestored: number; // 0..5 installed parts

  // Little John Modular Chassis
  droidSlots: Record<DroidSlotKey, string | null>; // item ids

  // Inventory, Crew, Quests, Diary
  inventory: InventoryItem[];
  crew: CrewMember[];
  quests: Quest[];
  diaryEntries: DiaryEntry[];
  diaryConclusions: DiaryConclusion[];
  flags: Record<string, boolean>;

  // Procedural World
  sectors: ProceduralSector[];
  activeExpedition: ActiveExpedition | null;

  // Dynamic Overlays / Sub-states
  activeMerchant: 'silver' | 'gaika' | 'salli' | null;
  activeCombat: CombatState | null;
  activeLockpick: LockpickState | null;
  activeResonance: ResonanceState | null;
  activeEnding: EndingId | null;
  selectedItemId: string | null;
  rightActionTab: 'talk' | 'trade' | 'inspect' | 'use';
  feedbackBanner: { text: string; tone: 'info' | 'good' | 'warn' | 'abyss' } | null;
  soundEnabled: boolean;
  unreadDiary: boolean;
}
