import React, { useState } from 'react';
import {
  Swords,
  Shield,
  Sparkles,
  Backpack,
  LogOut,
  Eye,
  Crosshair,
  Hourglass,
  Flame,
} from 'lucide-react';
import { CombatEnemy, CombatState, GameState } from '../types/game';
import { PortraitFrame, SceneIllustration } from './CroppedArt';
import { sfx } from '../utils/sound';

interface CombatPanelProps {
  state: GameState;
  combat: CombatState;
  onSelectTarget: (uid: string) => void;
  onAction: (action: 'attack' | 'distract' | 'special' | 'guard' | 'retreat', itemId?: string) => void;
  onVictoryContinue: () => void;
  onDefeatRecover: () => void;
}

const INTENT_LABELS: Record<CombatEnemy['currentIntent'], { text: string; tone: string }> = {
  strike: { text: 'Удар', tone: 'text-[#f29b7e]' },
  heavy: { text: 'Мощный удар', tone: 'text-[#ff6a55]' },
  guard: { text: 'Защита', tone: 'text-[#8ec5e8]' },
  whisper: { text: 'Шёпот Бездны', tone: 'text-[#6ff0d1]' },
  debuff: { text: 'Подлость', tone: 'text-[#e8c668]' },
};

export const CombatPanel: React.FC<CombatPanelProps> = ({
  state,
  combat,
  onSelectTarget,
  onAction,
  onVictoryContinue,
  onDefeatRecover,
}) => {
  const [showItemTray, setShowItemTray] = useState(false);

  const usableItems = state.inventory.filter(
    (item) => item.quantity > 0 && item.category === 'consumable'
  );

  const isPlayerTurn = combat.phase === 'jill_turn' || combat.phase === 'john_turn';
  const activeActorName = combat.phase === 'jill_turn' ? 'Джил' : 'Маленький Джон';

  const hiredCrew = state.crew.filter((c) => c.hired);

  return (
    <div className="flex flex-col flex-1 gap-2.5 animate-page-in">
      {/* Top Illustrated Combat Stage with Live Enemy Health Bars */}
      <div className="relative h-[225px] sm:h-[245px] rounded-lg overflow-hidden border-2 border-[#8c6533] bg-[#120d0a]">
        <SceneIllustration art={combat.sceneArt} className="h-full w-full border-0 rounded-none" />

        {/* Subtle Top Combat Header Overlay */}
        <div className="absolute top-0 inset-x-0 px-3 py-1.5 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-xs text-[#f4dfba]">
          <span className="font-semibold">{combat.title}</span>
          <span className="tabular-nums text-[#dfbe87]">Раунд {combat.turn}</span>
        </div>

        {/* Floating Enemy Target Cards on Right Side of Arena */}
        <div className="absolute bottom-2 inset-x-2 flex flex-wrap items-end justify-end gap-2">
          {combat.enemies.map((enemy) => {
            const dead = enemy.hp <= 0;
            const selected = combat.selectedEnemyUid === enemy.uid && !dead;
            const intent = INTENT_LABELS[enemy.currentIntent];
            const hitAnim = combat.lastHitTarget === enemy.uid;

            return (
              <button
                key={enemy.uid}
                type="button"
                disabled={dead}
                onClick={() => {
                  sfx.playClick();
                  onSelectTarget(enemy.uid);
                }}
                className={`relative text-left p-2 rounded-md border transition-all backdrop-blur-xs cursor-pointer disabled:opacity-35 disabled:cursor-default ${
                  hitAnim ? 'animate-hit' : ''
                } ${
                  selected
                    ? 'bg-[#2a1712]/90 border-[#f4be58] shadow-[0_0_12px_rgba(244,190,88,0.45)]'
                    : 'bg-[#17120e]/85 border-[#7a5832] hover:border-[#c9974c]'
                }`}
              >
                {selected && (
                  <Crosshair className="w-3.5 h-3.5 text-[#ff6b4d] absolute -top-1.5 -right-1.5 bg-[#190e0a] rounded-full" />
                )}
                <div className="flex items-center gap-2">
                  <PortraitFrame id={enemy.portrait} size="sm" danger={!dead} />
                  <div className="min-w-[105px]">
                    <div className="text-[11px] font-semibold text-[#f7e5c6] truncate max-w-[125px]">
                      {enemy.name}
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded bg-[#2d1814] overflow-hidden">
                      <div
                        className="h-full bg-[#d94635] transition-all duration-200"
                        style={{ width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%` }}
                      />
                    </div>
                    <div className="mt-0.5 flex items-center justify-between text-[10px] tabular-nums">
                      <span className="text-[#e7cfa8]">
                        {enemy.hp}/{enemy.maxHp} HP
                        {enemy.block > 0 ? ` (+${enemy.block} щит)` : ''}
                      </span>
                      {!dead && (
                        <span className={enemy.stunned ? 'text-[#f6d365]' : intent.tone}>
                          {enemy.stunned ? 'Оглушён' : intent.text}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Party Status Strip (Jill + Little John + Hired Crew Support) */}
      <div className="brass-plate rounded-lg p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Jill Card */}
        <div
          className={`flex items-center gap-2.5 p-2 rounded border transition-colors ${
            combat.phase === 'jill_turn'
              ? 'bg-[#2e2115] border-[#f4c668]'
              : 'bg-[#17120e] border-[#594126]'
          }`}
        >
          <PortraitFrame id="jill" size="md" active={combat.phase === 'jill_turn'} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#f7e5c6]">Джил</span>
              <span className="text-[11px] text-[#f0c76e] tabular-nums">
                {combat.jillBlock > 0 ? `Щит ${combat.jillBlock} · ` : ''}
                {state.jillHp}/{state.jillMaxHp} HP
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded bg-[#2c1a14] overflow-hidden">
              <div
                className="h-full bg-[#d94d42]"
                style={{ width: `${(state.jillHp / state.jillMaxHp) * 100}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-[#c7ae82]">
              <span>Энергия: {state.energy}/{state.maxEnergy}</span>
              <span>Хитрость: {combat.stealthCharge}/2</span>
            </div>
          </div>
        </div>

        {/* Little John Card */}
        <div
          className={`flex items-center gap-2.5 p-2 rounded border transition-colors ${
            combat.phase === 'john_turn'
              ? 'bg-[#2e2115] border-[#f4c668]'
              : 'bg-[#17120e] border-[#594126]'
          }`}
        >
          <PortraitFrame id="john" size="md" active={combat.phase === 'john_turn'} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#f7e5c6]">Маленький Джон</span>
              <span className="text-[11px] text-[#f0c76e] tabular-nums">
                {combat.johnBlock > 0 ? `Щит ${combat.johnBlock} · ` : ''}
                {state.johnHp}/{state.johnMaxHp} HP
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded bg-[#2c1a14] overflow-hidden">
              <div
                className="h-full bg-[#e3923b]"
                style={{ width: `${(state.johnHp / state.johnMaxHp) * 100}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] text-[#c7ae82]">
              <span>Модули: {state.johnMemoryRestored}/5</span>
              <span>
                {hiredCrew.length > 0 ? `Отряд: +${hiredCrew.length}` : 'Боевой дроид J-17'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Live Combat Log */}
      <div className="brass-plate rounded-lg px-3 py-2 text-xs text-[#e3cea8] h-[74px] overflow-y-auto brass-scroll space-y-1">
        {combat.combatLog.slice(-4).map((line, i) => (
          <div key={i} className={i === combat.combatLog.slice(-4).length - 1 ? 'text-[#fbe2a8] font-medium' : 'opacity-80'}>
            {line}
          </div>
        ))}
      </div>

      {/* Bottom Action Bar / Victory / Defeat */}
      {combat.phase === 'victory' ? (
        <div className="brass-plate rounded-lg p-3.5 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[#f8d77f]">Победа в схватке!</div>
            <div className="text-xs text-[#d6be96] tabular-nums">
              Добыча: +{combat.rewardCoins} дублонов · +{combat.rewardScrap} деталей · +{combat.rewardXp} опыта
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sfx.playCoin();
              onVictoryContinue();
            }}
            className="px-4 py-2 rounded bg-gradient-to-b from-[#e4b34e] to-[#b58124] text-[#1c1006] font-semibold text-xs sm:text-sm border border-[#ffeaad] hover:brightness-110 cursor-pointer whitespace-nowrap"
          >
            Забрать добычу
          </button>
        </div>
      ) : combat.phase === 'defeat' ? (
        <div className="brass-plate rounded-lg p-3.5 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-[#f07662]">Команда тяжело ранена!</div>
            <div className="text-xs text-[#d6be96]">
              Маленький Джон вынес Джил из-под огня обратно в бар «Адмирал» к Сильверу.
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sfx.playPageTurn();
              onDefeatRecover();
            }}
            className="px-4 py-2 rounded bg-[#8a3222] text-[#fde3d7] font-semibold text-xs sm:text-sm border border-[#d66c56] hover:brightness-110 cursor-pointer whitespace-nowrap"
          >
            Очнуться в «Адмирале»
          </button>
        </div>
      ) : (
        <div className="brass-plate rounded-lg p-3">
          <div className="flex items-center justify-between text-xs text-[#e2c693] mb-2">
            <span className="flex items-center gap-1.5 font-semibold">
              <Hourglass className="w-3.5 h-3.5 text-[#f0be5b]" />
              {isPlayerTurn ? `Ход: ${activeActorName}` : 'Ход противников...'}
            </span>
            <span className="text-[11px] text-[#b89f76]">
              {combat.phase === 'jill_turn'
                ? 'Выбери тактику Джил'
                : combat.phase === 'john_turn'
                ? 'Выбери приём Маленького Джона'
                : 'Держите оборону!'}
            </span>
          </div>

          {/* Inline Consumable Item Tray */}
          {showItemTray && (
            <div className="mb-2.5 p-2 rounded bg-[#100c09] border border-[#6b4f2b] flex flex-wrap gap-1.5">
              {usableItems.length === 0 ? (
                <span className="text-xs text-[#a58c64]">Нет расходников для боя.</span>
              ) : (
                usableItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!isPlayerTurn}
                    onClick={() => {
                      setShowItemTray(false);
                      onAction('special', item.id);
                    }}
                    className="px-2.5 py-1.5 rounded bg-[#261c14] border border-[#8e6839] hover:border-[#f0c060] text-[11px] text-[#f5e3c1] cursor-pointer"
                  >
                    {item.name} ({item.quantity})
                  </button>
                ))
              )}
            </div>
          )}

          {/* 5 Signature Brass Combat Buttons */}
          <div className="grid grid-cols-5 gap-1.5">
            <CombatBtn
              icon={<Swords className="w-4 h-4" />}
              label={combat.phase === 'jill_turn' ? 'Удар' : 'Крушить'}
              primary
              disabled={!isPlayerTurn}
              onClick={() => onAction('attack')}
            />
            <CombatBtn
              icon={combat.phase === 'jill_turn' ? <Eye className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
              label={combat.phase === 'jill_turn' ? 'Отвлечь' : 'Импульс'}
              disabled={!isPlayerTurn}
              onClick={() => onAction('distract')}
            />
            <CombatBtn
              icon={<Sparkles className="w-4 h-4" />}
              label={combat.phase === 'jill_turn' ? 'Медиум' : 'Модуль'}
              disabled={!isPlayerTurn}
              onClick={() => onAction('special')}
            />
            <CombatBtn
              icon={<Backpack className="w-4 h-4" />}
              label="Предмет"
              active={showItemTray}
              disabled={!isPlayerTurn}
              onClick={() => {
                sfx.playClick();
                setShowItemTray((v) => !v);
              }}
            />
            <CombatBtn
              icon={combat.canRetreat && combat.stealthCharge >= 1 ? <LogOut className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              label={combat.canRetreat && combat.stealthCharge >= 1 ? 'Уйти' : 'Защита'}
              disabled={!isPlayerTurn}
              onClick={() =>
                onAction(combat.canRetreat && combat.stealthCharge >= 1 ? 'retreat' : 'guard')
              }
            />
          </div>
        </div>
      )}
    </div>
  );
};

const CombatBtn: React.FC<{
  icon: React.ReactNode;
  label: string;
  primary?: boolean;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}> = ({ icon, label, primary, active, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={`py-2.5 px-1.5 rounded flex flex-col items-center justify-center gap-1 text-[11px] font-semibold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
      primary
        ? 'bg-gradient-to-b from-[#9c6928] to-[#684316] border border-[#f2c15d] text-[#fff3d2] hover:brightness-110'
        : active
        ? 'bg-[#362718] border border-[#f2c15d] text-[#fbe09e]'
        : 'bg-[#211812] border border-[#74542e] text-[#e5cfa6] hover:border-[#d9a64e] hover:bg-[#2a1f16]'
    }`}
  >
    {icon}
    <span className="whitespace-nowrap">{label}</span>
  </button>
);
