import React from 'react';
import {
  BookOpen,
  Compass,
  Feather,
  Backpack,
  ScrollText,
  Settings,
  Sparkles,
  Users,
  Heart,
  Zap,
  Cog,
  Coins,
  Brain,
  KeyRound,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { BookTab, GameState } from '../types/game';
import { sfx } from '../utils/sound';

interface BookShellProps {
  state: GameState;
  onSelectTab: (tab: BookTab) => void;
  onToggleSound: () => void;
  leftPage: React.ReactNode;
  rightPage: React.ReactNode;
}

const TABS: Array<{ id: BookTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'story', label: 'Сцена', icon: BookOpen },
  { id: 'diary', label: 'Дневник', icon: Feather },
  { id: 'quests', label: 'Задачи', icon: ScrollText },
  { id: 'map', label: 'Карта', icon: Compass },
  { id: 'characters', label: 'Герои', icon: Users },
  { id: 'inventory', label: 'Вещи', icon: Backpack },
  { id: 'skills', label: 'Знания', icon: Sparkles },
  { id: 'settings', label: 'Опции', icon: Settings },
];

export const BookShell: React.FC<BookShellProps> = ({
  state,
  onSelectTab,
  onToggleSound,
  leftPage,
  rightPage,
}) => {
  const handleTabClick = (id: BookTab) => {
    if (id !== state.activeTab) {
      sfx.playPageTurn();
    } else {
      sfx.playClick();
    }
    onSelectTab(id);
  };

  return (
    <div className="abyss-table-bg min-h-screen w-full flex flex-col items-center justify-center p-2 sm:p-4 lg:p-5">
      {/* Subtle Top Utility Strip (1 line, compact, zero clutter) */}
      <div className="w-full max-w-[1380px] mb-2 flex items-center justify-between gap-4 px-2 text-xs text-[#d2be9a]/85">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-display text-base sm:text-lg font-semibold tracking-wide text-[#f0d59f] whitespace-nowrap">
            Хроники Бездны: Секрет «Адмирала»
          </span>
          <span className="hidden md:inline text-[#8d795b]" aria-hidden="true">·</span>
          <span className="hidden md:inline text-[#b8a280] whitespace-nowrap">
            День {state.day} · Зерно #{state.seed}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-[#b8a280] tabular-nums whitespace-nowrap">
            Ключи Атлантиды: <strong className="text-[#f4c96b]">{state.atlantisKeys}/3</strong>
          </span>
          {state.skillPoints > 0 && (
            <button
              onClick={() => handleTabClick('skills')}
              className="px-2.5 py-1 rounded bg-[#a96c23]/30 border border-[#dfa54d] text-[#fbe09e] hover:bg-[#a96c23]/50 transition-colors whitespace-nowrap cursor-pointer"
            >
              +Очки знаний ({state.skillPoints})
            </button>
          )}
          <button
            onClick={onToggleSound}
            aria-label={state.soundEnabled ? 'Выключить звук' : 'Включить звук'}
            className="p-1.5 rounded border border-[#5f4729] bg-[#16120e]/80 text-[#d8be8f] hover:border-[#c8984c] transition-colors cursor-pointer"
          >
            {state.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Open Leather-Bound Book Container */}
      <div className="relative w-full max-w-[1380px] flex flex-col lg:flex-row items-stretch">
        {/* Mobile Horizontal Tabs */}
        <div className="flex lg:hidden gap-1 overflow-x-auto pb-2 px-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = state.activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-t-md text-xs font-medium whitespace-nowrap shrink-0 border border-b-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#e9b355] text-[#241409] border-[#ffe3a3]'
                    : 'bg-[#d4b686] text-[#3b2513] border-[#7d582e]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Desktop Left Bookmark Ribbon Tabs (exact signature design from mockups) */}
        <aside className="hidden lg:flex flex-col justify-center gap-1.5 pt-8 pb-6 z-20 -mr-1.5 shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = state.activeTab === tab.id;
            const showNotice =
              (tab.id === 'diary' && state.unreadDiary) ||
              (tab.id === 'skills' && state.skillPoints > 0);
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`relative w-[78px] py-2.5 px-1.5 rounded-l-lg flex flex-col items-center justify-center gap-1 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#f5c86b] ${
                  active ? 'book-tab-active text-[#1e1107]' : 'book-tab text-[#3a2312]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-[11px] font-semibold leading-none tracking-tight whitespace-nowrap">
                  {tab.label}
                </span>
                {showNotice && !active && (
                  <span className="absolute top-1.5 right-1.5 text-[10px] font-bold text-[#8c2718]">
                    !
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Leather Cover & Book Pages */}
        <div className="relative flex-1 rounded-xl p-2 sm:p-3 bg-gradient-to-br from-[#3b2416] via-[#26160d] to-[#1a0f08] border-2 border-[#6e4b28] shadow-[0_24px_65px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,220,165,0.2)]">
          {/* Decorative brass corner brackets */}
          <div className="pointer-events-none absolute top-1.5 left-1.5 w-6 h-6 border-t-2 border-l-2 border-[#b98b46]/70 rounded-tl-md" />
          <div className="pointer-events-none absolute top-1.5 right-1.5 w-6 h-6 border-t-2 border-r-2 border-[#b98b46]/70 rounded-tr-md" />
          <div className="pointer-events-none absolute bottom-1.5 left-1.5 w-6 h-6 border-b-2 border-l-2 border-[#b98b46]/70 rounded-bl-md" />
          <div className="pointer-events-none absolute bottom-1.5 right-1.5 w-6 h-6 border-b-2 border-r-2 border-[#b98b46]/70 rounded-br-md" />

          {/* Stacked Paper Edges + Two-Page Open Spread */}
          <div className="relative grid grid-cols-1 lg:grid-cols-2 min-h-[670px] lg:h-[750px] rounded-lg overflow-hidden border border-[#5d3d20] shadow-[0_0_24px_rgba(0,0,0,0.6)]">
            {/* Red Silk Bookmark Ribbon (top-left of left page) */}
            <div
              aria-hidden="true"
              className="pointer-events-none hidden sm:block absolute top-0 left-7 z-20 w-7 h-16 bg-gradient-to-b from-[#7a1e1a] via-[#942620] to-[#631512] shadow-md"
              style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)' }}
            >
              <div className="w-full h-full border-x border-[#d49c54]/45" />
            </div>

            {/* Center Book Gutter Seam (Desktop) */}
            <div
              aria-hidden="true"
              className="pointer-events-none hidden lg:block absolute inset-y-0 left-1/2 -translate-x-1/2 w-8 z-20 bg-gradient-to-r from-transparent via-[#2b170a]/45 to-transparent"
            />

            {/* LEFT PAGE */}
            <section className="parchment-left relative flex flex-col min-h-[540px] lg:h-full overflow-hidden border-b lg:border-b-0 lg:border-r border-[#8d6439]/50">
              <div className="flex-1 overflow-y-auto book-scroll px-5 sm:px-8 pt-6 pb-5 flex flex-col">
                {leftPage}
              </div>
            </section>

            {/* RIGHT PAGE */}
            <section className="parchment-right relative flex flex-col min-h-[560px] lg:h-full overflow-hidden">
              {/* Top-Right Brass Resource Bar (matching the mockups!) */}
              <div className="relative z-10 flex flex-wrap items-center justify-end gap-1.5 px-4 pt-3 pb-2 border-b border-[#8d6439]/30 bg-[#e4cca2]/55">
                <HudCounter
                  icon={<Heart className="w-3.5 h-3.5 text-[#e54d42]" />}
                  label="Джил"
                  value={`${state.jillHp}/${state.jillMaxHp}`}
                  title="Здоровье Джил"
                />
                <HudCounter
                  icon={<Zap className="w-3.5 h-3.5 text-[#f5c449]" />}
                  label="Энерг."
                  value={`${state.energy}/${state.maxEnergy}`}
                  title="Энергия и выносливость"
                />
                <HudCounter
                  icon={<Brain className="w-3.5 h-3.5 text-[#66e0c2]" />}
                  label="Рассудок"
                  value={`${state.sanity}%`}
                  title="Рассудок (защита от хоррора Бездны)"
                />
                <HudCounter
                  icon={<Cog className="w-3.5 h-3.5 text-[#e09d4c]" />}
                  label="Детали"
                  value={`${state.scrap}`}
                  title="Механические детали и хлам для починки Джона"
                />
                <HudCounter
                  icon={<Coins className="w-3.5 h-3.5 text-[#f6cd5a]" />}
                  label="Дублоны"
                  value={`${state.coins}`}
                  title="Контрабандистские дублоны"
                />
                <HudCounter
                  icon={<KeyRound className="w-3.5 h-3.5 text-[#75f2d6]" />}
                  label="Ключи"
                  value={`${state.atlantisKeys}/3`}
                  title="Древние Ключи Атлантиды"
                />
              </div>

              <div className="flex-1 overflow-y-auto book-scroll px-4 sm:px-5 pt-3 pb-4 flex flex-col">
                {rightPage}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

const HudCounter: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  title: string;
}> = ({ icon, label, value, title }) => (
  <div
    title={title}
    className="brass-hud-pill flex items-center gap-1.5 px-2.5 py-1 rounded text-xs text-[#f8e7c5] tabular-nums"
  >
    {icon}
    <span className="hidden xl:inline text-[10px] text-[#c7ae83]">{label}</span>
    <span className="font-semibold">{value}</span>
  </div>
);
