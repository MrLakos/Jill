// Exact local paths to user-provided game assets in /public/assets/aistudio/

export const ASSETS = {
  jillSheet: '/assets/aistudio/Jill_character_sheet_0508f67b.png',
  johnSheet: '/assets/aistudio/LittleJohn_character-sheet_501a93b2.webp',
  silverSheet: '/assets/aistudio/Silver_character-sheet_409879e6.webp',
  flintSheet: '/assets/aistudio/Flint_character-sheet_66644d90.webp',
  stickers: '/assets/aistudio/UI-Stickers_overlay_cc1ebcf4.webp',
  narrativeMock: '/assets/aistudio/Narrative_mode_9cb883bd.webp',
  battleMock: '/assets/aistudio/Battle_mode_bbefc749.webp',
  diaryMock: '/assets/aistudio/Diary_72fd37ed.webp',
  lockpickMock: '/assets/aistudio/Mini_Game_mode_2d9509ba.webp',
} as const;

export interface CropSpec {
  src: string;
  // Background-size and background-position percentages to cleanly frame a region of a character sheet or scene
  bgSize: string;
  bgPos: string;
  alt: string;
}

// Precision cropped character portraits directly from the official character sheets
export const PORTRAIT_CROPS: Record<string, CropSpec> = {
  jill: {
    src: ASSETS.jillSheet,
    bgSize: '335%',
    bgPos: '2.5% 4.5%',
    alt: 'Джил — юный механик и медиум',
  },
  john: {
    src: ASSETS.johnSheet,
    bgSize: '520%',
    bgPos: '2.5% 5%',
    alt: 'Маленький Джон (J-17) — бывший имперский боевой дроид',
  },
  silver: {
    src: ASSETS.silverSheet,
    bgSize: '360%',
    bgPos: '4% 4%',
    alt: 'Сильвер — хозяин бара «Адмирал»',
  },
  flint: {
    src: ASSETS.flintSheet,
    bgSize: '640%',
    bgPos: '1.8% 23%',
    alt: 'Капитан Флинт — аристократ и авантюрист',
  },
  // Supporting cast & enemies cropped from battle/narrative scenes or expressive portraits
  krag: {
    src: ASSETS.battleMock,
    bgSize: '1200%',
    bgPos: '86.2% 69.5%',
    alt: 'Боцман Краг',
  },
  enemy_thug: {
    src: ASSETS.battleMock,
    bgSize: '1250%',
    bgPos: '92.4% 69.5%',
    alt: 'Подручный боцмана',
  },
  vex: {
    src: ASSETS.battleMock,
    bgSize: '1250%',
    bgPos: '97.5% 69.5%',
    alt: 'Штурман Векс',
  },
  salli: {
    src: ASSETS.silverSheet,
    bgSize: '680%',
    bgPos: '95% 86%',
    alt: 'Салли «Искра»',
  },
  morven: {
    src: ASSETS.flintSheet,
    bgSize: '1100%',
    bgPos: '40.5% 84%',
    alt: 'Док Морвен',
  },
};

// Cropped painterly scene illustrations extracted cleanly from the official concept art
export const SCENE_CROPS: Record<string, CropSpec> = {
  bar_admiral: {
    src: ASSETS.narrativeMock,
    bgSize: '205%',
    bgPos: '98% 15%',
    alt: 'Бар «Адмирал» — Сильвер, Джил и Маленький Джон у стойки',
  },
  bar_brawl: {
    src: ASSETS.battleMock,
    bgSize: '205%',
    bgPos: '98% 18%',
    alt: 'Потасовка в баре «Адмирал» — Джил и Маленький Джон против громил',
  },
  jill_john_bond: {
    src: ASSETS.diaryMock,
    bgSize: '345%',
    bgPos: '69% 21%',
    alt: 'Джил и Маленький Джон мечтают о приключениях',
  },
  storeroom: {
    src: ASSETS.diaryMock,
    bgSize: '365%',
    bgPos: '66% 62%',
    alt: 'Тайная подсобка бара «Адмирал»',
  },
  silver_pouring: {
    src: ASSETS.silverSheet,
    bgSize: '410%',
    bgPos: '69% 60%',
    alt: 'Сильвер разливает тёмный ром в баре «Адмирал»',
  },
  silver_smoking: {
    src: ASSETS.silverSheet,
    bgSize: '410%',
    bgPos: '97% 60%',
    alt: 'Сильвер размышляет с трубкой у иллюминатора',
  },
  john_workshop: {
    src: ASSETS.johnSheet,
    bgSize: '355%',
    bgPos: '72% 88%',
    alt: 'Маленький Джон чинит механизмы в мастерской',
  },
  jill_john_crates: {
    src: ASSETS.johnSheet,
    bgSize: '320%',
    bgPos: '24% 86%',
    alt: 'Джил сидит на руках у Маленького Джона среди ящиков',
  },
};
