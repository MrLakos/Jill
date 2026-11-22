import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Compass,
  Anchor,
  Cog,
  Shield,
  Sparkles,
  Wrench,
  Eye,
  Footprints,
  Swords,
  Lock,
  Save,
  RotateCcw,
  Volume2,
  VolumeX,
  Users,
  Heart,
} from 'lucide-react';
import {
  DroidSlotKey,
  GameState,
  HubLocationId,
  SkillKey,
} from '../types/game';
import { DROID_SLOT_LABELS, ITEM_CATALOG } from '../data/itemsAndUpgrades';
import { InkVignette, PortraitFrame, SceneIllustration } from './CroppedArt';
import { getItemIcon } from './RightActivityStage';
import { sfx } from '../utils/sound';

export interface BookSpreadPages {
  left: React.ReactNode;
  right: React.ReactNode;
}

// === 1. JILL'S DIARY SPREAD (Matches Diary_72fd37ed.webp) ===
export function useDiarySpread(state: GameState): BookSpreadPages {
  const [selectedIdx, setSelectedIdx] = useState(Math.max(0, state.diaryEntries.length - 1));
  const safeIdx = Math.min(selectedIdx, Math.max(0, state.diaryEntries.length - 1));
  const entry = state.diaryEntries[safeIdx] || state.diaryEntries[0];

  const left = (
    <div className="animate-page-in flex flex-col flex-1 justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 pb-2 mb-3 border-b border-[#987041]/40">
          <div className="flex items-center gap-2.5">
            <PortraitFrame id="jill" size="sm" />
            <div>
              <h2 className="font-hand text-3xl font-bold text-[#3b200c] leading-none">
                Дневник Джил
              </h2>
              <span className="text-[11px] text-[#6d4924]">
                Страниц открыто: {state.diaryEntries.length}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {state.diaryEntries.map((d, idx) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  sfx.playPageTurn();
                  setSelectedIdx(idx);
                }}
                className={`w-7 h-7 rounded text-xs font-bold border transition-colors cursor-pointer tabular-nums ${
                  idx === safeIdx
                    ? 'bg-[#d9a246] text-[#211207] border-[#7e5119]'
                    : 'bg-[#e6cfa2] text-[#4c2f16] border-[#9d7545] hover:bg-[#f0dba9]'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {entry && (
          <div>
            <div className="font-hand text-2xl font-bold text-[#522e12] underline decoration-[#9d7545]/60 underline-offset-4 mb-1">
              {entry.day}-й день, {entry.weekday}
            </div>
            <div className="font-display text-lg font-bold text-[#2b170a] mb-2.5">
              {entry.title}
            </div>

            <div className="space-y-2.5 font-hand text-[21px] leading-[1.32] text-[#24160d]">
              {entry.jillText.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      <InkVignette kind="octopus" />
    </div>
  );

  const right = (
    <div className="animate-page-in flex flex-col flex-1 gap-3">
      {entry && (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="sm:col-span-3 p-1.5 bg-[#f7ead1] border border-[#967042] shadow-md -rotate-1">
            <SceneIllustration art={entry.photoArt} className="h-[160px] border border-[#6e4c26]" />
            <div className="font-hand text-base text-[#3b220f] text-center pt-1">
              {entry.sketchLabel}
            </div>
          </div>

          <div className="sm:col-span-2 p-3 bg-[#f3e1be] border border-[#9e7545] shadow-sm rotate-1 flex flex-col justify-between">
            <div>
              <div className="font-hand text-xl font-bold text-[#3f220c] mb-1">
                В моих карманах:
              </div>
              <ul className="font-hand text-[17px] leading-snug text-[#3d2310] space-y-0.5">
                {state.inventory
                  .filter((item) => item.quantity > 0)
                  .slice(0, 4)
                  .map((item) => (
                    <li key={item.id} className="truncate">
                      • {item.name}
                    </li>
                  ))}
              </ul>
            </div>
            <div className="font-hand text-base text-[#633a18] pt-2 border-t border-[#a57e4d]/40">
              {state.episodeMode === 'demo_day'
                ? '«Сильвер говорит: не теряй ключ!»'
                : '«Все важные находки — сюда!»'}
            </div>
          </div>
        </div>
      )}

      <div className="p-4 rounded-md bg-[#f4e3c2] border border-[#9b7343] shadow-sm flex-1">
        <h3 className="font-hand text-2xl font-bold text-[#3a1f0b] underline decoration-[#8c6438]/50 underline-offset-4 mb-2.5">
          Выводы:
        </h3>
        <div className="space-y-2">
          {state.diaryConclusions.map((c) => (
            <div key={c.id} className="flex items-start gap-2 font-hand text-xl text-[#2a180b]">
              {c.checked ? (
                <CheckSquare className="w-5 h-5 shrink-0 text-[#8b281a] mt-0.5" />
              ) : (
                <Square className="w-5 h-5 shrink-0 text-[#7d582e] mt-0.5" />
              )}
              <span className={c.checked ? 'line-through opacity-75' : ''}>{c.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return { left, right };
}

// === 2. MAP & PROCEDURAL DEEP-SEA EXPEDITION SPREAD ===
export function useMapSpread(
  state: GameState,
  onTravelHub: (loc: HubLocationId) => void,
  onStartExpedition: (sectorId: string) => void
): BookSpreadPages {
  const [selectedSectorId, setSelectedSectorId] = useState(
    state.sectors.find((s) => !s.completed && s.unlocked)?.id || state.sectors[0].id
  );
  const selectedSector =
    state.sectors.find((s) => s.id === selectedSectorId) || state.sectors[0];

  const hubPlaces: Array<{
    id: HubLocationId;
    name: string;
    subtitle: string;
    detail: string;
  }> = [
    {
      id: 'bar_admiral',
      name: 'Бар «Адмирал»',
      subtitle: 'База Сильвера · Контрабандисты · Столик Флинта',
      detail: 'Сердце подводного Грота. Здесь можно поговорить с Сильвером, купить еду и слухи, или вскрыть тайную подсобку.',
    },
    {
      id: 'scrapyard',
      name: 'Свалка и Доки Гайки',
      subtitle: 'Механик Гайка · Детали · Лом',
      detail: 'Огромный грот с обломками имперских судов. Продаются модули брони и вооружения для Маленького Джона.',
    },
    {
      id: 'submarine_dock',
      name: 'Причал субмарины «Абиссаль»',
      subtitle: 'Команда Флинта · Отдых и ремонт',
      detail: 'Субмарина головорезов готова к погружению. Здесь можно отдохнуть до следующего дня и подслушать тайны экипажа.',
    },
    {
      id: 'whispering_reef',
      name: 'Шепчущий Риф',
      subtitle: 'Древний шлюз · Тренировка Медиума',
      detail: 'Граница пещеры перед чёрным обрывом. Опасное, но ценное место для настройки на волны Атлантиды.',
    },
  ];

  const canDiveSelected =
    !state.activeExpedition &&
    (selectedSector.type !== 'atlantis_vault' || state.atlantisKeys >= 3);

  const left = (
    <div className="animate-page-in flex flex-col flex-1">
      <header className="text-center mb-4 pb-2.5 border-b border-[#987041]/40">
        <div className="text-xs text-[#6f4a24]">❖ Подводный Грот «Убежище» ❖</div>
        <h2 className="font-display text-3xl font-bold text-[#2b170b]">Карта поселения</h2>
      </header>

      {state.activeExpedition && (
        <div className="mb-3 p-3 rounded bg-[#f1d5c2] border border-[#a8482f] text-xs text-[#541b0e]">
          Сейчас вы находитесь в глубоководной экспедиции! Вернитесь на вкладку «Сцена», чтобы продолжить погружение.
        </div>
      )}

      <div className="space-y-2.5 flex-1">
        {hubPlaces.map((loc) => {
          const isHere = state.currentLocation === loc.id && !state.activeExpedition;
          return (
            <div
              key={loc.id}
              className={`p-3 rounded-md border transition-colors ${
                isHere
                  ? 'bg-[#f4dfae] border-[#8b5c22]'
                  : 'bg-[#ead4a9]/75 border-[#9d7544]/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div>
                  <div className="font-display text-xl font-bold text-[#2a170a] leading-tight">
                    {loc.name}
                  </div>
                  <div className="text-[11px] text-[#6d4a25]">{loc.subtitle}</div>
                </div>
                <button
                  type="button"
                  disabled={Boolean(state.activeExpedition)}
                  onClick={() => {
                    sfx.playPageTurn();
                    onTravelHub(loc.id);
                  }}
                  className={`px-3 py-1.5 rounded text-xs font-semibold cursor-pointer disabled:opacity-45 whitespace-nowrap ${
                    isHere ? 'parchment-choice-primary text-[#241206]' : 'parchment-choice text-[#2b180b]'
                  }`}
                >
                  {isHere ? 'Вы здесь' : 'Перейти'}
                </button>
              </div>
              <p className="text-xs text-[#3b2412] leading-relaxed">{loc.detail}</p>
            </div>
          );
        })}
      </div>
    </div>
  );

  const right = (
    <div className="animate-page-in flex flex-col flex-1 gap-3">
      <div className="brass-plate rounded-lg p-3">
        <div className="flex items-center justify-between text-xs text-[#d6ece5] mb-2">
          <span className="flex items-center gap-1.5 font-semibold">
            <Compass className="w-4 h-4 text-[#5ef0cf]" />
            Процедурная карта Бездны (Зерно #{state.seed})
          </span>
          <span className="tabular-nums text-[#f0c76e]">
            Ключи: {state.atlantisKeys}/3
          </span>
        </div>

        <div className="relative h-[250px] rounded border border-[#4c726c] bg-[#07181f] overflow-hidden">
          <svg viewBox="0 0 400 240" className="w-full h-full opacity-45">
            <circle cx="200" cy="120" r="45" fill="none" stroke="#318a7f" strokeWidth="1" />
            <circle cx="200" cy="120" r="95" fill="none" stroke="#318a7f" strokeWidth="1" />
            <circle cx="200" cy="120" r="150" fill="none" stroke="#318a7f" strokeWidth="1" />
            <line x1="0" y1="120" x2="400" y2="120" stroke="#24635c" strokeWidth="1" strokeDasharray="4 4" />
            <line x1="200" y1="0" x2="200" y2="240" stroke="#24635c" strokeWidth="1" strokeDasharray="4 4" />
          </svg>

          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            style={{ left: '12%', top: '16%' }}
          >
            <div className="w-6 h-6 rounded-full bg-[#e6b34e] border-2 border-[#fff0c2] flex items-center justify-center text-[#1d1107]">
              <Anchor className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-semibold text-[#f5da9a] mt-0.5 whitespace-nowrap">
              Грот
            </span>
          </div>

          {state.sectors.map((sec) => {
            const isSelected = sec.id === selectedSector.id;
            const lockedVault = sec.type === 'atlantis_vault' && state.atlantisKeys < 3;

            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  sfx.playSonarPing();
                  setSelectedSectorId(sec.id);
                }}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center group cursor-pointer"
                style={{ left: `${sec.x}%`, top: `${sec.y}%` }}
              >
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-transform ${
                    isSelected ? 'scale-115 shadow-[0_0_16px_rgba(94,240,207,0.7)]' : 'group-hover:scale-105'
                  } ${
                    sec.completed
                      ? 'bg-[#2a5446] border-[#76e3b8] text-[#d5ffef]'
                      : lockedVault
                      ? 'bg-[#231a1c] border-[#876258] text-[#bda098]'
                      : sec.type === 'atlantis_vault'
                      ? 'bg-[#195e63] border-[#78ffdf] text-[#ffffff]'
                      : 'bg-[#2b1f16] border-[#e8b453] text-[#ffebc0]'
                  }`}
                >
                  {lockedVault ? <Lock className="w-3.5 h-3.5" /> : sec.completed ? '✓' : sec.danger}
                </div>
                <span className="mt-0.5 px-1.5 py-0.5 rounded bg-[#061217]/85 text-[10px] text-[#e5f5f0] whitespace-nowrap max-w-[130px] truncate">
                  {sec.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="brass-plate rounded-lg p-3.5 flex-1 flex flex-col justify-between text-[#f2dfbe]">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-display text-xl font-bold text-[#f7d893]">
              {selectedSector.name}
            </h3>
            <span className="text-xs text-[#7beed4] tabular-nums whitespace-nowrap">
              Глубина {selectedSector.depthMeters} м
            </span>
          </div>
          <div className="text-[11px] text-[#cbb286] mb-2 tabular-nums">
            Опасность: {selectedSector.danger}/5 · Награда: {selectedSector.rewardPreview}
          </div>
          <p className="text-xs leading-relaxed text-[#e6d3b1] mb-3">
            {selectedSector.description}
          </p>
        </div>

        <button
          type="button"
          disabled={!canDiveSelected}
          onClick={() => {
            sfx.playSonarPing();
            onStartExpedition(selectedSector.id);
          }}
          className="w-full py-2.5 px-4 rounded bg-gradient-to-b from-[#e4b34e] to-[#b58124] text-[#1c1006] font-bold text-sm border border-[#ffeaad] hover:brightness-110 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
        >
          {selectedSector.type === 'atlantis_vault' && state.atlantisKeys < 3
            ? `Нужно собрать 3 Ключа Бездны (сейчас ${state.atlantisKeys}/3)`
            : selectedSector.completed
            ? 'Повторить погружение за ресурсами'
            : 'Начать погружение на «Абиссали»'}
        </button>
      </div>
    </div>
  );

  return { left, right };
}

// === 3. CHARACTERS & LITTLE JOHN WORKBENCH SPREAD ===
export function buildCharactersSpread(
  state: GameState,
  onInstallDroidPart: (itemId: string) => void,
  onRepairJohnWithScrap: () => void,
  onHireCrew: (crewId: 'krag' | 'salli' | 'morven' | 'vex') => void
): BookSpreadPages {
  const availableParts = state.inventory.filter(
    (item) => item.category === 'part' && item.quantity > 0 && item.droidSlot
  );

  const isDemoDay = state.episodeMode === 'demo_day';

  const left = (
    <div className="animate-page-in flex flex-col flex-1 gap-3">
      <header className="text-center pb-2 border-b border-[#987041]/40">
        <div className="text-xs text-[#6f4a24]">
          {isDemoDay ? '❖ Главные герои ❖' : '❖ Главные герои и верстак ❖'}
        </div>
        <h2 className="font-display text-3xl font-bold text-[#2b170b]">
          Джил и Маленький Джон
        </h2>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div className="p-3 rounded-md bg-[#f3e1bc] border border-[#966e3d]">
          <div className="flex items-center gap-2.5 mb-2">
            <PortraitFrame id="jill" size="md" active />
            <div>
              <div className="font-display text-lg font-bold text-[#2b170b] leading-none">
                Джил (9 лет)
              </div>
              <div className="text-[11px] text-[#6d4822] mt-0.5">Механик · Непоседа</div>
            </div>
          </div>
          <p className="text-xs text-[#3b2412] leading-snug">
            Везде суёт свой нос, чинит механизмы на слух, собирает необычные железки и записывает
            события дня в собственный дневник.
          </p>
        </div>

        <div className="p-3 rounded-md bg-[#f3e1bc] border border-[#966e3d]">
          <div className="flex items-center gap-2.5 mb-2">
            <PortraitFrame id="john" size="md" active />
            <div>
              <div className="font-display text-lg font-bold text-[#2b170b] leading-none">
                Маленький Джон
              </div>
              <div className="text-[11px] text-[#6d4822] mt-0.5 tabular-nums">
                {isDemoDay ? 'Рост ~2 м · Самодельный дроид' : `J-17 (~2 м) · HP ${state.johnHp}/${state.johnMaxHp}`}
              </div>
            </div>
          </div>
          {isDemoDay ? (
            <p className="text-xs text-[#3b2412] leading-snug">
              Тяжёлый, громоздкий и слегка неуклюжий двухметровый робот из арматуры, меди, латуни,
              труб и заклёпок поверх старого имперского каркаса. «Маленький» — ласковое прозвище.
            </p>
          ) : (
            <button
              type="button"
              disabled={state.scrap < 6 || state.johnHp >= state.johnMaxHp}
              onClick={onRepairJohnWithScrap}
              className="w-full py-1.5 px-2.5 rounded parchment-choice text-xs font-semibold text-[#2a170a] flex items-center justify-center gap-1.5 disabled:opacity-45 cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Починить (+8 HP за 6 деталей)</span>
            </button>
          )}
        </div>
      </div>

      {isDemoDay ? (
        <div className="p-4 rounded-md bg-[#ead3a5] border border-[#926939] flex-1 space-y-2.5">
          <h3 className="font-display text-xl font-bold text-[#2b170b]">
            Устройство Маленького Джона
          </h3>
          <p className="text-xs text-[#3b2412] leading-relaxed">
            Джил восстановила и пересобрала Джона из всего, что нашлось на свалке и в старых доках:
            арматура, медные трубы, латунные щитки, заклёпки и уцелевшие имперские сервоприводы.
            В дверных проёмах «Адмирала» ему приходится пригибаться и проходить боком, зато он может
            удержать стальную распорку там, где не справится ни один взрослый.
          </p>
          <p className="text-xs text-[#5b3a1b] italic">
            В свободном режиме здесь открывается верстак для установки найденных модулей и
            пробуждения фрагментов памяти J-17.
          </p>
        </div>
      ) : (
        <div className="p-3 rounded-md bg-[#ead3a5] border border-[#926939] flex-1">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-xl font-bold text-[#2b170b]">
              Модификация шасси J-17
            </h3>
            <span className="text-xs text-[#69441f] tabular-nums">
              Восстановлено: {state.johnMemoryRestored}/5
            </span>
          </div>

          <div className="space-y-2">
            {(Object.keys(DROID_SLOT_LABELS) as DroidSlotKey[]).map((slotKey) => {
              const installedId = state.droidSlots[slotKey];
              const installedItem = installedId ? ITEM_CATALOG[installedId] : null;
              const matchingPart = availableParts.find((p) => p.droidSlot === slotKey);

              return (
                <div
                  key={slotKey}
                  className="p-2 rounded bg-[#f6e8ca] border border-[#9e7748]/70 text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-[#2b170a]">
                        {DROID_SLOT_LABELS[slotKey].title}
                      </div>
                      <div className="text-[11px] text-[#684522]">
                        {installedItem ? (
                          <span className="text-[#275c34] font-semibold">
                            Установлено: {installedItem.name} ({installedItem.droidBonus?.specialAbility})
                          </span>
                        ) : (
                          DROID_SLOT_LABELS[slotKey].desc
                        )}
                      </div>
                    </div>
                    {matchingPart && !installedItem && (
                      <button
                        type="button"
                        onClick={() => onInstallDroidPart(matchingPart.id)}
                        className="px-2.5 py-1 rounded parchment-choice-primary text-[11px] font-bold text-[#211106] cursor-pointer whitespace-nowrap"
                      >
                        Установить
                      </button>
                    )}
                  </div>
                  {installedItem?.droidBonus?.memoryFragment && (
                    <div className="mt-1.5 pt-1 border-t border-[#a37e50]/35 text-[11px] italic text-[#4d3219]">
                      {installedItem.droidBonus.memoryFragment}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const right = (
    <div className="animate-page-in flex flex-col flex-1 gap-3">
      <div className="brass-plate rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[#f2dfbe]">
        <div className="flex items-start gap-2.5 p-2 rounded bg-[#18120d] border border-[#614526]">
          <PortraitFrame id="silver" size="sm" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-[#f6d68e]">Сильвер</div>
            <div className="text-[11px] text-[#c7ae82] leading-snug mt-0.5">
              {state.flags.silver_watch_returned
                ? 'Опекун Джил и хозяин «Адмирала». Часы Меган снова на его цепочке. Ворчит как прежде, но в глазах стало теплее.'
                : 'Одноногий хозяин бара «Адмирал» и опекун Джил. Знал её родителей — Роя и Меган. Заботу выражает поступками, а не длинными речами.'}
            </div>
          </div>
        </div>

        {isDemoDay ? (
          <div className="flex items-start gap-2.5 p-2 rounded bg-[#18120d] border border-[#614526]">
            <PortraitFrame id="salli" size="sm" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#f6d68e]">Салли</div>
              <div className="text-[11px] text-[#c7ae82] leading-snug mt-0.5">
                Разносчица рыбы с причалов и частая гостья «Адмирала». Независимая, острая на язык,
                всегда знает свежие новости города.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5 p-2 rounded bg-[#18120d] border border-[#614526]">
            <PortraitFrame id="flint" size="sm" />
            <div className="min-w-0">
              <div className="text-xs font-bold text-[#f6d68e]">Капитан Флинт</div>
              <div className="text-[11px] text-[#c7ae82] leading-snug mt-0.5">
                {state.flags.storeroom_opened
                  ? 'Улики подтверждают: Флинт использует дар медиума Джил как «ключ» к Атлантиде!'
                  : 'Скучающий аристократ и капитан «Абиссали». Скрывает свои истинные виды на Джил.'}
              </div>
            </div>
          </div>
        )}
      </div>

      {isDemoDay ? (
        <div className="brass-plate rounded-lg p-4 flex-1 flex flex-col justify-between text-[#f2dfbe]">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-sm font-bold text-[#f6d68e]">
              <Users className="w-4 h-4" />
              <span>Люди бара «Адмирал»</span>
            </div>
            <div className="p-2.5 rounded bg-[#17110d] border border-[#5d4225] text-xs space-y-1">
              <div className="font-bold text-[#f8e4bc]">Гусь (11 лет)</div>
              <p className="text-[11px] text-[#d9c49f] leading-snug">
                Вихрастый посыльный из доков. Старается держаться независимо и ужасно стесняется,
                когда не хватает гаек на горячий суп.
              </p>
            </div>
            <div className="p-2.5 rounded bg-[#17110d] border border-[#5d4225] text-xs space-y-1">
              <div className="font-bold text-[#f8e4bc]">Слесарь Гайка и завсегдатаи</div>
              <p className="text-[11px] text-[#d9c49f] leading-snug">
                Рыбаки, ремонтники и механики подводного города. По вечерам они заполняют «Адмирал»
                шумом, спорами о трубах и запахом мокрой шерсти.
              </p>
            </div>
            {state.flags.demo_done_salli && (
              <div className="p-2.5 rounded bg-[#17110d] border border-[#5d4225] text-xs space-y-1">
                <div className="font-bold text-[#f8e4bc]">Слухи с верхних причалов</div>
                <p className="text-[11px] text-[#d9c49f] leading-snug">
                  Салли упоминала незнакомого капитана, который расплатился золотым дукатом и
                  пошутил, что «взял город». В «Адмирал» он ещё не заходил.
                </p>
              </div>
            )}
          </div>
          <div className="text-[11px] text-[#bfa67d] pt-2 border-t border-[#5d4225]/60">
            Экипаж субмарины «Абиссаль» открывается в свободном режиме приключений.
          </div>
        </div>
      ) : (
        <div className="brass-plate rounded-lg p-3.5 flex-1 flex flex-col text-[#f2dfbe]">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5 text-sm font-bold text-[#f6d68e]">
              <Users className="w-4 h-4" />
              <span>Команда субмарины «Абиссаль»</span>
            </div>
            <span className="text-[11px] text-[#bda47b]">
              Нанято: {state.crew.filter((c) => c.hired).length}/{state.crew.length}
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto brass-scroll pr-1 flex-1">
            {state.crew.map((member) => (
              <div
                key={member.id}
                className={`p-2.5 rounded border ${
                  member.hired
                    ? 'bg-[#241c13] border-[#d9a44b]'
                    : 'bg-[#17110d] border-[#5d4225]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <PortraitFrame id={member.portrait} size="sm" active={member.hired} />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-[#f8e4bc]">
                        {member.name} <span className="font-normal text-[#bfa67d]">· {member.role}</span>
                      </div>
                      <p className="text-[11px] text-[#d9c49f] leading-snug mt-0.5">
                        {member.publicBio}
                      </p>
                      <div className="text-[11px] text-[#84e8cf] mt-1">
                        Бонус: {member.combatBonus}
                      </div>
                      {member.secretRevealed && (
                        <div className="mt-1 text-[11px] italic text-[#f2b37c]">
                          Тайная цель: {member.hiddenSecret}
                        </div>
                      )}
                    </div>
                  </div>

                  {member.hired ? (
                    <span className="text-[11px] font-semibold text-[#7ae8ba] whitespace-nowrap shrink-0">
                      В отряде
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={state.coins < member.hireCost}
                      onClick={() => onHireCrew(member.id)}
                      className="px-2.5 py-1.5 rounded bg-gradient-to-b from-[#9c6a2b] to-[#6d471a] border border-[#e3b058] text-xs font-semibold text-[#fff2d2] hover:brightness-110 disabled:opacity-40 cursor-pointer whitespace-nowrap tabular-nums shrink-0"
                    >
                      Нанять ({member.hireCost} 🪙)
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return { left, right };
}

// === 4. INVENTORY SPREAD ===
export function useInventorySpread(
  state: GameState,
  onUseItem: (itemId: string) => void,
  onInstallDroidPart: (itemId: string) => void
): BookSpreadPages {
  const [filter, setFilter] = useState<'all' | 'tool' | 'part' | 'consumable' | 'artifact' | 'document'>('all');
  const items = state.inventory.filter(
    (i) => i.quantity > 0 && (filter === 'all' || i.category === filter)
  );
  const [selectedId, setSelectedId] = useState(items[0]?.id || '');
  const selected = items.find((i) => i.id === selectedId) || items[0];

  const left = (
    <div className="animate-page-in flex flex-col flex-1">
      <header className="text-center mb-3 pb-2 border-b border-[#987041]/40">
        <div className="text-xs text-[#6f4a24]">❖ Рюкзак Джил и трюм ❖</div>
        <h2 className="font-display text-3xl font-bold text-[#2b170b]">Инвентарь и находки</h2>
      </header>

      <div className="flex flex-wrap gap-1 mb-3">
        {[
          { id: 'all', label: 'Всё' },
          { id: 'consumable', label: 'Припасы' },
          { id: 'part', label: 'Детали Джона' },
          { id: 'tool', label: 'Инструменты' },
          { id: 'artifact', label: 'Артефакты' },
          { id: 'document', label: 'Улики' },
        ].map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => {
              sfx.playClick();
              setFilter(f.id as typeof filter);
            }}
            className={`px-2.5 py-1 rounded text-xs font-semibold border cursor-pointer ${
              filter === f.id
                ? 'bg-[#d79e43] text-[#211106] border-[#7a4e18]'
                : 'bg-[#e7d0a3] text-[#462a13] border-[#9d7545]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 content-start">
        {items.length === 0 ? (
          <div className="col-span-2 text-sm text-[#6b4926] italic py-8 text-center">
            В этом отделении рюкзака пока пусто.
          </div>
        ) : (
          items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                sfx.playClick();
                setSelectedId(item.id);
              }}
              className={`p-2.5 rounded-md border text-left flex items-center gap-2.5 cursor-pointer transition-colors ${
                selected?.id === item.id
                  ? 'bg-[#f6e3b6] border-[#7f4f19]'
                  : 'bg-[#ead4a9]/70 border-[#9c7443]/60 hover:bg-[#f2deb4]'
              }`}
            >
              <div className="w-10 h-10 rounded bg-[#231912] border border-[#8e6739] flex items-center justify-center shrink-0">
                {getItemIcon(item.icon)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-[#2a170a] truncate">{item.name}</div>
                <div className="text-[11px] text-[#6d4822] tabular-nums">
                  Кол-во: {item.quantity} · Цена {item.price} 🪙
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  const right = (
    <div className="animate-page-in flex flex-col flex-1 justify-between">
      {selected ? (
        <div className="brass-plate rounded-lg p-5 text-[#f2dfbe] space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-16 h-16 rounded-lg bg-[#251b13] border-2 border-[#c9984c] flex items-center justify-center">
              {getItemIcon(selected.icon)}
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-[#f7d894] leading-tight">
                {selected.name}
              </h3>
              <div className="text-xs text-[#c5ab80] mt-0.5 tabular-nums">
                В рюкзаке: {selected.quantity} шт. · Оценка: {selected.price} дублонов
              </div>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-[#ebd9b8]">{selected.description}</p>

          <div className="p-3 rounded bg-[#18120d] border border-[#6a4c28]">
            <div className="text-[11px] text-[#c7a872] mb-0.5">Заметка Джил:</div>
            <p className="font-hand text-xl text-[#f9dda0] leading-snug">«{selected.jillNote}»</p>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            {selected.effect && (
              <button
                type="button"
                onClick={() => onUseItem(selected.id)}
                className="px-4 py-2 rounded bg-gradient-to-b from-[#e4b34e] to-[#b58124] text-[#1c1006] font-bold text-sm border border-[#ffeaad] hover:brightness-110 cursor-pointer"
              >
                Использовать сейчас
              </button>
            )}
            {selected.droidSlot && (
              <button
                type="button"
                onClick={() => onInstallDroidPart(selected.id)}
                className="px-4 py-2 rounded bg-gradient-to-b from-[#398a77] to-[#235c50] text-[#e7fff8] font-bold text-sm border border-[#74edd1] hover:brightness-110 cursor-pointer"
              >
                Установить на Маленького Джона
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="brass-plate rounded-lg p-6 text-center text-sm text-[#c8ae84]">
          Выберите предмет слева, чтобы осмотреть его.
        </div>
      )}

      <SceneIllustration art="jill_john_bond" className="h-[195px] mt-3" caption="Снаряжение проверяем дважды — на глубине второго шанса нет." />
    </div>
  );

  return { left, right };
}

// === 5. SKILLS SPREAD ===
export function buildSkillsSpread(
  state: GameState,
  onUpgradeSkill: (skill: SkillKey) => void
): BookSpreadPages {
  const skillCards: Array<{
    key: SkillKey;
    name: string;
    icon: React.ReactNode;
    desc: string;
    perks: string[];
  }> = [
    {
      key: 'mechanics',
      name: 'Механика и Ремонт',
      icon: <Cog className="w-5 h-5 text-[#e6a945]" />,
      desc: 'Прирождённый талант Джил к шестерёнкам, отмычкам и ремонту Маленького Джона.',
      perks: [
        'Ур. 1: Увеличивает зону щелчка при взломе замков',
        'Ур. 2: Подсвечивает ориентир штифтов и +25% деталей со свалки',
        'Ур. 3: Мастер-взломщик и усиление модулей Джона',
      ],
    },
    {
      key: 'stealth',
      name: 'Скрытность и Хитрость',
      icon: <Footprints className="w-5 h-5 text-[#75d9a8]" />,
      desc: 'Умение проскользнуть мимо имперских патрулей, подслушать тайны и ударить со спины.',
      perks: [
        'Ур. 1: Открывает скрытные обходы в баре и на причале',
        'Ур. 2: Бесшумный обход имперских кордонов в экспедициях',
        'Ур. 3: Отвлечение в бою усиливает критический удар',
      ],
    },
    {
      key: 'combat',
      name: 'Боевые протоколы Джона',
      icon: <Swords className="w-5 h-5 text-[#e86b51]" />,
      desc: 'Агрессивная тактика, усиленная броня и сокрушительные удары бывшего боевого дроида.',
      perks: [
        'Ур. 1: +2 к базовому урону Джил и Джона в бою',
        'Ур. 2: Силовое вскрытие дверей и +4 к блоку Защиты',
        'Ур. 3: Критический перегруз брони и оглушение врагов',
      ],
    },
    {
      key: 'medium',
      name: 'Дар Медиума (Шёпот Бездны)',
      icon: <Eye className="w-5 h-5 text-[#66f0d1]" />,
      desc: 'Редкая способность слышать затонувшие корабли, ауры людей и древние артефакты Атлантиды.',
      perks: [
        'Ур. 1: Резонанс артефактов и атака «Медиум» в бою',
        'Ур. 2: Чтение скрытых мотивов Флинта и ослабление ужасов',
        'Ур. 3: Открывает мистический путь и защиту от безумия',
      ],
    },
  ];

  const xpNeeded = 60;
  const xpProgress = state.xp % xpNeeded;

  const left = (
    <div className="animate-page-in flex flex-col flex-1">
      <header className="text-center mb-4 pb-2.5 border-b border-[#987041]/40">
        <div className="text-xs text-[#6f4a24]">❖ Развитие стиля прохождения ❖</div>
        <h2 className="font-display text-3xl font-bold text-[#2b170b]">Знания и Навыки</h2>
      </header>

      <div className="mb-4 p-3 rounded-md bg-[#e5cc9b] border border-[#966e3d] flex items-center justify-between text-xs text-[#341f0e] tabular-nums">
        <div>
          Опыт: <strong>{state.xp} XP</strong> (до нового очка: {xpNeeded - xpProgress} XP)
        </div>
        <div className="font-bold text-[#753e12]">
          Свободных очков: {state.skillPoints}
        </div>
      </div>

      <div className="space-y-3 flex-1">
        {skillCards.map((sk) => {
          const level = state.skills[sk.key];
          const canUpgrade = state.skillPoints > 0 && level < 3;
          return (
            <div key={sk.key} className="p-3 rounded-md bg-[#f5e6c6] border border-[#9c7444]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-[#231912] border border-[#8a6436]">{sk.icon}</div>
                  <div>
                    <div className="font-display text-lg font-bold text-[#2a170a] leading-none">
                      {sk.name}
                    </div>
                    <div className="text-[11px] text-[#6d4822] tabular-nums mt-0.5">
                      Уровень {level} / 3
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!canUpgrade}
                  onClick={() => {
                    sfx.playWrench();
                    onUpgradeSkill(sk.key);
                  }}
                  className="px-3 py-1.5 rounded parchment-choice-primary text-xs font-bold text-[#211106] disabled:opacity-40 cursor-pointer whitespace-nowrap"
                >
                  {level >= 3 ? 'Макс.' : '+ Улучшить'}
                </button>
              </div>
              <p className="text-xs text-[#3e2613] mb-1.5">{sk.desc}</p>
              <div className="space-y-0.5 text-[11px] text-[#5e3d1e]">
                {sk.perks.map((perk, idx) => (
                  <div key={idx} className={level > idx ? 'font-semibold text-[#23542e]' : 'opacity-70'}>
                    {level > idx ? '✓ ' : '· '}
                    {perk}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const right = (
    <div className="animate-page-in flex flex-col flex-1 gap-3">
      <SceneIllustration art="atlantis_gate" className="h-[220px]" caption="Кодекс подводного мира и Атлантиды" />

      <div className="brass-plate rounded-lg p-4 flex-1 text-[#f2dfbe] space-y-3 overflow-y-auto brass-scroll">
        <h3 className="font-display text-2xl font-bold text-[#f7d893]">
          Лор Подводного Грота и Бездны
        </h3>
        <div className="space-y-2.5 text-xs leading-relaxed text-[#e3cea8]">
          <p>
            <strong className="text-[#f4c96b]">Империя и Подводный Грот:</strong> Под толщей океана,
            в гигантском воздушном гроте, скрывается вольное поселение контрабандистов и беглецов.
            Имперские крейсеры патрулируют входы, охотясь за беглыми боевыми дроидами серии J.
          </p>
          <p>
            <strong className="text-[#f4c96b]">Бар «Адмирал»:</strong> Старый полуподвальный бар
            одноногого Сильвера — одновременно таверна, биржа контрабанды и единственный дом для
            девятилетней сироты Джил.
          </p>
          <p>
            <strong className="text-[#f4c96b]">Шёпот Атлантиды:</strong> На глубине свыше трёх
            километров лежат руины доимперской цивилизации. Обычные водолазы сходят там с ума, но
            дети-медиумы способны вступать в резонанс с древними замками — именно поэтому капитан
            Флинт затеял свою опасную игру.
          </p>
        </div>
      </div>
    </div>
  );

  return { left, right };
}

// === 6. QUESTS & MORAL COMPASS SPREAD ===
export function buildQuestsSpread(state: GameState): BookSpreadPages {
  if (state.episodeMode === 'demo_day') {
    const left = (
      <div className="animate-page-in flex flex-col flex-1">
        <header className="text-center mb-4 pb-2.5 border-b border-[#987041]/40">
          <div className="text-xs text-[#6f4a24]">❖ Обычный день в «Адмирале» ❖</div>
          <h2 className="font-display text-3xl font-bold text-[#2b170b]">Дела на сегодня</h2>
        </header>

        <div className="p-4 rounded-md bg-[#f4e4c3] border border-[#9b7343] space-y-2.5 flex-1">
          <p className="text-xs text-[#4b2d15] leading-relaxed mb-3">
            Сегодня нет ни больших контрактов, ни погони за сокровищами — просто обычный день в
            подводном баре. Заглядывайте в «Дневник», чтобы увидеть, как Джил запоминает события.
          </p>
          {state.diaryConclusions.map((c) => (
            <div key={c.id} className="flex items-start gap-2 font-hand text-xl text-[#2a180b]">
              {c.checked ? (
                <CheckSquare className="w-5 h-5 shrink-0 text-[#8b281a] mt-0.5" />
              ) : (
                <Square className="w-5 h-5 shrink-0 text-[#7d582e] mt-0.5" />
              )}
              <span className={c.checked ? 'line-through opacity-75' : ''}>{c.text}</span>
            </div>
          ))}
        </div>
      </div>
    );

    const right = (
      <div className="animate-page-in flex flex-col flex-1 gap-3">
        <div className="brass-plate rounded-lg p-4 text-[#f2dfbe] space-y-2.5">
          <h3 className="font-display text-2xl font-bold text-[#f7d893]">
            Без шкалы «добра и зла»
          </h3>
          <p className="text-xs text-[#d6be96] leading-relaxed">
            В вводной главе «Обычный день в „Адмирале“» у поступков нет ярлыков и числовых
            оценок. Мир отвечает тихо — через детали вечера, реплики Сильвера и записи в дневнике
            самой Джил.
          </p>
        </div>
        <SceneIllustration
          art="silver_smoking"
          className="h-[245px]"
          caption="«Сначала подотри стойку, Рыжая. Большие дела подождут.» — Сильвер"
        />
      </div>
    );

    return { left, right };
  }

  const left = (
    <div className="animate-page-in flex flex-col flex-1">
      <header className="text-center mb-4 pb-2.5 border-b border-[#987041]/40">
        <div className="text-xs text-[#6f4a24]">❖ Контракты и поручения ❖</div>
        <h2 className="font-display text-3xl font-bold text-[#2b170b]">Журнал Задач</h2>
      </header>

      <div className="space-y-3 flex-1">
        {state.quests.map((q) => (
          <div
            key={q.id}
            className={`p-3.5 rounded-md border ${
              q.completed
                ? 'bg-[#dfe8d4]/85 border-[#65804f]'
                : 'bg-[#f4e4c3] border-[#9b7343]'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-1">
              <h3 className="font-display text-xl font-bold text-[#2b170a] leading-tight">
                {q.title}
              </h3>
              <span className="text-[11px] font-semibold text-[#6b4620] whitespace-nowrap">
                {q.completed ? 'Выполнено' : q.type === 'main' ? 'Главное' : 'Поручение'}
              </span>
            </div>
            <p className="text-xs text-[#3b2412] leading-relaxed mb-1.5">{q.description}</p>
            <div className="text-xs font-semibold text-[#543214]">Цель: {q.objective}</div>
            <div className="text-[11px] text-[#754f27] mt-0.5">Награда: {q.rewardText}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const compassionPct = Math.max(0, Math.min(100, Math.round((state.compassion + 100) / 2)));

  const right = (
    <div className="animate-page-in flex flex-col flex-1 gap-3">
      <div className="brass-plate rounded-lg p-4 text-[#f2dfbe] space-y-4">
        <h3 className="font-display text-2xl font-bold text-[#f7d893]">
          Компас Судьбы (Свободный режим)
        </h3>
        <p className="text-xs text-[#d6be96] leading-relaxed">
          Решения Джил в Гроте и во время глубоководных экспедиций меняют отношение Сильвера,
          Флинта, экипажа и самой Бездны — определяя, какая из 4 концовок откроется у Врат Атлантиды.
        </p>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#e8946b]">Расчёт Флинта</span>
            <span className="font-semibold text-[#f7d893] tabular-nums">
              Склонность: {state.compassion}
            </span>
            <span className="text-[#87e8be]">Сердце Сильвера</span>
          </div>
          <div className="h-3 rounded bg-[#140e0b] border border-[#7c592f] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#b84c35] via-[#d9a84c] to-[#4fb58a]"
              style={{ width: `${compassionPct}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#cbb286]">Земной рассудок</span>
            <span className="font-semibold text-[#75f2d6] tabular-nums">
              Зов Бездны: {state.abyssAffinity}%
            </span>
          </div>
          <div className="h-3 rounded bg-[#140e0b] border border-[#457874] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#256b6e] to-[#68f5d6]"
              style={{ width: `${Math.min(100, state.abyssAffinity)}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[#cbb286]">Пробуждение Маленького Джона (J-17)</span>
            <span className="font-semibold text-[#f7d893] tabular-nums">
              {state.johnMemoryRestored} / 5 модулей
            </span>
          </div>
          <div className="h-3 rounded bg-[#140e0b] border border-[#7c592f] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#9e6b29] to-[#f2c461]"
              style={{ width: `${(state.johnMemoryRestored / 5) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <SceneIllustration art="silver_smoking" className="h-[225px]" caption="«В Бездне легко найти золото, Рыжая. Трудно не потерять себя.» — Сильвер" />
    </div>
  );

  return { left, right };
}

// === 7. SETTINGS SPREAD ===
export function useSettingsSpread(
  state: GameState,
  onToggleSound: () => void,
  onSaveManual: () => void,
  onStartNewSeed: (seed: number) => void,
  onStartDemoDay: () => void,
  onSwitchToAdventure: () => void
): BookSpreadPages {
  const [newSeed, setNewSeed] = useState(String(Math.floor(1000 + Math.random() * 8999)));

  const left = (
    <div className="animate-page-in flex flex-col flex-1 justify-between">
      <div>
        <header className="text-center mb-4 pb-2.5 border-b border-[#987041]/40">
          <div className="text-xs text-[#6f4a24]">❖ Управление книгой ❖</div>
          <h2 className="font-display text-3xl font-bold text-[#2b170b]">Настройки и Сохранение</h2>
        </header>

        <div className="space-y-3">
          <button
            type="button"
            onClick={onToggleSound}
            className="w-full p-3.5 rounded-md parchment-choice flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              {state.soundEnabled ? <Volume2 className="w-5 h-5 text-[#5c3615]" /> : <VolumeX className="w-5 h-5 text-[#5c3615]" />}
              <div className="text-left">
                <div className="text-sm font-bold text-[#2a170a]">Звуки книги и механизмов</div>
                <div className="text-xs text-[#684522]">Шелест страниц, щелчки замков, сонар и бой</div>
              </div>
            </div>
            <span className="text-xs font-bold text-[#4e2d10]">
              {state.soundEnabled ? 'Вкл.' : 'Выкл.'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              sfx.playCoin();
              onSaveManual();
            }}
            className="w-full p-3.5 rounded-md parchment-choice-primary flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2.5">
              <Save className="w-5 h-5 text-[#45260b]" />
              <div className="text-left">
                <div className="text-sm font-bold text-[#231206]">Сохранить прогресс вручную</div>
                <div className="text-xs text-[#543214]">Игра также сохраняется автоматически после каждого хода</div>
              </div>
            </div>
            <span className="text-xs font-bold text-[#231206]">Сохранить</span>
          </button>

          <div className="p-3.5 rounded-md bg-[#ead3a5] border border-[#966e3d] space-y-2">
            <div className="text-sm font-bold text-[#2b170a]">Главы и режимы книги</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  sfx.playPageTurn();
                  onStartDemoDay();
                }}
                className="px-3 py-2 rounded parchment-choice-primary text-xs font-bold text-[#211106] cursor-pointer"
              >
                Переиграть «Обычный день»
              </button>
              <button
                type="button"
                onClick={() => {
                  sfx.playPageTurn();
                  onSwitchToAdventure();
                }}
                className="px-3 py-2 rounded parchment-choice text-xs font-bold text-[#2a170a] cursor-pointer"
              >
                Свободный режим (экспедиции)
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-md bg-[#ead3a5] border border-[#966e3d] space-y-2">
            <div className="text-sm font-bold text-[#2b170a]">Новое зерно свободного режима</div>
            <p className="text-xs text-[#4b2d15]">
              Сгенерируйте новую карту подводных секторов для экспедиций, взлома и боёв.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSeed}
                onChange={(e) => setNewSeed(e.target.value)}
                className="flex-1 px-3 py-1.5 rounded bg-[#f8edd5] border border-[#966e3d] text-sm font-semibold tabular-nums text-[#2a170a]"
              />
              <button
                type="button"
                onClick={() => setNewSeed(String(Math.floor(1000 + Math.random() * 8999)))}
                className="p-2 rounded parchment-choice cursor-pointer"
                title="Случайное зерно"
              >
                <RotateCcw className="w-4 h-4 text-[#45270f]" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const parsed = parseInt(newSeed.replace(/\D/g, ''), 10) || 4242;
                  onStartNewSeed(parsed);
                }}
                className="px-3.5 py-1.5 rounded bg-[#8a3222] text-[#fff0e6] text-xs font-bold border border-[#611f13] hover:brightness-110 cursor-pointer whitespace-nowrap"
              >
                Начать заново
              </button>
            </div>
          </div>
        </div>
      </div>

      <InkVignette kind="submarine" />
    </div>
  );

  const right = (
    <div className="animate-page-in flex flex-col flex-1 gap-3">
      <div className="brass-plate rounded-lg p-4 text-[#f2dfbe] space-y-2.5 text-xs leading-relaxed">
        <h3 className="font-display text-2xl font-bold text-[#f7d893] flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#f0be5b]" />
          <span>Памятка читателю книги</span>
        </h3>
        <p>
          • <strong className="text-[#f8dba0]">Обычный день в «Адмирале»:</strong> спокойная
          вводная глава от раннего утра до закрытия бара, где выборы не помечены «добром» или
          «злом», а отражаются в мелочах вечера и дневнике Джил.
        </p>
        <p>
          • <strong className="text-[#f8dba0]">Дневник Джил:</strong> личные детские записи о
          прожитом дне — субъективные, тёплые и внимательные к деталям.
        </p>
        <p>
          • <strong className="text-[#f8dba0]">Свободный режим:</strong> все прежние механики
          прототипа (экспедиции, взлом замков, резонанс, пошаговые бои, верстак Маленького Джона и
          4 концовки) сохранены и доступны по завершении дня или по кнопке слева.
        </p>
      </div>

      <div className="brass-plate rounded-lg p-3.5 flex items-center justify-between text-xs text-[#d6be96]">
        <span className="flex items-center gap-1.5">
          <Heart className="w-4 h-4 text-[#e05848]" />
          Текущее зерно океана: <strong className="text-[#f7d893] tabular-nums">#{state.seed}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-[#75e8c8]" />
          Автосохранение активно
        </span>
      </div>
    </div>
  );

  return { left, right };
}
