import React, { useEffect, useState } from 'react';
import {
  BookTab,
  CombatEnemy,
  CombatState,
  EnemyTemplate,
  GameState,
  HubLocationId,
  InventoryItem,
  SkillKey,
  StoryChoice,
} from './types/game';
import {
  INITIAL_CREW,
  INITIAL_INVENTORY,
  ITEM_CATALOG,
} from './data/itemsAndUpgrades';
import {
  DIARY_LIBRARY,
  ENDINGS,
  INITIAL_DIARY_CONCLUSIONS,
  INITIAL_QUESTS,
  STORY_SCENES,
} from './data/storyAndNpcs';
import { generateProceduralSectors } from './data/proceduralWorld';
import { BookShell } from './components/BookShell';
import { LeftNarrativePage } from './components/LeftNarrativePage';
import { RightActivityStage } from './components/RightActivityStage';
import { TitleCover } from './components/TitleCover';
import {
  buildCharactersSpread,
  buildQuestsSpread,
  buildSkillsSpread,
  useDiarySpread,
  useInventorySpread,
  useMapSpread,
  useSettingsSpread,
} from './components/BookOverlays';
import { sfx } from './utils/sound';

const SAVE_KEY = 'abyss_chronicles_admiral_save_v1';

function createInitialState(seed: number, started = false): GameState {
  return {
    started,
    seed,
    day: 14,
    activeTab: 'story',
    rightMode: 'narrative',
    currentSceneId: 'bar_intro',
    currentLocation: 'bar_admiral',

    jillHp: 12,
    jillMaxHp: 12,
    johnHp: 22,
    johnMaxHp: 22,
    energy: 8,
    maxEnergy: 8,
    sanity: 100,
    maxSanity: 100,
    scrap: 25,
    coins: 132,

    xp: 0,
    skillPoints: 1, // Let player pick their first specialization right away!
    skills: {
      mechanics: 1,
      stealth: 0,
      combat: 0,
      medium: 1,
    },

    compassion: 10,
    abyssAffinity: 10,
    atlantisKeys: 0,
    johnMemoryRestored: 0,

    droidSlots: {
      servo: null,
      armor: null,
      arm: null,
      lantern: null,
      core: null,
    },

    inventory: INITIAL_INVENTORY.map((i) => ({ ...i })),
    crew: INITIAL_CREW.map((c) => ({ ...c })),
    quests: INITIAL_QUESTS.map((q) => ({ ...q })),
    diaryEntries: [{ ...DIARY_LIBRARY.d_intro, unlockedAt: Date.now() }],
    diaryConclusions: INITIAL_DIARY_CONCLUSIONS.map((c) => ({ ...c })),
    flags: {},

    sectors: generateProceduralSectors(seed),
    activeExpedition: null,

    activeMerchant: null,
    activeCombat: null,
    activeLockpick: null,
    activeResonance: null,
    activeEnding: null,
    selectedItemId: 'brass_cylinder',
    rightActionTab: 'talk',
    feedbackBanner: null,
    soundEnabled: true,
    unreadDiary: false,
  };
}

function addItemToList(list: InventoryItem[], itemId: string, qty = 1): InventoryItem[] {
  const catalog = ITEM_CATALOG[itemId];
  if (!catalog) return list;
  const existing = list.find((i) => i.id === itemId);
  if (existing) {
    return list.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity + qty } : i));
  }
  return [...list, { ...catalog, quantity: qty }];
}

function removeItemFromList(list: InventoryItem[], itemId: string, qty = 1): InventoryItem[] {
  return list
    .map((i) => (i.id === itemId ? { ...i, quantity: i.quantity - qty } : i))
    .filter((i) => i.quantity > 0);
}

function awardXpState(state: GameState, amount: number): Pick<GameState, 'xp' | 'skillPoints'> {
  const prevLevels = Math.floor(state.xp / 60);
  const nextXp = state.xp + amount;
  const nextLevels = Math.floor(nextXp / 60);
  return {
    xp: nextXp,
    skillPoints: state.skillPoints + Math.max(0, nextLevels - prevLevels),
  };
}

function unlockDiary(state: GameState, diaryId: string): Partial<GameState> {
  const tpl = DIARY_LIBRARY[diaryId];
  if (!tpl || state.diaryEntries.some((d) => d.id === diaryId)) return {};
  return {
    diaryEntries: [...state.diaryEntries, { ...tpl, unlockedAt: Date.now() }],
    unreadDiary: true,
  };
}

function checkConclusion(state: GameState, conclusionId: string) {
  return state.diaryConclusions.map((c) =>
    c.id === conclusionId ? { ...c, checked: true } : c
  );
}

function buildCombatEnemies(templates: EnemyTemplate[]): CombatEnemy[] {
  return templates.map((tpl, idx) => ({
    ...tpl,
    uid: `${tpl.id}_${idx}_${Date.now()}`,
    hp: tpl.maxHp,
    block: 0,
    stunned: false,
    distracted: false,
    currentIntent: tpl.intents[0] || 'strike',
    intentIndex: 0,
  }));
}

export default function App() {
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [state, setState] = useState<GameState>(() => createInitialState(4821, false));

  // Check for existing save on boot
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GameState;
        if (parsed && parsed.seed && parsed.currentSceneId) {
          setHasSavedGame(true);
        }
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  // Auto-save whenever playing
  useEffect(() => {
    sfx.enabled = state.soundEnabled;
    if (!state.started) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      setHasSavedGame(true);
    } catch {
      // ignore quota
    }
  }, [state]);

  const handleContinueSaved = () => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as GameState;
        setState({ ...parsed, started: true });
        return;
      }
    } catch {
      // fallback to fresh start
    }
    setState(createInitialState(4821, true));
  };

  const handleStartNew = (seed: number) => {
    const fresh = createInitialState(seed, true);
    setState(fresh);
  };

  // === HUB NAVIGATION & SCENE TRANSITION ===
  const goToScene = (sceneId: string, banner?: GameState['feedbackBanner']) => {
    const nextScene = STORY_SCENES[sceneId];
    if (!nextScene) return;
    sfx.playPageTurn();

    setState((prev) => {
      const nextFlags = { ...prev.flags };
      if (nextScene.onEnterFlags) {
        nextScene.onEnterFlags.forEach((f) => {
          nextFlags[f] = true;
        });
      }
      const diaryPatch = nextScene.diaryUnlockId ? unlockDiary(prev, nextScene.diaryUnlockId) : {};
      return {
        ...prev,
        ...diaryPatch,
        activeTab: 'story',
        rightMode: 'narrative',
        activeMerchant: null,
        activeCombat: null,
        activeLockpick: null,
        activeResonance: null,
        currentSceneId: sceneId,
        currentLocation:
          nextScene.locationId !== 'expedition' ? nextScene.locationId : prev.currentLocation,
        flags: nextFlags,
        rightActionTab: 'talk',
        feedbackBanner: banner ?? null,
      };
    });
  };

  const handleTravelHub = (loc: HubLocationId) => {
    const sceneMap: Record<HubLocationId, string> = {
      bar_admiral: 'bar_intro',
      scrapyard: 'scrapyard_hub',
      submarine_dock: 'submarine_dock_hub',
      whispering_reef: 'whispering_reef_hub',
    };
    goToScene(sceneMap[loc]);
  };

  // === START PROCEDURAL EXPEDITION ===
  const handleStartExpedition = (sectorId: string) => {
    setState((prev) => {
      const sector = prev.sectors.find((s) => s.id === sectorId);
      if (!sector) return prev;
      const vexHired = prev.crew.some((c) => c.id === 'vex' && c.hired);
      const maxO2 = vexHired ? 115 : 100;
      return {
        ...prev,
        activeTab: 'story',
        rightMode: 'narrative',
        rightActionTab: 'talk',
        activeExpedition: {
          sectorId,
          stageIndex: 0,
          oxygen: maxO2,
          maxOxygen: maxO2,
          hull: 100,
          maxHull: 100,
          collectedScrap: 0,
          collectedCoins: 0,
          collectedXp: 0,
          stealthRun: true,
          statusNote: `Погружение к сектору «${sector.name}» начато!`,
        },
        feedbackBanner: {
          text: `Субмарина «Абиссаль» погружается на глубину ${sector.depthMeters} м.`,
          tone: 'abyss',
        },
      };
    });
  };

  // === ADVANCE PROCEDURAL EXPEDITION STAGE ===
  const advanceExpeditionStage = (
    prev: GameState,
    extra: {
      scrap?: number;
      coins?: number;
      xp?: number;
      o2Delta?: number;
      hullDelta?: number;
      sanityDelta?: number;
      compassionDelta?: number;
      abyssDelta?: number;
      itemId?: string;
      stealthBroken?: boolean;
      bannerText?: string;
      bannerTone?: 'info' | 'good' | 'warn' | 'abyss';
    }
  ): GameState => {
    const exp = prev.activeExpedition;
    if (!exp) return prev;
    const sector = prev.sectors.find((s) => s.id === exp.sectorId);
    if (!sector) return prev;

    const salliHired = prev.crew.some((c) => c.id === 'salli' && c.hired);
    const morvenHired = prev.crew.some((c) => c.id === 'morven' && c.hired);
    const scrapGain = (extra.scrap ?? 0) + (salliHired && extra.scrap ? 4 : 0);
    const coinsGain = extra.coins ?? 0;
    const xpGain = extra.xp ?? 0;
    const nextO2 = Math.max(0, Math.min(exp.maxOxygen, exp.oxygen + (extra.o2Delta ?? -14)));
    const nextHull = Math.max(10, Math.min(exp.maxHull, exp.hull + (extra.hullDelta ?? 0)));
    const nextSanity = Math.max(
      10,
      Math.min(prev.maxSanity, prev.sanity + (extra.sanityDelta ?? 0) + (morvenHired ? 8 : 0))
    );
    const nextJillHp = Math.min(prev.jillMaxHp, prev.jillHp + (morvenHired ? 2 : 0));

    let nextInventory = prev.inventory;
    if (extra.itemId) {
      nextInventory = addItemToList(nextInventory, extra.itemId, 1);
    }

    const nextStageIndex = exp.stageIndex + 1;
    const finishedSector = nextStageIndex >= sector.stages.length;

    // If this was the final Atlantis Vault sector!
    if (finishedSector && sector.type === 'atlantis_vault') {
      const xpPatch = awardXpState(prev, xpGain);
      return {
        ...prev,
        ...xpPatch,
        scrap: prev.scrap + scrapGain,
        coins: prev.coins + coinsGain,
        sanity: nextSanity,
        jillHp: nextJillHp,
        compassion: prev.compassion + (extra.compassionDelta ?? 0),
        abyssAffinity: Math.min(100, prev.abyssAffinity + (extra.abyssDelta ?? 0)),
        inventory: nextInventory,
        activeExpedition: null,
        rightMode: 'narrative',
        activeCombat: null,
        currentSceneId: 'atlantis_climax',
        feedbackBanner: {
          text: 'Страж повержен! Врата Затерянной Атлантиды открываются перед вами...',
          tone: 'abyss',
        },
      };
    }

    if (finishedSector) {
      const alreadyDone = sector.completed;
      const grantKeyNow = sector.grantsKey && !alreadyDone;
      const nextKeys = Math.min(3, prev.atlantisKeys + (grantKeyNow ? 1 : 0));
      const xpPatch = awardXpState(prev, xpGain + 20);
      const diaryPatch = unlockDiary(prev, 'd_expedition_first');
      const updatedSectors = prev.sectors.map((s) =>
        s.id === sector.id
          ? { ...s, completed: true }
          : s.type === 'atlantis_vault' && nextKeys >= 3
          ? { ...s, unlocked: true }
          : s
      );
      const updatedConclusions =
        nextKeys >= 3 ? checkConclusion(prev, 'c_atlantis') : prev.diaryConclusions;
      const updatedQuests = prev.quests.map((q) =>
        q.id === 'q_atlantis_keys' && nextKeys >= 3 ? { ...q, completed: true } : q
      );

      return {
        ...prev,
        ...xpPatch,
        ...diaryPatch,
        day: prev.day + 1,
        scrap: prev.scrap + scrapGain,
        coins: prev.coins + coinsGain,
        sanity: nextSanity,
        jillHp: nextJillHp,
        energy: prev.maxEnergy,
        compassion: prev.compassion + (extra.compassionDelta ?? 0),
        abyssAffinity: Math.min(100, prev.abyssAffinity + (extra.abyssDelta ?? 0)),
        atlantisKeys: nextKeys,
        inventory: nextInventory,
        sectors: updatedSectors,
        diaryConclusions: updatedConclusions,
        quests: updatedQuests,
        activeExpedition: null,
        rightMode: 'narrative',
        activeCombat: null,
        activeLockpick: null,
        activeResonance: null,
        currentSceneId: 'submarine_dock_hub',
        currentLocation: 'submarine_dock',
        feedbackBanner: {
          text: grantKeyNow
            ? `Экспедиция завершена! Добыт Ключ Бездны (${nextKeys}/3), +${coinsGain} дублонов и +${scrapGain} деталей!`
            : `Возвращение в Грот! Добыча: +${coinsGain} дублонов, +${scrapGain} деталей.`,
          tone: 'good',
        },
      };
    }

    const xpPatch = awardXpState(prev, xpGain);
    return {
      ...prev,
      ...xpPatch,
      scrap: prev.scrap + scrapGain,
      coins: prev.coins + coinsGain,
      sanity: nextSanity,
      jillHp: nextJillHp,
      compassion: prev.compassion + (extra.compassionDelta ?? 0),
      abyssAffinity: Math.min(100, prev.abyssAffinity + (extra.abyssDelta ?? 0)),
      inventory: nextInventory,
      rightMode: 'narrative',
      activeCombat: null,
      activeLockpick: null,
      activeResonance: null,
      activeExpedition: {
        ...exp,
        stageIndex: nextStageIndex,
        oxygen: nextO2,
        hull: nextHull,
        collectedScrap: exp.collectedScrap + scrapGain,
        collectedCoins: exp.collectedCoins + coinsGain,
        collectedXp: exp.collectedXp + xpGain,
        stealthRun: exp.stealthRun && !extra.stealthBroken,
      },
      feedbackBanner: extra.bannerText
        ? { text: extra.bannerText, tone: extra.bannerTone ?? 'info' }
        : null,
    };
  };

  // === HANDLE CHOICE CLICK ===
  const handleChoice = (choice: StoryChoice) => {
    const act = choice.action;

    // Deduct upfront costs if specified
    if (choice.costCoins || choice.costEnergy) {
      setState((prev) => ({
        ...prev,
        coins: Math.max(0, prev.coins - (choice.costCoins ?? 0)),
        energy: Math.max(0, prev.energy - (choice.costEnergy ?? 0)),
      }));
    }

    if (act.type === 'goto_scene') {
      goToScene(act.sceneId);
      return;
    }

    if (act.type === 'open_trade') {
      setState((prev) => ({
        ...prev,
        rightMode: 'trade',
        activeMerchant: act.merchantId,
      }));
      return;
    }

    if (act.type === 'open_map') {
      sfx.playPageTurn();
      setState((prev) => ({ ...prev, activeTab: 'map' }));
      return;
    }

    if (act.type === 'start_lockpick') {
      setState((prev) => ({
        ...prev,
        rightMode: 'lockpick',
        activeLockpick: {
          lockId: act.lockId,
          title: act.title,
          difficulty: act.difficulty,
          pins: act.pins,
          onSuccessScene: act.onSuccessScene,
          onFailScene: act.onFailScene,
          rewardScrap: act.rewardScrap,
          rewardCoins: act.rewardCoins,
          rewardItem: act.rewardItem,
        },
        feedbackBanner: { text: 'Осторожно нащупывай каждый штифт замка.', tone: 'info' },
      }));
      return;
    }

    if (act.type === 'start_resonance') {
      sfx.playSonarPing();
      setState((prev) => ({
        ...prev,
        rightMode: 'resonance',
        activeResonance: {
          puzzleId: act.puzzleId,
          title: act.title,
          subtitle: act.subtitle,
          difficulty: act.difficulty,
          onSuccessScene: act.onSuccessScene,
          onFailScene: act.onFailScene,
        },
      }));
      return;
    }

    if (act.type === 'start_combat') {
      sfx.playHit(true);
      const enemies = buildCombatEnemies(act.enemies);
      setState((prev) => ({
        ...prev,
        rightMode: 'combat',
        activeCombat: {
          encounterId: act.encounterId,
          title: act.title,
          sceneArt: act.sceneArt,
          turn: 1,
          phase: 'jill_turn',
          selectedEnemyUid: enemies[0]?.uid || '',
          jillBlock: 0,
          johnBlock: 0,
          stealthCharge: 0,
          enemies,
          combatLog: ['Бой начался! Сначала действует Джил, затем Маленький Джон.'],
          onVictoryScene: act.onVictoryScene,
          onRetreatScene: act.onRetreatScene,
          rewardCoins: act.rewardCoins,
          rewardScrap: act.rewardScrap,
          rewardXp: act.rewardXp,
          rewardItem: act.rewardItem,
          canRetreat: act.canRetreat ?? true,
        },
        feedbackBanner: { text: 'Тактический бой! Следите за намерениями врагов справа.', tone: 'warn' },
      }));
      return;
    }

    if (act.type === 'trigger_ending') {
      sfx.playLockOpen();
      setState((prev) => ({
        ...prev,
        rightMode: 'ending',
        activeEnding: act.endingId,
        feedbackBanner: null,
      }));
      return;
    }

    if (act.type === 'advance_expedition') {
      setState((prev) => {
        const exp = prev.activeExpedition;
        if (!exp) return prev;
        const sector = prev.sectors.find((s) => s.id === exp.sectorId);
        const stage = sector?.stages[exp.stageIndex];
        if (!sector || !stage) return prev;

        if (act.option === 'stealth') {
          sfx.playClick();
          return advanceExpeditionStage(prev, {
            scrap: stage.rewardScrap,
            coins: stage.rewardCoins,
            xp: stage.rewardXp + 10,
            o2Delta: -12,
            bannerText: 'Вы бесшумно обошли угрозу по обходному коллектору и забрали тайник!',
            bannerTone: 'good',
          });
        }
        if (act.option === 'salvage') {
          sfx.playWrench();
          return advanceExpeditionStage(prev, {
            scrap: stage.rewardScrap + 8,
            coins: stage.rewardCoins,
            xp: stage.rewardXp,
            o2Delta: -18,
            hullDelta: -8,
            bannerText: 'Джон вырезал богатую добычу латуни, но давление помяло обшивку!',
            bannerTone: 'info',
          });
        }
        if (act.option === 'mercy') {
          sfx.playCoin();
          return advanceExpeditionStage(prev, {
            scrap: stage.rewardScrap,
            coins: stage.rewardCoins + 15,
            xp: stage.rewardXp + 15,
            compassionDelta: 20,
            o2Delta: -16,
            bannerText: 'Вы спасли пленного ныряльщика! В благодарность он поделился дублонами и картой (+20 Милосердие).',
            bannerTone: 'good',
          });
        }
        if (act.option === 'ruthless') {
          sfx.playClick();
          return advanceExpeditionStage(prev, {
            scrap: stage.rewardScrap + 12,
            coins: stage.rewardCoins + 35,
            xp: stage.rewardXp,
            compassionDelta: -22,
            o2Delta: -8,
            bannerText: 'Вы послушали Флинта и тихо обчистили тайник, оставив ныряльщика в беде (-22 Милосердие, +богатый лут).',
            bannerTone: 'warn',
          });
        }
        if (act.option === 'medium') {
          sfx.playAbyssWhisper();
          return advanceExpeditionStage(prev, {
            scrap: stage.rewardScrap,
            coins: stage.rewardCoins + 10,
            xp: stage.rewardXp + 20,
            abyssDelta: 15,
            sanityDelta: -10,
            itemId: stage.rewardItem,
            bannerText: 'Дар Медиума усмирил древний механизм! Бездна шепчет вам тайные знания.',
            bannerTone: 'abyss',
          });
        }
        return prev;
      });
      return;
    }

    if (act.type === 'finish_expedition') {
      sfx.playPageTurn();
      setState((prev) => ({
        ...prev,
        activeExpedition: null,
        rightMode: 'narrative',
        currentSceneId: 'submarine_dock_hub',
        currentLocation: 'submarine_dock',
        feedbackBanner: { text: 'Вы вернулись в Подводный Грот на борту «Абиссали».', tone: 'info' },
      }));
      return;
    }

    // Custom rich story event handlers
    if (act.type === 'custom') {
      handleCustomStoryEvent(act.handlerId);
    }
  };

  const handleCustomStoryEvent = (handlerId: string) => {
    setState((prev) => {
      switch (handlerId) {
        case 'return_silver_watch': {
          sfx.playLockOpen();
          const xpPatch = awardXpState(prev, 40);
          const diaryPatch = unlockDiary(prev, 'd_silver_secret');
          return {
            ...prev,
            ...xpPatch,
            ...diaryPatch,
            inventory: removeItemFromList(prev.inventory, 'silver_watch', 1),
            compassion: prev.compassion + 25,
            sanity: prev.maxSanity,
            flags: { ...prev.flags, silver_watch_returned: true },
            diaryConclusions: checkConclusion(prev, 'c_silver'),
            quests: prev.quests.map((q) => (q.id === 'q_silver_watch' ? { ...q, completed: true } : q)),
            feedbackBanner: {
              text: 'Сильвер растрогался и раскрыл секрет повязки! +25 Милосердие, +40 XP, новая запись в Дневнике!',
              tone: 'good',
            },
          };
        }
        case 'claim_cylinder_vision': {
          const xpPatch = awardXpState(prev, 20);
          return {
            ...prev,
            ...xpPatch,
            abyssAffinity: Math.min(100, prev.abyssAffinity + 10),
            sanity: Math.max(20, prev.sanity - 6),
            currentSceneId: 'bar_intro',
            feedbackBanner: {
              text: 'Видение записано в память (+20 XP, +10 Зов Бездны). Попробуйте поговорить с Флинтом или открыть карту!',
              tone: 'abyss',
            },
          };
        }
        case 'force_storeroom_open': {
          sfx.playHit(true);
          const diaryPatch = unlockDiary(prev, 'd_storeroom');
          return {
            ...prev,
            ...diaryPatch,
            scrap: prev.scrap + 10,
            inventory: addItemToList(addItemToList(prev.inventory, 'part_brass_servo', 1), 'flint_ledger', 1),
            flags: { ...prev.flags, storeroom_opened: true },
            diaryConclusions: checkConclusion(prev, 'c_lock'),
            currentSceneId: 'bar_storeroom_inside',
            feedbackBanner: {
              text: 'Маленький Джон бесшумно отжал петли! Найден сервопривод и тайная тетрадь Флинта.',
              tone: 'good',
            },
          };
        }
        case 'finish_storeroom_discovery': {
          const xpPatch = awardXpState(prev, 30);
          return {
            ...prev,
            ...xpPatch,
            inventory: prev.inventory.some((i) => i.id === 'flint_ledger')
              ? prev.inventory
              : addItemToList(prev.inventory, 'flint_ledger', 1),
            diaryConclusions: checkConclusion(prev, 'c_lock'),
            quests: prev.quests.map((q) => (q.id === 'q_cylinder' ? { ...q, completed: true } : q)),
            currentSceneId: 'bar_intro',
            feedbackBanner: {
              text: 'Задача «Тайна латунного цилиндра» выполнена! Загляни во вкладку «Герои», чтобы поставить сервопривод Джону.',
              tone: 'good',
            },
          };
        }
        case 'brawl_stealth_win': {
          sfx.playWrench();
          const xpPatch = awardXpState(prev, 35);
          const diaryPatch = unlockDiary(prev, 'd_brawl');
          return {
            ...prev,
            ...xpPatch,
            ...diaryPatch,
            coins: prev.coins + 24,
            inventory: addItemToList(prev.inventory, 'smoke_flask', 1),
            flags: { ...prev.flags, brawl_resolved: true },
            currentSceneId: 'bar_brawl_victory',
            feedbackBanner: {
              text: 'Пар из трубы окатил боцмана — конфликт решён хитростью без единой царапины! (+35 XP, Дымовая склянка)',
              tone: 'good',
            },
          };
        }
        case 'brawl_bribe_win': {
          sfx.playCoin();
          const xpPatch = awardXpState(prev, 25);
          const diaryPatch = unlockDiary(prev, 'd_brawl');
          return {
            ...prev,
            ...xpPatch,
            ...diaryPatch,
            compassion: prev.compassion + 10,
            flags: { ...prev.flags, brawl_resolved: true },
            currentSceneId: 'bar_brawl_victory',
            feedbackBanner: {
              text: 'Мирное решение! Боцман ушёл пить ром, а Салли благодарна за спасение (+10 Милосердие, +25 XP).',
              tone: 'good',
            },
          };
        }
        case 'accept_flint_offer': {
          sfx.playSonarPing();
          const diaryPatch = unlockDiary(prev, 'd_flint_deal');
          return {
            ...prev,
            ...diaryPatch,
            activeTab: 'map',
            flags: { ...prev.flags, flint_deal_accepted: true },
            feedbackBanner: {
              text: 'Карта Бездны открыта! Выберите подводный сектор справа для первого погружения.',
              tone: 'info',
            },
          };
        }
        case 'confront_flint_ledger': {
          sfx.playClick();
          const xpPatch = awardXpState(prev, 30);
          return {
            ...prev,
            ...xpPatch,
            coins: prev.coins + 35,
            flags: { ...prev.flags, flint_confronted: true },
            diaryConclusions: checkConclusion(prev, 'c_flint'),
            feedbackBanner: {
              text: 'Флинт побледнел, но рассмеялся и заплатил 35 дублонов авансом за «молчание». Загадка Флинта раскрыта!',
              tone: 'good',
            },
          };
        }
        case 'read_flint_aura': {
          sfx.playAbyssWhisper();
          const xpPatch = awardXpState(prev, 25);
          return {
            ...prev,
            ...xpPatch,
            abyssAffinity: Math.min(100, prev.abyssAffinity + 10),
            flags: { ...prev.flags, flint_aura_read: true },
            diaryConclusions: checkConclusion(prev, 'c_flint'),
            feedbackBanner: {
              text: 'Вы видите тёмное пламя амбиций Флинта: он хочет подчинить Бездну, но боится потерять контроль. (+25 XP)',
              tone: 'abyss',
            },
          };
        }
        case 'scavenge_scrapyard': {
          sfx.playWrench();
          const gain = 10 + prev.skills.mechanics * 4;
          const xpPatch = awardXpState(prev, 12);
          return {
            ...prev,
            ...xpPatch,
            scrap: prev.scrap + gain,
            feedbackBanner: {
              text: `Вы с Джоном откопали +${gain} добротных деталей и получили +12 XP!`,
              tone: 'good',
            },
          };
        }
        case 'claim_scrap_crate_xp': {
          const xpPatch = awardXpState(prev, 25);
          return {
            ...prev,
            ...xpPatch,
            currentSceneId: 'scrapyard_hub',
            feedbackBanner: { text: 'Добыча из имперского контейнера в рюкзаке (+25 XP).', tone: 'good' },
          };
        }
        case 'overhear_crew_secrets': {
          sfx.playClick();
          const xpPatch = awardXpState(prev, 30);
          return {
            ...prev,
            ...xpPatch,
            flags: { ...prev.flags, crew_secrets_overheard: true },
            crew: prev.crew.map((c) => ({ ...c, secretRevealed: true })),
            feedbackBanner: {
              text: 'Вы подслушали разговоры головорезов! Тайные цели всей команды «Абиссали» раскрыты во вкладке «Герои» (+30 XP).',
              tone: 'good',
            },
          };
        }
        case 'rest_at_grotto': {
          sfx.playPageTurn();
          return {
            ...prev,
            day: prev.day + 1,
            energy: prev.maxEnergy,
            jillHp: prev.jillMaxHp,
            johnHp: Math.min(prev.johnMaxHp, prev.johnHp + 6),
            sanity: Math.min(prev.maxSanity, prev.sanity + 15),
            feedbackBanner: {
              text: `Наступил ${prev.day + 1}-й день. Энергия, здоровье Джил и часть рассудка восстановлены.`,
              tone: 'good',
            },
          };
        }
        case 'calm_mind_at_reef': {
          sfx.playClick();
          return {
            ...prev,
            sanity: Math.min(prev.maxSanity, prev.sanity + 20),
            compassion: prev.compassion + 5,
            feedbackBanner: {
              text: 'Тёплый свет фонаря Джона прогнал холод Бездны (+20 Рассудка, +5 Милосердие).',
              tone: 'good',
            },
          };
        }
        case 'claim_reef_enlightenment': {
          const xpPatch = awardXpState(prev, 35);
          return {
            ...prev,
            ...xpPatch,
            abyssAffinity: Math.min(100, prev.abyssAffinity + 15),
            sanity: Math.max(15, prev.sanity - 8),
            currentSceneId: 'whispering_reef_hub',
            feedbackBanner: {
              text: 'Эхо Атлантиды усилило ваш дар (+35 XP, +15 Зов Бездны).',
              tone: 'abyss',
            },
          };
        }
        default:
          return prev;
      }
    });
  };

  // === LOCKPICKING CALLBACKS ===
  const handleLockpickSuccess = () => {
    setState((prev) => {
      const lock = prev.activeLockpick;
      if (!lock) return prev;
      let nextInv = prev.inventory;
      if (lock.rewardItem) nextInv = addItemToList(nextInv, lock.rewardItem, 1);

      if (prev.activeExpedition && lock.onSuccessScene === '__expedition_next__') {
        return advanceExpeditionStage(
          { ...prev, inventory: nextInv, activeLockpick: null },
          {
            scrap: lock.rewardScrap ?? 14,
            coins: lock.rewardCoins ?? 24,
            xp: 30,
            bannerText: 'Сейф взломан чисто и без шума! Забрана вся добыча!',
            bannerTone: 'good',
          }
        );
      }

      const xpPatch = awardXpState(prev, 25);
      const diaryPatch =
        lock.onSuccessScene === 'bar_storeroom_inside' ? unlockDiary(prev, 'd_storeroom') : {};
      return {
        ...prev,
        ...xpPatch,
        ...diaryPatch,
        scrap: prev.scrap + (lock.rewardScrap ?? 0),
        coins: prev.coins + (lock.rewardCoins ?? 0),
        inventory: nextInv,
        rightMode: 'narrative',
        activeLockpick: null,
        currentSceneId: lock.onSuccessScene,
        flags:
          lock.lockId === 'admiral_storeroom'
            ? { ...prev.flags, storeroom_opened: true }
            : lock.lockId === 'imperial_scrap_crate'
            ? { ...prev.flags, scrap_crate_opened: true }
            : prev.flags,
        diaryConclusions:
          lock.lockId === 'admiral_storeroom'
            ? checkConclusion(prev, 'c_lock')
            : prev.diaryConclusions,
        feedbackBanner: {
          text: `Замок вскрыт! +${lock.rewardCoins ?? 0} дублонов, +${lock.rewardScrap ?? 0} деталей, +25 XP.`,
          tone: 'good',
        },
      };
    });
  };

  const handleLockpickConsume = () => {
    setState((prev) => ({
      ...prev,
      inventory: removeItemFromList(prev.inventory, 'lockpick_wire', 1),
    }));
  };

  // === RESONANCE CALLBACKS ===
  const handleResonanceSuccess = () => {
    setState((prev) => {
      const res = prev.activeResonance;
      if (!res) return prev;

      if (prev.activeExpedition && res.onSuccessScene === '__expedition_next__') {
        const sector = prev.sectors.find((s) => s.id === prev.activeExpedition!.sectorId);
        const stage = sector?.stages[prev.activeExpedition!.stageIndex];
        return advanceExpeditionStage(
          { ...prev, activeResonance: null },
          {
            scrap: stage?.rewardScrap ?? 14,
            coins: stage?.rewardCoins ?? 28,
            xp: (stage?.rewardXp ?? 35) + 15,
            abyssDelta: 12,
            itemId: stage?.rewardItem,
            bannerText: 'Резонанс настроен идеально! Вы обошли ловушки Бездны и уловили координаты реликвии.',
            bannerTone: 'abyss',
          }
        );
      }

      return {
        ...prev,
        rightMode: 'narrative',
        activeResonance: null,
        currentSceneId: res.onSuccessScene,
      };
    });
  };

  // === TACTICAL COMBAT ENGINE ===
  const runEnemyTurn = (baseState: GameState): GameState => {
    const c = baseState.activeCombat;
    if (!c) return baseState;

    let jillHp = baseState.jillHp;
    let johnHp = baseState.johnHp;
    let sanity = baseState.sanity;
    let jillBlock = c.jillBlock;
    let johnBlock = c.johnBlock;
    const log = [...c.combatLog];

    // Passive armor from Little John's installed chassis
    const johnPassiveArmor =
      (baseState.droidSlots.armor ? 2 : 0) +
      (baseState.droidSlots.lantern ? 1 : 0) +
      (baseState.droidSlots.core ? 1 : 0);

    const updatedEnemies = c.enemies.map((en) => {
      if (en.hp <= 0) return en;
      if (en.stunned) {
        log.push(`${en.name} оглушён и пропускает ход!`);
        return { ...en, stunned: false, block: 0 };
      }

      const dmgMult = en.distracted ? 0.5 : 1;
      const intent = en.currentIntent;
      let nextBlock = 0;

      if (intent === 'guard') {
        nextBlock = 5 + en.armor;
        log.push(`${en.name} встал в глухую оборону (+${nextBlock} щит).`);
      } else if (intent === 'whisper') {
        const sDmg = Math.max(
          2,
          Math.round((en.sanityDamage ?? 8) * dmgMult) - (baseState.droidSlots.lantern ? 4 : 0) - baseState.skills.medium * 2
        );
        sanity = Math.max(5, sanity - sDmg);
        sfx.playAbyssWhisper();
        log.push(`${en.name} шепчет из тьмы — рассудок команды -${sDmg}%!`);
      } else {
        const rawDmg = Math.max(1, Math.round((intent === 'heavy' ? en.attack + 3 : en.attack) * dmgMult));
        // Little John intercepts 70% of attacks to protect Jill!
        const targetJohn = johnHp > 0 && Math.random() < 0.72;
        sfx.playHit(intent === 'heavy');
        if (targetJohn) {
          const reduced = Math.max(0, rawDmg - johnPassiveArmor);
          const absorbed = Math.min(johnBlock, reduced);
          johnBlock -= absorbed;
          const finalDmg = reduced - absorbed;
          johnHp = Math.max(0, johnHp - finalDmg);
          log.push(`${en.name} бьёт по Маленькому Джону (${finalDmg} урона)!`);
        } else {
          const absorbed = Math.min(jillBlock, rawDmg);
          jillBlock -= absorbed;
          const finalDmg = rawDmg - absorbed;
          jillHp = Math.max(0, jillHp - finalDmg);
          log.push(`${en.name} задевает Джил (${finalDmg} урона)!`);
        }
      }

      const nextIntentIdx = (en.intentIndex + 1) % en.intents.length;
      return {
        ...en,
        block: nextBlock,
        distracted: false,
        intentIndex: nextIntentIdx,
        currentIntent: en.intents[nextIntentIdx],
      };
    });

    const defeated = jillHp <= 0 || (johnHp <= 0 && jillHp <= 2);

    return {
      ...baseState,
      jillHp,
      johnHp,
      sanity,
      activeCombat: {
        ...c,
        turn: c.turn + 1,
        phase: defeated ? 'defeat' : 'jill_turn',
        jillBlock: 0,
        johnBlock: 0,
        enemies: updatedEnemies,
        combatLog: log,
        lastHitTarget: undefined,
      },
    };
  };

  const handleCombatAction = (
    action: 'attack' | 'distract' | 'special' | 'guard' | 'retreat',
    itemId?: string
  ) => {
    setState((prev) => {
      const c = prev.activeCombat;
      if (!c || (c.phase !== 'jill_turn' && c.phase !== 'john_turn')) return prev;

      if (action === 'retreat' && c.canRetreat) {
        sfx.playPageTurn();
        return {
          ...prev,
          rightMode: 'narrative',
          activeCombat: null,
          currentSceneId: prev.activeExpedition ? prev.currentSceneId : c.onRetreatScene,
          feedbackBanner: { text: 'Команда ловко отступила под прикрытием манёвра Джил!', tone: 'info' },
        };
      }

      let jillHp = prev.jillHp;
      let johnHp = prev.johnHp;
      let energy = prev.energy;
      let sanity = prev.sanity;
      let inventory = prev.inventory;
      let jillBlock = c.jillBlock;
      let johnBlock = c.johnBlock;
      let stealthCharge = c.stealthCharge;
      const log = [...c.combatLog];
      let hitTargetUid: string | undefined;

      const aliveEnemies = c.enemies.filter((e) => e.hp > 0);
      const target = aliveEnemies.find((e) => e.uid === c.selectedEnemyUid) || aliveEnemies[0];
      if (!target) return prev;

      const kragBonus = prev.crew.some((m) => m.id === 'krag' && m.hired) ? 3 : 0;
      const johnPartAttack =
        (prev.droidSlots.servo ? 2 : 0) +
        (prev.droidSlots.arm ? 5 : 0) +
        (prev.droidSlots.core ? 4 : 0);

      let enemies = c.enemies.map((e) => ({ ...e }));

      const dealDamage = (uid: string, amount: number, stun = false, distract = false) => {
        hitTargetUid = uid;
        enemies = enemies.map((e) => {
          if (e.uid !== uid) return e;
          const absorbed = Math.min(e.block, amount);
          const dmg = Math.max(0, amount - absorbed);
          return {
            ...e,
            block: e.block - absorbed,
            hp: Math.max(0, e.hp - dmg),
            stunned: e.stunned || stun,
            distracted: e.distracted || distract,
          };
        });
      };

      // Consumable Item Use in Combat
      if (itemId) {
        const item = inventory.find((i) => i.id === itemId && i.quantity > 0);
        if (item && item.effect) {
          inventory = removeItemFromList(inventory, itemId, 1);
          if (item.effect.hp) jillHp = Math.min(prev.jillMaxHp, jillHp + item.effect.hp);
          if (item.effect.johnHp) johnHp = Math.min(prev.johnMaxHp, johnHp + item.effect.johnHp);
          if (item.effect.energy) energy = Math.min(prev.maxEnergy, energy + item.effect.energy);
          if (item.effect.sanity) sanity = Math.min(prev.maxSanity, sanity + item.effect.sanity);
          if (item.effect.combatDamage) {
            sfx.playHit(false);
            dealDamage(target.uid, item.effect.combatDamage, Boolean(item.effect.combatStun));
          } else {
            sfx.playWrench();
          }
          log.push(`Применён предмет «${item.name}»!`);
        }
      } else if (c.phase === 'jill_turn') {
        if (action === 'attack') {
          sfx.playHit(false);
          const critBonus = stealthCharge > 0 ? 4 + prev.skills.stealth * 2 : 0;
          const dmg = 4 + prev.skills.combat * 2 + critBonus;
          stealthCharge = Math.max(0, stealthCharge - 1);
          dealDamage(target.uid, dmg);
          log.push(
            critBonus > 0
              ? `Джил наносит хитрый удар ключом по ${target.name} на ${dmg} урона!`
              : `Джил бьёт гаечным ключом по ${target.name} (${dmg} урона).`
          );
        } else if (action === 'distract') {
          sfx.playClick();
          stealthCharge = Math.min(2, stealthCharge + 1);
          dealDamage(target.uid, 2 + prev.skills.stealth, false, true);
          log.push(`Джил отвлекает ${target.name}! Его следующий удар ослаблен вдвое (+Хитрость).`);
        } else if (action === 'special') {
          sfx.playAbyssWhisper();
          const dmg = 3 + prev.skills.medium * 3;
          sanity = Math.min(prev.maxSanity, sanity + 6);
          dealDamage(target.uid, dmg, prev.skills.medium >= 2);
          log.push(
            `Импульс Медиума Джил потрясает ${target.name} (${dmg} урона, +6 Рассудка)!`
          );
        } else if (action === 'guard') {
          sfx.playClick();
          jillBlock += 5 + prev.skills.combat * 2;
          johnBlock += 3;
          log.push(`Джил укрывается за Джоном (+${5 + prev.skills.combat * 2} щит).`);
        }
      } else if (c.phase === 'john_turn') {
        if (action === 'attack') {
          sfx.playHit(true);
          const dmg = 6 + prev.skills.combat * 2 + johnPartAttack + kragBonus;
          dealDamage(target.uid, dmg);
          log.push(`Маленький Джон сокрушает ${target.name} на ${dmg} урона!`);
        } else if (action === 'distract') {
          sfx.playSonarPing();
          const dmg = 4 + Math.floor(johnPartAttack / 2);
          dealDamage(target.uid, dmg, true);
          log.push(`Фонарь и сирена Джона оглушают ${target.name} (${dmg} урона, Оглушение)!`);
        } else if (action === 'special') {
          sfx.playHit(true);
          const bonusDmg = 5 + prev.johnMemoryRestored * 2 + kragBonus;
          enemies.forEach((e) => {
            if (e.hp > 0) dealDamage(e.uid, bonusDmg);
          });
          johnBlock += 4;
          log.push(
            `Боевой протокол J-17! Джон поражает ВСЕХ врагов волной (${bonusDmg} урона каждому, +4 щит)!`
          );
        } else if (action === 'guard') {
          sfx.playWrench();
          johnBlock += 8 + prev.skills.combat * 2;
          jillBlock += 4;
          log.push(`Маленький Джон закрывает Джил бронёй (+${8 + prev.skills.combat * 2} щит)!`);
        }
      }

      const remaining = enemies.filter((e) => e.hp > 0);
      const nextSelected = remaining.some((e) => e.uid === c.selectedEnemyUid)
        ? c.selectedEnemyUid
        : remaining[0]?.uid || '';

      // Check victory immediately
      if (remaining.length === 0) {
        sfx.playLockOpen();
        return {
          ...prev,
          jillHp,
          johnHp,
          energy,
          sanity,
          inventory,
          activeCombat: {
            ...c,
            phase: 'victory',
            enemies,
            jillBlock,
            johnBlock,
            stealthCharge,
            combatLog: [...log, 'Все противники повержены!'],
            lastHitTarget: hitTargetUid,
          },
        };
      }

      const nextPhase: CombatState['phase'] =
        c.phase === 'jill_turn' && johnHp > 0 ? 'john_turn' : 'enemy_turn';

      const midState: GameState = {
        ...prev,
        jillHp,
        johnHp,
        energy,
        sanity,
        inventory,
        activeCombat: {
          ...c,
          phase: nextPhase,
          selectedEnemyUid: nextSelected,
          enemies,
          jillBlock,
          johnBlock,
          stealthCharge,
          combatLog: log,
          lastHitTarget: hitTargetUid,
        },
      };

      if (nextPhase === 'enemy_turn') {
        return runEnemyTurn(midState);
      }
      return midState;
    });
  };

  const handleCombatVictory = () => {
    setState((prev) => {
      const c = prev.activeCombat;
      if (!c) return prev;

      if (prev.activeExpedition && c.onVictoryScene === '__expedition_next__') {
        return advanceExpeditionStage(prev, {
          scrap: c.rewardScrap,
          coins: c.rewardCoins,
          xp: c.rewardXp,
          itemId: c.rewardItem,
          stealthBroken: true,
          bannerText: 'Схватка выиграна! Путь вперёд расчищен.',
          bannerTone: 'good',
        });
      }

      const xpPatch = awardXpState(prev, c.rewardXp);
      const diaryPatch =
        c.encounterId === 'admiral_brawl' ? unlockDiary(prev, 'd_brawl') : {};
      let nextInv = prev.inventory;
      if (c.rewardItem) nextInv = addItemToList(nextInv, c.rewardItem, 1);
      if (c.encounterId === 'admiral_brawl') {
        nextInv = addItemToList(nextInv, 'smoke_flask', 1);
      }

      return {
        ...prev,
        ...xpPatch,
        ...diaryPatch,
        coins: prev.coins + c.rewardCoins,
        scrap: prev.scrap + c.rewardScrap,
        inventory: nextInv,
        rightMode: 'narrative',
        activeCombat: null,
        currentSceneId: c.onVictoryScene,
        flags:
          c.encounterId === 'admiral_brawl'
            ? { ...prev.flags, brawl_resolved: true }
            : prev.flags,
        feedbackBanner: {
          text: `Победа! +${c.rewardCoins} дублонов, +${c.rewardScrap} деталей, +${c.rewardXp} XP.`,
          tone: 'good',
        },
      };
    });
  };

  const handleCombatDefeat = () => {
    setState((prev) => ({
      ...prev,
      day: prev.day + 1,
      jillHp: Math.max(6, Math.floor(prev.jillMaxHp * 0.7)),
      johnHp: Math.max(10, Math.floor(prev.johnMaxHp * 0.6)),
      sanity: Math.max(50, prev.sanity),
      activeExpedition: null,
      rightMode: 'narrative',
      activeCombat: null,
      currentSceneId: 'bar_intro',
      currentLocation: 'bar_admiral',
      feedbackBanner: {
        text: 'Сильвер перевязал ваши раны в «Адмирале». Подлатайте Джона и попробуйте другой подход!',
        tone: 'warn',
      },
    }));
  };

  // === INVENTORY, TRADE, WORKBENCH & SKILLS ===
  const handleUseItem = (itemId: string) => {
    setState((prev) => {
      const item = prev.inventory.find((i) => i.id === itemId && i.quantity > 0);
      if (!item || !item.effect) return prev;
      sfx.playWrench();
      return {
        ...prev,
        inventory: removeItemFromList(prev.inventory, itemId, 1),
        jillHp: Math.min(prev.jillMaxHp, prev.jillHp + (item.effect.hp ?? 0)),
        johnHp: Math.min(prev.johnMaxHp, prev.johnHp + (item.effect.johnHp ?? 0)),
        energy: Math.min(prev.maxEnergy, prev.energy + (item.effect.energy ?? 0)),
        sanity: Math.min(prev.maxSanity, Math.max(5, prev.sanity + (item.effect.sanity ?? 0))),
        activeExpedition: prev.activeExpedition
          ? {
              ...prev.activeExpedition,
              oxygen: Math.min(
                prev.activeExpedition.maxOxygen,
                prev.activeExpedition.oxygen + (item.effect.oxygen ?? 0)
              ),
              hull: Math.min(
                prev.activeExpedition.maxHull,
                prev.activeExpedition.hull + (item.effect.hull ?? 0)
              ),
            }
          : null,
        feedbackBanner: { text: `Использован предмет: ${item.name}.`, tone: 'good' },
      };
    });
  };

  const handleBuyItem = (itemId: string) => {
    const item = ITEM_CATALOG[itemId];
    if (!item) return;
    setState((prev) => {
      if (prev.coins < item.price) return prev;
      sfx.playCoin();
      return {
        ...prev,
        coins: prev.coins - item.price,
        inventory: addItemToList(prev.inventory, itemId, 1),
        feedbackBanner: { text: `Куплено: ${item.name}.`, tone: 'good' },
      };
    });
  };

  const handleSellItem = (itemId: string) => {
    setState((prev) => {
      const item = prev.inventory.find((i) => i.id === itemId && i.quantity > 0);
      if (!item) return prev;
      const gain = Math.max(4, Math.floor(item.price * 0.5));
      sfx.playCoin();
      return {
        ...prev,
        coins: prev.coins + gain,
        inventory: removeItemFromList(prev.inventory, itemId, 1),
        feedbackBanner: { text: `Продано «${item.name}» за ${gain} дублонов.`, tone: 'info' },
      };
    });
  };

  const handleInstallDroidPart = (itemId: string) => {
    const part = ITEM_CATALOG[itemId];
    if (!part || !part.droidSlot) return;
    sfx.playWrench();
    setState((prev) => {
      const slot = part.droidSlot!;
      if (prev.droidSlots[slot]) return prev;
      const nextRestored = prev.johnMemoryRestored + 1;
      const bonusHp = part.droidBonus?.maxHp ?? 0;
      const xpPatch = awardXpState(prev, 25);

      let nextConclusions = prev.diaryConclusions;
      if (slot === 'servo') nextConclusions = checkConclusion(prev, 'c_servo');
      if (slot === 'core' || nextRestored >= 3) {
        nextConclusions = nextConclusions.map((c) =>
          c.id === 'c_john_core' ? { ...c, checked: true } : c
        );
      }

      return {
        ...prev,
        ...xpPatch,
        inventory: removeItemFromList(prev.inventory, itemId, 1),
        droidSlots: { ...prev.droidSlots, [slot]: itemId },
        johnMaxHp: prev.johnMaxHp + bonusHp,
        johnHp: prev.johnHp + bonusHp,
        johnMemoryRestored: nextRestored,
        diaryConclusions: nextConclusions,
        quests: prev.quests.map((q) =>
          q.id === 'q_john_restore' && nextRestored >= 3 ? { ...q, completed: true } : q
        ),
        feedbackBanner: {
          text: `Модуль «${part.name}» установлен на Маленького Джона! Пробуждён фрагмент памяти J-17 (+25 XP).`,
          tone: 'good',
        },
      };
    });
  };

  const handleRepairJohnWithScrap = () => {
    setState((prev) => {
      if (prev.scrap < 6 || prev.johnHp >= prev.johnMaxHp) return prev;
      sfx.playWrench();
      return {
        ...prev,
        scrap: prev.scrap - 6,
        johnHp: Math.min(prev.johnMaxHp, prev.johnHp + 8),
        feedbackBanner: { text: 'Маленький Джон подлатан (+8 HP)!', tone: 'good' },
      };
    });
  };

  const handleHireCrew = (crewId: 'krag' | 'salli' | 'morven' | 'vex') => {
    setState((prev) => {
      const target = prev.crew.find((c) => c.id === crewId);
      if (!target || target.hired || prev.coins < target.hireCost) return prev;
      sfx.playCoin();
      return {
        ...prev,
        coins: prev.coins - target.hireCost,
        crew: prev.crew.map((c) => (c.id === crewId ? { ...c, hired: true } : c)),
        feedbackBanner: {
          text: `${target.name} присоединяется к команде «Абиссали»!`,
          tone: 'good',
        },
      };
    });
  };

  const handleUpgradeSkill = (skill: SkillKey) => {
    setState((prev) => {
      if (prev.skillPoints <= 0 || prev.skills[skill] >= 3) return prev;
      return {
        ...prev,
        skillPoints: prev.skillPoints - 1,
        skills: { ...prev.skills, [skill]: prev.skills[skill] + 1 },
        feedbackBanner: { text: 'Новый навык освоен! Открыты дополнительные пути в диалогах и экспедициях.', tone: 'good' },
      };
    });
  };

  // === BUILD OVERLAY SPREADS (Hooks called unconditionally before early return) ===
  const diaryPages = useDiarySpread(state);
  const mapPages = useMapSpread(state, handleTravelHub, handleStartExpedition);
  const inventoryPages = useInventorySpread(state, handleUseItem, handleInstallDroidPart);
  const settingsPages = useSettingsSpread(
    state,
    () => setState((p) => ({ ...p, soundEnabled: !p.soundEnabled })),
    () => {
      try {
        localStorage.setItem(SAVE_KEY, JSON.stringify(state));
        setState((p) => ({
          ...p,
          feedbackBanner: { text: 'Прогресс книги надёжно сохранён.', tone: 'good' },
        }));
      } catch {
        // ignore
      }
    },
    (seed) => handleStartNew(seed)
  );

  // Show Title Cover before opening book
  if (!state.started) {
    return (
      <TitleCover
        hasSavedGame={hasSavedGame}
        onContinue={handleContinueSaved}
        onStartNew={handleStartNew}
      />
    );
  }

  // === RESOLVE ACTIVE STORY / PROCEDURAL EXPEDITION SCENE ===
  let activeLeft: React.ReactNode = null;
  let activeRight: React.ReactNode = null;

  if (state.activeTab === 'diary') {
    activeLeft = diaryPages.left;
    activeRight = diaryPages.right;
  } else if (state.activeTab === 'map') {
    activeLeft = mapPages.left;
    activeRight = mapPages.right;
  } else if (state.activeTab === 'characters') {
    const pages = buildCharactersSpread(
      state,
      handleInstallDroidPart,
      handleRepairJohnWithScrap,
      handleHireCrew
    );
    activeLeft = pages.left;
    activeRight = pages.right;
  } else if (state.activeTab === 'inventory') {
    activeLeft = inventoryPages.left;
    activeRight = inventoryPages.right;
  } else if (state.activeTab === 'skills') {
    const pages = buildSkillsSpread(state, handleUpgradeSkill);
    activeLeft = pages.left;
    activeRight = pages.right;
  } else if (state.activeTab === 'quests') {
    const pages = buildQuestsSpread(state);
    activeLeft = pages.left;
    activeRight = pages.right;
  } else if (state.activeTab === 'settings') {
    activeLeft = settingsPages.left;
    activeRight = settingsPages.right;
  } else {
    // Active Story / Expedition / Ending Spread
    if (state.rightMode === 'ending' && state.activeEnding) {
      const ending = ENDINGS[state.activeEnding];
      activeLeft = (
        <LeftNarrativePage
          chapterLabel="Эпилог · Судьба Грота и Бездны"
          title={ending.title}
          paragraphs={ending.paragraphs}
          choices={[
            {
              id: 'ending_restart_left',
              label: 'Начать новое приключение с другим зерном океана',
              icon: 'move',
              primary: true,
              action: { type: 'custom', handlerId: 'noop' },
            },
          ]}
          state={state}
          vignette="compass"
          onChoose={() => handleStartNew(Math.floor(1000 + Math.random() * 8999))}
        />
      );
      activeRight = (
        <RightActivityStage
          state={state}
          sceneArt={ending.art}
          onSetActionTab={() => {}}
          onSelectItem={() => {}}
          onUseItem={handleUseItem}
          onBuyItem={handleBuyItem}
          onSellItem={handleSellItem}
          onCloseTrade={() => {}}
          onCombatSelectTarget={() => {}}
          onCombatAction={handleCombatAction}
          onCombatVictory={handleCombatVictory}
          onCombatDefeat={handleCombatDefeat}
          onLockpickSuccess={handleLockpickSuccess}
          onLockpickConsume={handleLockpickConsume}
          onLockpickCancel={() => {}}
          onResonanceSuccess={handleResonanceSuccess}
          onResonanceCancel={() => {}}
          onRestartNewGame={() => handleStartNew(Math.floor(1000 + Math.random() * 8999))}
        />
      );
    } else if (state.activeExpedition) {
      // Dynamic Procedural Expedition Stage!
      const sector = state.sectors.find((s) => s.id === state.activeExpedition!.sectorId)!;
      const stage = sector.stages[state.activeExpedition.stageIndex];
      const stageChoices: StoryChoice[] = [];

      if (stage.type === 'choice') {
        stageChoices.push(
          {
            id: 'exp_stealth',
            label: 'Проскользнуть скрытно по боковому шлюзу (Скрытность 1)',
            icon: 'stealth',
            primary: true,
            styleTag: 'Скрытно',
            reqSkill: { skill: 'stealth', level: 1 },
            action: { type: 'advance_expedition', option: 'stealth' },
          },
          {
            id: 'exp_salvage',
            label: 'Пробить переборку с Джоном и вынести максимум деталей (-8 Корпус)',
            icon: 'gear',
            styleTag: 'Механика',
            action: { type: 'advance_expedition', option: 'salvage' },
          },
          {
            id: 'exp_medium',
            label: 'Прислушаться к эху обломков даром Медиума (Медиум 1)',
            icon: 'medium',
            styleTag: 'Медиум',
            reqSkill: { skill: 'medium', level: 1 },
            action: { type: 'advance_expedition', option: 'medium' },
          }
        );
      } else if (stage.type === 'lock') {
        stageChoices.push(
          {
            id: 'exp_pick_lock',
            label: 'Взломать судовой сейф отмычкой',
            icon: 'lock',
            primary: true,
            styleTag: 'Механика',
            reqItem: 'lockpick_wire',
            action: {
              type: 'start_lockpick',
              lockId: stage.id,
              title: stage.title,
              difficulty: sector.danger,
              pins: stage.lockPins ?? 4,
              onSuccessScene: '__expedition_next__',
              rewardScrap: stage.rewardScrap,
              rewardCoins: stage.rewardCoins,
              rewardItem: stage.rewardItem,
            },
          },
          {
            id: 'exp_smash_lock',
            label: 'Разворотить сейф силой Маленького Джона (меньше дублонов, без отмычки)',
            icon: 'combat',
            styleTag: 'Бой',
            action: { type: 'advance_expedition', option: 'salvage' },
          }
        );
      } else if (stage.type === 'resonance') {
        stageChoices.push(
          {
            id: 'exp_tune_sonar',
            label: 'Настроить сонар и дар Медиума на сигнал глубины',
            icon: 'medium',
            primary: true,
            styleTag: 'Медиум',
            action: {
              type: 'start_resonance',
              puzzleId: stage.id,
              title: stage.title,
              subtitle: 'Совместите волны сонара, чтобы раскрыть путь к реликвии без потерь рассудка',
              difficulty: sector.danger,
              onSuccessScene: '__expedition_next__',
            },
          },
          {
            id: 'exp_push_through',
            label: 'Пробиться сквозь помехи вслепую (-10 Рассудка, +Зов Бездны)',
            icon: 'gear',
            action: { type: 'advance_expedition', option: 'medium' },
          }
        );
      } else if (stage.type === 'moral') {
        stageChoices.push(
          {
            id: 'exp_moral_mercy',
            label: 'Спасти пленного ныряльщика вопреки совету Флинта (+Милосердие)',
            icon: 'moral',
            primary: true,
            styleTag: 'Мораль',
            action: { type: 'advance_expedition', option: 'mercy' },
          },
          {
            id: 'exp_moral_ruthless',
            label: 'Послушать Флинта: тихо забрать наживу, пока наёмники отвлеклись (-Милосердие)',
            icon: 'coin',
            styleTag: 'Торг',
            action: { type: 'advance_expedition', option: 'ruthless' },
          }
        );
      } else if (stage.type === 'combat' && stage.enemies) {
        stageChoices.push({
          id: 'exp_start_battle',
          label: 'К бою! Вступить в тактическую схватку',
          icon: 'combat',
          primary: true,
          styleTag: 'Бой',
          action: {
            type: 'start_combat',
            encounterId: stage.id,
            title: stage.title,
            sceneArt: stage.art,
            enemies: stage.enemies,
            onVictoryScene: '__expedition_next__',
            onRetreatScene: 'submarine_dock_hub',
            rewardCoins: stage.rewardCoins,
            rewardScrap: stage.rewardScrap,
            rewardXp: stage.rewardXp,
            rewardItem: stage.rewardItem,
            canRetreat: sector.type !== 'atlantis_vault',
          },
        });
        if (sector.type !== 'atlantis_vault') {
          stageChoices.push({
            id: 'exp_bypass_stealth',
            label: 'Проскользнуть мимо врагов без боя (Скрытность 2)',
            icon: 'stealth',
            styleTag: 'Скрытно',
            reqSkill: { skill: 'stealth', level: 2 },
            action: { type: 'advance_expedition', option: 'stealth' },
          });
        }
      }

      stageChoices.push({
        id: 'exp_abort_surface',
        label: 'Аварийное всплытие: вернуться в Подводный Грот',
        icon: 'move',
        action: { type: 'finish_expedition' },
      });

      activeLeft = (
        <LeftNarrativePage
          chapterLabel={`Экспедиция · Этап ${state.activeExpedition.stageIndex + 1} из ${sector.stages.length}`}
          title={stage.title}
          paragraphs={stage.narrative}
          choices={stageChoices}
          state={state}
          vignette="submarine"
          expeditionHeader={{
            sectorName: sector.name,
            depthMeters: sector.depthMeters,
            oxygen: state.activeExpedition.oxygen,
            maxOxygen: state.activeExpedition.maxOxygen,
            hull: state.activeExpedition.hull,
            maxHull: state.activeExpedition.maxHull,
            stageLabel: `Этап ${state.activeExpedition.stageIndex + 1}/${sector.stages.length}`,
          }}
          onChoose={handleChoice}
        />
      );

      activeRight = (
        <RightActivityStage
          state={state}
          sceneArt={stage.art}
          npc={stage.npc}
          inspectText={`Глубина ${sector.depthMeters} м. Внешнее давление нарастает. Кислород на борту «Абиссали»: ${state.activeExpedition.oxygen}/${state.activeExpedition.maxOxygen}.`}
          onSetActionTab={(tab) => {
            if (tab === 'trade') return;
            setState((p) => ({ ...p, rightActionTab: tab }));
          }}
          onSelectItem={(id) => setState((p) => ({ ...p, selectedItemId: id }))}
          onUseItem={handleUseItem}
          onBuyItem={handleBuyItem}
          onSellItem={handleSellItem}
          onCloseTrade={() => setState((p) => ({ ...p, rightMode: 'narrative', activeMerchant: null }))}
          onCombatSelectTarget={(uid) =>
            setState((p) =>
              p.activeCombat ? { ...p, activeCombat: { ...p.activeCombat, selectedEnemyUid: uid } } : p
            )
          }
          onCombatAction={handleCombatAction}
          onCombatVictory={handleCombatVictory}
          onCombatDefeat={handleCombatDefeat}
          onLockpickSuccess={handleLockpickSuccess}
          onLockpickConsume={handleLockpickConsume}
          onLockpickCancel={() => setState((p) => ({ ...p, rightMode: 'narrative', activeLockpick: null }))}
          onResonanceSuccess={handleResonanceSuccess}
          onResonanceCancel={() => setState((p) => ({ ...p, rightMode: 'narrative', activeResonance: null }))}
          onRestartNewGame={() => handleStartNew(Math.floor(1000 + Math.random() * 8999))}
        />
      );
    } else {
      // Standard Hub / Narrative Story Scene
      const scene = STORY_SCENES[state.currentSceneId] || STORY_SCENES.bar_intro;

      activeLeft = (
        <LeftNarrativePage
          chapterLabel={scene.chapterLabel}
          title={scene.title}
          paragraphs={scene.paragraphs}
          choices={scene.choices}
          state={state}
          vignette={scene.vignette}
          onChoose={handleChoice}
        />
      );

      activeRight = (
        <RightActivityStage
          state={state}
          sceneArt={scene.art}
          npc={scene.npc}
          inspectText={scene.inspectText}
          merchantId={scene.merchantId}
          onSetActionTab={(tab) => {
            if (tab === 'trade' && scene.merchantId) {
              setState((p) => ({
                ...p,
                rightMode: 'trade',
                activeMerchant: scene.merchantId!,
              }));
            } else {
              setState((p) => ({ ...p, rightActionTab: tab }));
            }
          }}
          onSelectItem={(id) => setState((p) => ({ ...p, selectedItemId: id }))}
          onUseItem={handleUseItem}
          onBuyItem={handleBuyItem}
          onSellItem={handleSellItem}
          onCloseTrade={() => setState((p) => ({ ...p, rightMode: 'narrative', activeMerchant: null }))}
          onCombatSelectTarget={(uid) =>
            setState((p) =>
              p.activeCombat ? { ...p, activeCombat: { ...p.activeCombat, selectedEnemyUid: uid } } : p
            )
          }
          onCombatAction={handleCombatAction}
          onCombatVictory={handleCombatVictory}
          onCombatDefeat={handleCombatDefeat}
          onLockpickSuccess={handleLockpickSuccess}
          onLockpickConsume={handleLockpickConsume}
          onLockpickCancel={() => setState((p) => ({ ...p, rightMode: 'narrative', activeLockpick: null }))}
          onResonanceSuccess={handleResonanceSuccess}
          onResonanceCancel={() => setState((p) => ({ ...p, rightMode: 'narrative', activeResonance: null }))}
          onRestartNewGame={() => handleStartNew(Math.floor(1000 + Math.random() * 8999))}
        />
      );
    }
  }

  return (
    <BookShell
      state={state}
      onSelectTab={(tab: BookTab) =>
        setState((prev) => ({
          ...prev,
          activeTab: tab,
          unreadDiary: tab === 'diary' ? false : prev.unreadDiary,
        }))
      }
      onToggleSound={() => setState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
      leftPage={activeLeft}
      rightPage={activeRight}
    />
  );
}
