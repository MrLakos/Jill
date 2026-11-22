import React from 'react';
import {
  MessageSquare,
  Scale,
  Search,
  Hand,
  Coins,
  Wrench,
  KeyRound,
  Sparkles,
  FlaskConical,
  ScrollText,
  Compass,
  Shield,
  Cog,
  RotateCcw,
} from 'lucide-react';
import {
  GameState,
  InventoryItem,
  NpcDialogueState,
  SceneArtId,
} from '../types/game';
import { ITEM_CATALOG, MERCHANT_STOCKS } from '../data/itemsAndUpgrades';
import { ENDINGS } from '../data/storyAndNpcs';
import { PortraitFrame, SceneIllustration } from './CroppedArt';
import { CombatPanel } from './CombatPanel';
import { LockpickMiniGame } from './LockpickMiniGame';
import { ResonanceMiniGame } from './ResonanceMiniGame';
import { sfx } from '../utils/sound';

interface RightActivityStageProps {
  state: GameState;
  sceneArt: SceneArtId;
  npc?: NpcDialogueState;
  inspectText?: string;
  merchantId?: 'silver' | 'gaika' | 'salli';
  onSetActionTab: (tab: GameState['rightActionTab']) => void;
  onSelectItem: (itemId: string) => void;
  onUseItem: (itemId: string) => void;
  onBuyItem: (itemId: string) => void;
  onSellItem: (itemId: string) => void;
  onCloseTrade: () => void;
  // Combat callbacks
  onCombatSelectTarget: (uid: string) => void;
  onCombatAction: (action: 'attack' | 'distract' | 'special' | 'guard' | 'retreat', itemId?: string) => void;
  onCombatVictory: () => void;
  onCombatDefeat: () => void;
  // Lockpick callbacks
  onLockpickSuccess: () => void;
  onLockpickConsume: () => void;
  onLockpickCancel: () => void;
  // Resonance callbacks
  onResonanceSuccess: () => void;
  onResonanceCancel: () => void;
  // Ending restart
  onRestartNewGame: () => void;
}

export const getItemIcon = (icon: string) => {
  const cls = 'w-5 h-5 text-[#f0c772]';
  switch (icon) {
    case 'lockpick':
    case 'key':
      return <KeyRound className={cls} />;
    case 'wrench':
      return <Wrench className={cls} />;
    case 'gear':
    case 'harpoon':
    case 'core':
      return <Cog className={cls} />;
    case 'shield':
      return <Shield className={cls} />;
    case 'artifact':
    case 'lantern':
      return <Sparkles className={cls} />;
    case 'flask':
    case 'tonic':
    case 'oxygen':
    case 'stew':
      return <FlaskConical className={cls} />;
    case 'document':
    case 'watch':
      return <ScrollText className={cls} />;
    default:
      return <Compass className={cls} />;
  }
};

export const RightActivityStage: React.FC<RightActivityStageProps> = ({
  state,
  sceneArt,
  npc,
  inspectText,
  merchantId,
  onSetActionTab,
  onSelectItem,
  onUseItem,
  onBuyItem,
  onSellItem,
  onCloseTrade,
  onCombatSelectTarget,
  onCombatAction,
  onCombatVictory,
  onCombatDefeat,
  onLockpickSuccess,
  onLockpickConsume,
  onLockpickCancel,
  onResonanceSuccess,
  onResonanceCancel,
  onRestartNewGame,
}) => {
  // 1. Tactical Combat Mode
  if (state.rightMode === 'combat' && state.activeCombat) {
    return (
      <CombatPanel
        state={state}
        combat={state.activeCombat}
        onSelectTarget={onCombatSelectTarget}
        onAction={onCombatAction}
        onVictoryContinue={onCombatVictory}
        onDefeatRecover={onCombatDefeat}
      />
    );
  }

  // 2. Lockpicking Mini-Game Mode
  if (state.rightMode === 'lockpick' && state.activeLockpick) {
    const pickItem = state.inventory.find((i) => i.id === 'lockpick_wire');
    return (
      <LockpickMiniGame
        lock={state.activeLockpick}
        mechanicsLevel={state.skills.mechanics}
        lockpickCount={pickItem?.quantity ?? 0}
        onSuccess={onLockpickSuccess}
        onConsumePick={onLockpickConsume}
        onCancel={onLockpickCancel}
      />
    );
  }

  // 3. Sonar / Medium Resonance Mini-Game Mode
  if (state.rightMode === 'resonance' && state.activeResonance) {
    return (
      <ResonanceMiniGame
        puzzle={state.activeResonance}
        mediumLevel={state.skills.medium}
        onSuccess={onResonanceSuccess}
        onCancel={onResonanceCancel}
      />
    );
  }

  // 4. Ending Epilogue Stage
  if (state.rightMode === 'ending' && state.activeEnding) {
    const ending = ENDINGS[state.activeEnding];
    return (
      <div className="flex flex-col flex-1 gap-3 animate-page-in">
        <SceneIllustration art={ending.art} className="h-[290px]" caption={ending.subtitle} />

        <div className="brass-plate rounded-lg p-4 text-[#f3e1c2] space-y-3">
          <div className="font-hand text-xl text-[#fae2a8] leading-snug">
            {ending.epilogueDiary}
          </div>
          <div className="pt-2 border-t border-[#7a5831]/50 flex flex-wrap items-center justify-between gap-2 text-xs text-[#cbb286] tabular-nums">
            <span>Дней в Гроте: {state.day}</span>
            <span>Милосердие: {state.compassion}</span>
            <span>Зов Бездны: {state.abyssAffinity}</span>
            <span>Модули Джона: {state.johnMemoryRestored}/5</span>
          </div>
          <button
            type="button"
            onClick={onRestartNewGame}
            className="w-full py-2.5 px-4 rounded bg-gradient-to-b from-[#e4b34e] to-[#b58124] text-[#1c1006] font-semibold text-sm border border-[#ffeaad] hover:brightness-110 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Начать новую экспедицию (новое зерно мира)</span>
          </button>
        </div>
      </div>
    );
  }

  // 5. Merchant Trade Mode
  if (state.rightMode === 'trade' && state.activeMerchant) {
    const shop = MERCHANT_STOCKS[state.activeMerchant];
    const sellable = state.inventory.filter((i) => i.quantity > 0 && i.price > 0 && i.category !== 'document');

    return (
      <div className="flex flex-col flex-1 gap-3 animate-page-in">
        <SceneIllustration art={sceneArt} className="h-[155px]" caption={shop.name} />

        <div className="brass-plate rounded-lg p-3.5 flex-1 flex flex-col text-[#f3e2c4]">
          <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-[#7a5730]/50">
            <div>
              <h3 className="font-display text-lg font-bold text-[#f7d894] leading-none">
                {shop.name}
              </h3>
              <p className="text-xs text-[#cbb38a] mt-1">{shop.greeting}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                sfx.playClick();
                onCloseTrade();
              }}
              className="px-3 py-1.5 rounded bg-[#2c2017] border border-[#966d39] text-xs text-[#f2d69f] hover:border-[#f0c060] cursor-pointer whitespace-nowrap"
            >
              Закрыть
            </button>
          </div>

          <div className="flex-1 overflow-y-auto brass-scroll space-y-2 pr-1">
            <div className="text-[11px] font-semibold text-[#c9a973]">Товары на прилавке</div>
            {shop.items.map((itemId) => {
              const item = ITEM_CATALOG[itemId];
              if (!item) return null;
              const alreadyOwnedUnique =
                (item.category === 'part' || item.id === 'silver_watch') &&
                (state.inventory.some((i) => i.id === item.id) ||
                  Object.values(state.droidSlots).includes(item.id) ||
                  (item.id === 'silver_watch' && state.flags.silver_watch_returned));
              const canAfford = state.coins >= item.price && !alreadyOwnedUnique;

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 p-2 rounded bg-[#18120d] border border-[#5f4425]"
                >
                  <div className="flex items-start gap-2.5 min-w-0">
                    <div className="p-1.5 rounded bg-[#271d14] border border-[#7c5930] shrink-0">
                      {getItemIcon(item.icon)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#f8e4be] truncate">{item.name}</div>
                      <div className="text-[11px] text-[#bfa77e] leading-snug line-clamp-2">
                        {item.description}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={!canAfford}
                    onClick={() => onBuyItem(item.id)}
                    className="px-2.5 py-1.5 rounded bg-gradient-to-b from-[#9c6a2b] to-[#6d471a] border border-[#e3b058] text-xs font-semibold text-[#fff2d2] hover:brightness-110 disabled:opacity-40 cursor-pointer whitespace-nowrap tabular-nums shrink-0"
                  >
                    {alreadyOwnedUnique ? 'Куплено' : `${item.price} 🪙`}
                  </button>
                </div>
              );
            })}

            {sellable.length > 0 && (
              <>
                <div className="pt-2 text-[11px] font-semibold text-[#c9a973]">
                  Продать из рюкзака (за полцены)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {sellable.slice(0, 6).map((item) => {
                    const sellVal = Math.max(4, Math.floor(item.price * 0.5));
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSellItem(item.id)}
                        className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-[#16100c] border border-[#563e22] hover:border-[#c8964b] text-left text-[11px] text-[#e8d3ad] cursor-pointer"
                      >
                        <span className="truncate">
                          {item.name} ×{item.quantity}
                        </span>
                        <span className="text-[#f2c968] tabular-nums shrink-0">+{sellVal} 🪙</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 6. Standard Narrative + NPC + Quick Action / Inventory Strip (matches Narrative_mode_9cb883bd.webp!)
  const visibleItems = state.inventory.filter((i) => i.quantity > 0);
  const selectedItem: InventoryItem | undefined =
    visibleItems.find((i) => i.id === state.selectedItemId) || visibleItems[0];

  return (
    <div className="flex flex-col flex-1 gap-2.5 animate-page-in">
      {/* Main Contextual Scene Illustration */}
      <SceneIllustration art={sceneArt} className="h-[255px] sm:h-[285px]" />

      {/* NPC Dialogue Parchment Plaque OR Inspect Plaque */}
      <div className="brass-plate rounded-lg p-3 flex items-start gap-3">
        {state.rightActionTab === 'inspect' ? (
          <>
            <PortraitFrame id="jill" size="md" active />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#f3ca72] mb-0.5">
                Осмотр локации (глазами Джил)
              </div>
              <p className="text-xs sm:text-[13px] leading-relaxed text-[#efe0c2]">
                {inspectText ||
                  'Джил внимательно осматривает трубы, заклёпки и тёмные углы. В этом месте явно прячется что-то любопытное.'}
              </p>
            </div>
          </>
        ) : state.rightActionTab === 'use' && selectedItem ? (
          <>
            <div className="w-14 h-14 rounded-md border-2 border-[#c9984c] bg-[#221912] flex items-center justify-center shrink-0">
              {getItemIcon(selectedItem.icon)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[#f3ca72] truncate">
                  {selectedItem.name}
                </span>
                {selectedItem.effect && (
                  <button
                    type="button"
                    onClick={() => onUseItem(selectedItem.id)}
                    className="px-2.5 py-1 rounded bg-[#a7732d] hover:bg-[#c28837] text-[#fff4d8] text-[11px] font-semibold cursor-pointer whitespace-nowrap"
                  >
                    Применить
                  </button>
                )}
              </div>
              <p className="text-xs text-[#e7d4b3] mt-0.5 leading-snug">{selectedItem.description}</p>
              <p className="font-hand text-sm text-[#f7d897] mt-1 leading-tight">
                «{selectedItem.jillNote}»
              </p>
            </div>
          </>
        ) : npc ? (
          <>
            <PortraitFrame id={npc.portrait} size="md" active />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-[#f3ca72] mb-0.5">{npc.speaker}</div>
              <p className="text-xs sm:text-[13.5px] leading-relaxed text-[#f2e2c6]">
                «{npc.text}»
              </p>
            </div>
          </>
        ) : (
          <div className="text-xs text-[#d6be96]">Выберите действие на левой странице книги.</div>
        )}
      </div>

      {/* Bottom Brass Action Strip + Quick Inventory Bar */}
      <div className="brass-plate rounded-lg p-2.5 mt-auto">
        <div className="grid grid-cols-4 gap-1.5 mb-2.5">
          <ActionModeBtn
            icon={<MessageSquare className="w-3.5 h-3.5" />}
            label="Разговор"
            active={state.rightActionTab === 'talk'}
            onClick={() => {
              sfx.playClick();
              onSetActionTab('talk');
            }}
          />
          <ActionModeBtn
            icon={<Coins className="w-3.5 h-3.5" />}
            label="Торговля"
            disabled={!merchantId}
            active={false}
            onClick={() => {
              sfx.playClick();
              onSetActionTab('trade');
            }}
          />
          <ActionModeBtn
            icon={<Search className="w-3.5 h-3.5" />}
            label="Осмотр"
            active={state.rightActionTab === 'inspect'}
            onClick={() => {
              sfx.playClick();
              onSetActionTab('inspect');
            }}
          />
          <ActionModeBtn
            icon={<Hand className="w-3.5 h-3.5" />}
            label="Предмет"
            active={state.rightActionTab === 'use'}
            onClick={() => {
              sfx.playClick();
              onSetActionTab('use');
            }}
          />
        </div>

        {/* 7-Slot Quick Inventory Bar */}
        <div className="grid grid-cols-7 gap-1.5">
          {Array.from({ length: 7 }, (_, idx) => {
            const item = visibleItems[idx];
            const isSelected = item && selectedItem?.id === item.id && state.rightActionTab === 'use';
            return (
              <button
                key={idx}
                type="button"
                disabled={!item}
                title={item ? `${item.name}: ${item.description}` : 'Пустой слот'}
                onClick={() => {
                  if (!item) return;
                  sfx.playClick();
                  onSelectItem(item.id);
                  onSetActionTab('use');
                }}
                className={`relative h-12 rounded border flex items-center justify-center transition-all cursor-pointer disabled:cursor-default ${
                  isSelected
                    ? 'bg-[#362617] border-[#f4c668] shadow-[0_0_10px_rgba(244,198,104,0.45)]'
                    : item
                    ? 'bg-[#1b140e] border-[#6e4f2c] hover:border-[#c9974c]'
                    : 'bg-[#120d09]/70 border-[#42301b]/60'
                }`}
              >
                {item && (
                  <>
                    {getItemIcon(item.icon)}
                    {item.quantity > 1 && (
                      <span className="absolute bottom-0.5 right-1 text-[10px] font-bold text-[#f7dca0] tabular-nums">
                        {item.quantity}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const ActionModeBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}> = ({ icon, label, active, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`py-1.5 px-2 rounded text-xs font-medium flex items-center justify-center gap-1.5 border transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed whitespace-nowrap ${
      active
        ? 'bg-gradient-to-b from-[#9d6c2c] to-[#6c4719] border-[#f2c365] text-[#fff4d8]'
        : 'bg-[#211812] border-[#6b4d2a] text-[#dfc9a2] hover:border-[#c8964c]'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);
