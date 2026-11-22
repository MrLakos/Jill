import { EnemyTemplate, ProceduralSector, SectorType } from '../types/game';

// Deterministic Mulberry32 PRNG for reproducible procedural worlds by seed
export function createRng(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

const SECTOR_PREFIXES: Record<SectorType, string[]> = {
  salvage: ['Кладбище батискафов', 'Затонувший док «Аврора»', 'Ржавый караван'],
  imperial: ['Имперский блокпост «Омега»', 'Кордон крейсера «Титан»', 'Станция прослушки IV'],
  bounty: ['Ущелье Охотников', 'Ловушка Чёрного Гарпуна', 'Риф Наёмников'],
  mutant: ['Разлом Шепчущих Костей', 'Коралловое Гнездо', 'Чёрная Впадина'],
  atlantis_ruin: ['Колоннада Прилива', 'Затонувший Реликварий', 'Обсерватория Глубин'],
  atlantis_vault: ['Врата Затерянной Атлантиды'],
};

const ENEMY_POOLS: Record<'imperial' | 'bounty' | 'mutant' | 'abyssal', EnemyTemplate[]> = {
  imperial: [
    {
      id: 'imp_marine',
      name: 'Имперский водолаз-штурмовик',
      role: 'Солдат Адмиралтейства',
      portrait: 'enemy_imperial',
      maxHp: 16,
      attack: 5,
      armor: 2,
      intents: ['strike', 'guard', 'heavy'],
    },
    {
      id: 'imp_drone',
      name: 'Дроид-разведчик K-09',
      role: 'Имперский автоматоны',
      portrait: 'john',
      maxHp: 13,
      attack: 4,
      armor: 1,
      intents: ['debuff', 'strike'],
    },
  ],
  bounty: [
    {
      id: 'bounty_captain',
      name: 'Охотник с гарпуном',
      role: 'Наёмник за J-17',
      portrait: 'enemy_bounty',
      maxHp: 18,
      attack: 6,
      armor: 1,
      intents: ['heavy', 'strike', 'guard'],
    },
    {
      id: 'bounty_scout',
      name: 'Подрывник-контрабандист',
      role: 'Диверсант',
      portrait: 'enemy_thug',
      maxHp: 12,
      attack: 4,
      armor: 0,
      intents: ['debuff', 'strike'],
    },
  ],
  mutant: [
    {
      id: 'deep_mutant',
      name: 'Глубоководный мутант',
      role: 'Искажённый моряк',
      portrait: 'enemy_mutant',
      maxHp: 19,
      attack: 5,
      armor: 1,
      sanityDamage: 7,
      intents: ['strike', 'whisper', 'heavy'],
    },
    {
      id: 'barnacle_crawler',
      name: 'Панцирный ползун',
      role: 'Тварь Разлома',
      portrait: 'enemy_abyssal',
      maxHp: 14,
      attack: 4,
      armor: 2,
      sanityDamage: 5,
      intents: ['guard', 'strike'],
    },
  ],
  abyssal: [
    {
      id: 'abyssal_horror',
      name: 'Щупальце Спящей Бездны',
      role: 'Древний Ужас',
      portrait: 'enemy_abyssal',
      maxHp: 26,
      attack: 7,
      armor: 2,
      sanityDamage: 12,
      intents: ['whisper', 'heavy', 'strike'],
    },
    {
      id: 'echo_wraith',
      name: 'Эхо Затонувшего Храма',
      role: 'Призрак Атлантиды',
      portrait: 'enemy_mutant',
      maxHp: 16,
      attack: 5,
      armor: 1,
      sanityDamage: 10,
      intents: ['whisper', 'debuff', 'strike'],
    },
  ],
};

export function generateProceduralSectors(seed: number): ProceduralSector[] {
  const rng = createRng(seed);

  const sectorConfigs: Array<{
    id: string;
    type: SectorType;
    depth: number;
    danger: 1 | 2 | 3 | 4 | 5;
    oxygenCost: number;
    grantsKey: boolean;
    x: number;
    y: number;
    art: ProceduralSector['art'];
    keyItem?: string;
  }> = [
    {
      id: 'sec_1_salvage',
      type: 'salvage',
      depth: 480 + Math.floor(rng() * 140),
      danger: 1,
      oxygenCost: 20,
      grantsKey: false,
      x: 24,
      y: 25,
      art: 'sunken_wreck',
      keyItem: 'repair_kit',
    },
    {
      id: 'sec_2_imperial',
      type: 'imperial',
      depth: 920 + Math.floor(rng() * 220),
      danger: 2,
      oxygenCost: 28,
      grantsKey: true,
      x: 56,
      y: 22,
      art: 'imperial_patrol',
      keyItem: 'part_bathy_armor',
    },
    {
      id: 'sec_3_bounty',
      type: 'bounty',
      depth: 1380 + Math.floor(rng() * 260),
      danger: 3,
      oxygenCost: 32,
      grantsKey: true,
      x: 34,
      y: 54,
      art: 'bounty_ambush',
      keyItem: 'part_harpoon_arm',
    },
    {
      id: 'sec_4_mutant',
      type: 'mutant',
      depth: 2150 + Math.floor(rng() * 350),
      danger: 4,
      oxygenCost: 38,
      grantsKey: true,
      x: 72,
      y: 52,
      art: 'mutant_trench',
      keyItem: 'part_imperial_core',
    },
    {
      id: 'sec_5_ruin',
      type: 'atlantis_ruin',
      depth: 2740 + Math.floor(rng() * 310),
      danger: 4,
      oxygenCost: 35,
      grantsKey: true,
      x: 46,
      y: 74,
      art: 'atlantis_gate',
      keyItem: 'atlantis_shard',
    },
    {
      id: 'sec_6_vault',
      type: 'atlantis_vault',
      depth: 3650,
      danger: 5,
      oxygenCost: 45,
      grantsKey: false,
      x: 78,
      y: 82,
      art: 'atlantis_gate',
    },
  ];

  return sectorConfigs.map((cfg) => {
    const name = pick(rng, SECTOR_PREFIXES[cfg.type]);
    const bonusCoins = 28 + cfg.danger * 16 + Math.floor(rng() * 14);
    const bonusScrap = 12 + cfg.danger * 7 + Math.floor(rng() * 8);

    if (cfg.type === 'salvage') {
      return {
        id: cfg.id,
        name,
        depthMeters: cfg.depth,
        type: cfg.type,
        danger: cfg.danger,
        oxygenCost: cfg.oxygenCost,
        description: 'Обломки старого грузового батискафа, застрявшие на уступе. Отличная добыча деталей и безопасная разминка для экипажа.',
        rewardPreview: `~${bonusScrap} деталей · ~${bonusCoins} дублонов`,
        grantsKey: false,
        completed: false,
        unlocked: true,
        x: cfg.x,
        y: cfg.y,
        art: cfg.art,
        stages: [
          {
            id: `${cfg.id}_st1`,
            title: 'Затопленный трюм',
            art: 'sunken_wreck',
            type: 'choice',
            narrative: [
              `Прожекторы «Абиссали» выхватили из мутной воды переломленный остов старого судна «${name}». Внутри слышится слабый стук — либо течение гоняет обломки, либо там застрял кто-то живой.`,
              'Сонар также улавливает богатое скопление латуни в грузовом отсеке, но переборки трещат от давления.'
            ],
            npc: {
              speaker: 'Маленький Джон',
              portrait: 'john',
              text: 'Обнаружены неповреждённые шестерни и слабый тепловой след в носовом отсеке. Каков план, Джил?',
            },
            rewardScrap: Math.round(bonusScrap * 0.6),
            rewardCoins: Math.round(bonusCoins * 0.5),
            rewardXp: 25,
          },
          {
            id: `${cfg.id}_st2`,
            title: 'Сейф капитанской рубки',
            art: 'sunken_wreck',
            type: 'lock',
            lockPins: 4,
            narrative: [
              'В полузатопленной рубке уцелел массивный латунный сейф с судовой кассой и запчастями. Времени мало — кислород уходит, а вода снаружи становится всё темнее.'
            ],
            npc: {
              speaker: 'Джил',
              portrait: 'jill',
              text: 'Отличный замок! Сейчас я быстренько его уговорю открыться!',
            },
            rewardScrap: Math.round(bonusScrap * 0.6),
            rewardCoins: Math.round(bonusCoins * 0.7),
            rewardXp: 30,
            rewardItem: cfg.keyItem,
          },
        ],
      };
    }

    if (cfg.type === 'imperial') {
      return {
        id: cfg.id,
        name,
        depthMeters: cfg.depth,
        type: cfg.type,
        danger: cfg.danger,
        oxygenCost: cfg.oxygenCost,
        description: 'Имперский патруль перекрыл проход в глубокий сектор. Можно проскользнуть мимо сонаров скрытно или прорваться с боем за Ключом Бездны.',
        rewardPreview: `Ключ Бездны · ~${bonusCoins} дублонов · Броня Джона`,
        grantsKey: true,
        completed: false,
        unlocked: true,
        x: cfg.x,
        y: cfg.y,
        art: cfg.art,
        stages: [
          {
            id: `${cfg.id}_st1`,
            title: 'Лучи имперских прожекторов',
            art: 'imperial_patrol',
            type: 'choice',
            narrative: [
              `На глубине ${cfg.depth} метров «Абиссаль» наткнулась на «${name}». Стальные буи сонаров ритмично посылают импульсы, выискивая контрабандистов.`,
              'В захваченном шлюзе станции хранится изъятый у пиратов древний Ключ Бездны. Можно заглушить двигатели и обойти патруль через вентиляционный коллектор — или ударить в лоб!'
            ],
            npc: {
              speaker: 'Капитан Флинт',
              portrait: 'flint',
              text: 'Имперские псы сторожат наш первый Ключ. Решай, юная леди: тихая хитрость или добрый старый абордаж?',
            },
            rewardScrap: Math.round(bonusScrap * 0.5),
            rewardCoins: Math.round(bonusCoins * 0.4),
            rewardXp: 30,
          },
          {
            id: `${cfg.id}_st2`,
            title: 'Застава Адмиралтейства',
            art: 'imperial_patrol',
            type: 'combat',
            enemies: [ENEMY_POOLS.imperial[0], ENEMY_POOLS.imperial[1]],
            narrative: [
              'Внутри шлюзовой камеры вас уже поджидает дежурный патруль Адмиралтейства и имперский дроид-разведчик. При виде Маленького Джона на их приборах вспыхивает красная тревога: «ОБНАРУЖЕН ДЕЗЕРТИР J-17!»'
            ],
            npc: {
              speaker: 'Имперский офицер',
              portrait: 'enemy_imperial',
              text: 'Именем Императора! Сдайте списанного боевого дроида и контрабанду немедленно!',
            },
            rewardScrap: bonusScrap,
            rewardCoins: bonusCoins,
            rewardXp: 45,
            rewardItem: cfg.keyItem,
          },
        ],
      };
    }

    if (cfg.type === 'bounty') {
      return {
        id: cfg.id,
        name,
        depthMeters: cfg.depth,
        type: cfg.type,
        danger: cfg.danger,
        oxygenCost: cfg.oxygenCost,
        description: 'Охотники за головами устроили засаду на пути к древнему маяку. Они ищут серийный номер J-17 и держат пленного водолаза.',
        rewardPreview: `Ключ Бездны · ~${bonusCoins} дублонов · Гарпун Джона`,
        grantsKey: true,
        completed: false,
        unlocked: true,
        x: cfg.x,
        y: cfg.y,
        art: cfg.art,
        stages: [
          {
            id: `${cfg.id}_st1`,
            title: 'Сигнал бедствия в ущелье',
            art: 'bounty_ambush',
            type: 'moral',
            narrative: [
              `Среди скал «${name}» мигает аварийный фонарь. Наёмники-охотники за головами поймали в сеть старого вольного ныряльщика, отобрав у него древний Ключ Бездны.`,
              'Капитан Флинт холодно советует дождаться, пока наёмники уйдут, и обобрать их тайник, бросив бедолагу на верную гибель. Но Джил слышит, как ныряльщик стучит по стеклу шлема...'
            ],
            npc: {
              speaker: 'Капитан Флинт',
              portrait: 'flint',
              text: 'Лишний рот и лишний риск, Джил. Заберём ключ тихо и уйдём — в Бездне выживают расчётливые.',
            },
            rewardScrap: Math.round(bonusScrap * 0.5),
            rewardCoins: Math.round(bonusCoins * 0.5),
            rewardXp: 35,
          },
          {
            id: `${cfg.id}_st2`,
            title: 'Схватка с Охотниками за J-17',
            art: 'bounty_ambush',
            type: 'combat',
            enemies: [ENEMY_POOLS.bounty[0], ENEMY_POOLS.bounty[1]],
            narrative: [
              'Главарь охотников поднял пневматический гарпун, хищно разглядывая клеймо J-17 на груди Маленького Джона: «За эту рухлядь Империя платит золотом! А девчонку отдадим Флинту за выкуп!»'
            ],
            npc: {
              speaker: 'Маленький Джон',
              portrait: 'john',
              text: 'Боевой режим активирован. Никто не тронет Джил!',
            },
            rewardScrap: bonusScrap,
            rewardCoins: bonusCoins,
            rewardXp: 50,
            rewardItem: cfg.keyItem,
          },
        ],
      };
    }

    if (cfg.type === 'mutant') {
      return {
        id: cfg.id,
        name,
        depthMeters: cfg.depth,
        type: cfg.type,
        danger: cfg.danger,
        oxygenCost: cfg.oxygenCost,
        description: 'Тёмная впадина, откуда доносится пугающий шёпот. Здесь обитают мутировавшие моряки пропавших экспедиций, но среди обломков скрыто родное Ядро J-17 и Ключ Бездны.',
        rewardPreview: `Ключ Бездны · Ядро Памяти J-17 · Хоррор`,
        grantsKey: true,
        completed: false,
        unlocked: true,
        x: cfg.x,
        y: cfg.y,
        art: cfg.art,
        stages: [
          {
            id: `${cfg.id}_st1`,
            title: 'Шёпот в чёрной воде',
            art: 'mutant_trench',
            type: 'resonance',
            narrative: [
              `На глубине ${cfg.depth} метров свет прожекторов тонет в фиолетовой взвеси. Корпус «Абиссали» стонет, а по обшивке скребутся чьи-то длинные пальцы. У экипажа на лбу выступает холодный пот.`,
              'Сквозь помехи сонара пробивается знакомый сигнал — родной чёрный ящик дроида J-17 и мерцание Ключа Бездны!'
            ],
            npc: {
              speaker: 'Маленький Джон',
              portrait: 'john',
              text: 'Джил... Я... помню это место. Здесь затонул мой прежний крейсер. Осторожно — те, кто остался внизу, больше не люди.',
            },
            rewardScrap: Math.round(bonusScrap * 0.6),
            rewardCoins: Math.round(bonusCoins * 0.5),
            rewardXp: 40,
          },
          {
            id: `${cfg.id}_st2`,
            title: 'Хранители Разлома',
            art: 'mutant_trench',
            type: 'combat',
            enemies: [ENEMY_POOLS.mutant[0], ENEMY_POOLS.mutant[1]],
            narrative: [
              'Из пролома затонувшего крейсера выплывают искажённые силуэты в обрывках водолазных костюмов, обросших светящимися кораллами. Их голоса звучат прямо в голове, подтачивая рассудок!'
            ],
            npc: {
              speaker: 'Глубоководный мутант',
              portrait: 'enemy_mutant',
              text: 'Присоединяйтесь к хору... Внизу нет боли, только прилив...',
            },
            rewardScrap: bonusScrap,
            rewardCoins: bonusCoins,
            rewardXp: 60,
            rewardItem: cfg.keyItem,
          },
        ],
      };
    }

    if (cfg.type === 'atlantis_ruin') {
      return {
        id: cfg.id,
        name,
        depthMeters: cfg.depth,
        type: cfg.type,
        danger: cfg.danger,
        oxygenCost: cfg.oxygenCost,
        description: 'Затопленные колонны древней цивилизации. Высокий риск для рассудка, но шанс добыть Ключ Бездны и Осколок Звёздного Коралла через дар Медиума.',
        rewardPreview: `Ключ Бездны · Артефакт Атлантиды · +Опыт`,
        grantsKey: true,
        completed: false,
        unlocked: true,
        x: cfg.x,
        y: cfg.y,
        art: cfg.art,
        stages: [
          {
            id: `${cfg.id}_st1`,
            title: 'Затонувший алтарь',
            art: 'atlantis_gate',
            type: 'resonance',
            narrative: [
              `Вокруг «${name}» вода удивительно прозрачна и светится мягким бирюзовым светом. Древние механизмы до сих пор вращаются без единой капли масла, подчиняясь лишь психическому резонансу.`,
              'В центре зала парит хрустальный Ключ Бездны, окружённый тенями древних стражей.'
            ],
            npc: {
              speaker: 'Джил',
              portrait: 'jill',
              text: 'Красота какая... и жутко до мурашек! Кажется, я могу успокоить этот механизм, если поймаю его волну!',
            },
            rewardScrap: bonusScrap,
            rewardCoins: bonusCoins,
            rewardXp: 55,
            rewardItem: cfg.keyItem,
          },
          {
            id: `${cfg.id}_st2`,
            title: 'Страж Реликвария',
            art: 'atlantis_gate',
            type: 'combat',
            enemies: [ENEMY_POOLS.abyssal[0], ENEMY_POOLS.abyssal[1]],
            narrative: [
              'Едва вы прикасаетесь к реликвии, пол содрогается — из каменной бездны поднимается колоссальное биолюминесцентное щупальце и призрачное эхо древнего храма!'
            ],
            npc: {
              speaker: 'Эхо Атлантиды',
              portrait: 'enemy_abyssal',
              text: 'Недостойные ищут золото... Бездна требует цену!',
            },
            rewardScrap: bonusScrap,
            rewardCoins: bonusCoins + 25,
            rewardXp: 70,
          },
        ],
      };
    }

    // Final Atlantis Vault Sector
    return {
      id: cfg.id,
      name: 'Врата Затерянной Атлантиды',
      depthMeters: cfg.depth,
      type: 'atlantis_vault',
      danger: 5,
      oxygenCost: cfg.oxygenCost,
      description: 'Финальное погружение на дно океана. Требуется 3 Ключа Бездны. Здесь раскроются истинные цели Флинта, тайна Джона и судьба Грота.',
      rewardPreview: 'Финал истории (4 концовки)',
      grantsKey: false,
      completed: false,
      unlocked: false,
      x: cfg.x,
      y: cfg.y,
      art: 'atlantis_gate',
      stages: [
        {
          id: 'vault_final_guardian',
          title: 'Порог Спящего Города',
          art: 'atlantis_gate',
          type: 'combat',
          enemies: [ENEMY_POOLS.abyssal[0], ENEMY_POOLS.mutant[0]],
          narrative: [
            'На глубине 3650 метров «Абиссаль» замирает перед исполинскими Вратами Атлантиды. Последний страж Бездны поднимается из тьмы, чтобы испытать вашу команду перед развязкой!'
          ],
          npc: {
            speaker: 'Сильвер',
            portrait: 'silver',
            text: 'Держись, Рыжая! Мы прошли слишком долгий путь, чтобы отступать сейчас!',
          },
          rewardScrap: 30,
          rewardCoins: 100,
          rewardXp: 100,
        },
      ],
    };
  });
}
