import React from 'react';
import {
  MessageSquare,
  Cog,
  Coins,
  Footprints,
  Swords,
  Eye,
  Compass,
  Lock,
  Scale,
  AlertTriangle,
} from 'lucide-react';
import { GameState, SkillKey, StoryChoice } from '../types/game';
import { InkVignette } from './CroppedArt';
import { sfx } from '../utils/sound';

const SKILL_NAMES: Record<SkillKey, string> = {
  mechanics: 'Механика',
  stealth: 'Скрытность',
  combat: 'Бой',
  medium: 'Медиум',
};

interface LeftNarrativePageProps {
  chapterLabel: string;
  title: string;
  paragraphs: string[];
  choices: StoryChoice[];
  state: GameState;
  vignette?: 'keys' | 'cylinder' | 'mug' | 'octopus' | 'submarine' | 'compass';
  expeditionHeader?: {
    sectorName: string;
    depthMeters: number;
    oxygen: number;
    maxOxygen: number;
    hull: number;
    maxHull: number;
    stageLabel: string;
  };
  onChoose: (choice: StoryChoice) => void;
}

export const LeftNarrativePage: React.FC<LeftNarrativePageProps> = ({
  chapterLabel,
  title,
  paragraphs,
  choices,
  state,
  vignette = 'compass',
  expeditionHeader,
  onChoose,
}) => {
  const getChoiceIcon = (icon?: StoryChoice['icon']) => {
    const cls = 'w-4 h-4 shrink-0 text-[#613c1a]';
    switch (icon) {
      case 'talk':
        return <MessageSquare className={cls} />;
      case 'gear':
        return <Cog className={cls} />;
      case 'coin':
        return <Coins className={cls} />;
      case 'stealth':
        return <Footprints className={cls} />;
      case 'combat':
        return <Swords className={cls} />;
      case 'medium':
        return <Eye className={cls} />;
      case 'lock':
        return <Lock className={cls} />;
      case 'moral':
        return <Scale className={cls} />;
      default:
        return <Compass className={cls} />;
    }
  };

  // Compute effective stealth bonus from hired crew + John servo
  const effectiveSkill = (skill: SkillKey) => {
    let val = state.skills[skill];
    if (skill === 'stealth') {
      const salli = state.crew.find((c) => c.id === 'salli' && c.hired);
      if (salli) val += 1;
      if (state.droidSlots.servo === 'part_brass_servo') val += 1;
    }
    return val;
  };

  const visibleChoices = choices.filter((ch) => {
    if (ch.hideIfFlag && state.flags[ch.hideIfFlag]) return false;
    if (ch.reqFlag && !state.flags[ch.reqFlag]) return false;
    return true;
  });

  return (
    <div className="animate-page-in flex flex-col flex-1 justify-between">
      <div>
        {/* Ornate Chapter Heading */}
        <header className="text-center mb-4 pb-3 border-b border-[#9a7244]/35">
          <div className="text-xs font-medium tracking-wider text-[#6f4a24] mb-0.5">
            ❖ {chapterLabel} ❖
          </div>
          <h1
            className="font-display text-3xl sm:text-4xl font-bold text-[#2b180b] leading-tight"
            style={{ textWrap: 'balance' }}
          >
            {title}
          </h1>
        </header>

        {/* Expedition Survival Strip (when diving aboard Flint's submarine) */}
        {expeditionHeader && (
          <div className="mb-4 px-3 py-2 rounded bg-[#d9bf91]/70 border border-[#8e6739]/60 text-xs text-[#341f0e] flex flex-wrap items-center justify-between gap-2 tabular-nums">
            <span className="font-semibold">
              {expeditionHeader.sectorName} · {expeditionHeader.depthMeters} м
            </span>
            <span>
              Кислород: <strong>{expeditionHeader.oxygen}/{expeditionHeader.maxOxygen}</strong> · Корпус:{' '}
              <strong>{expeditionHeader.hull}/{expeditionHeader.maxHull}</strong> · {expeditionHeader.stageLabel}
            </span>
          </div>
        )}

        {/* Contextual Feedback Banner */}
        {state.feedbackBanner && (
          <div
            className={`mb-4 px-3.5 py-2 rounded text-xs sm:text-sm border ${
              state.feedbackBanner.tone === 'good'
                ? 'bg-[#dfead3]/85 border-[#5d7a47] text-[#243818]'
                : state.feedbackBanner.tone === 'warn'
                ? 'bg-[#f4d7c4]/85 border-[#a8472e] text-[#571e10]'
                : state.feedbackBanner.tone === 'abyss'
                ? 'bg-[#cfe6e4]/85 border-[#2d7070] text-[#11373a]'
                : 'bg-[#e6d1a8]/80 border-[#8f6a3c] text-[#35200e]'
            }`}
          >
            {state.feedbackBanner.text}
          </div>
        )}

        {/* Literary Book Prose */}
        <div className="space-y-3 text-[15px] sm:text-[15.5px] leading-[1.62] text-[#29190d] mb-6">
          {paragraphs.map((p, index) => (
            <p key={index} className={index === 0 ? 'book-dropcap' : 'indent-5'}>
              {p}
            </p>
          ))}
        </div>
      </div>

      {/* Interactive Parchment Choice Ribbons */}
      <div className="space-y-2 mt-auto pt-2">
        {visibleChoices.map((choice) => {
          let blockedReason: string | null = null;

          if (choice.reqSkill) {
            const cur = effectiveSkill(choice.reqSkill.skill);
            if (cur < choice.reqSkill.level) {
              blockedReason = `Нужно: ${SKILL_NAMES[choice.reqSkill.skill]} ${choice.reqSkill.level} (у вас ${cur})`;
            }
          }
          if (!blockedReason && choice.reqItem) {
            const hasItem = state.inventory.some((i) => i.id === choice.reqItem && i.quantity > 0);
            if (!hasItem) {
              blockedReason = 'Нет нужного предмета в инвентаре';
            }
          }
          if (!blockedReason && choice.costCoins && state.coins < choice.costCoins) {
            blockedReason = `Нужно ${choice.costCoins} дублонов`;
          }
          if (!blockedReason && choice.costEnergy && state.energy < choice.costEnergy) {
            blockedReason = `Нужно ${choice.costEnergy} Энергии (отдохните на причале или перекусите)`;
          }

          const disabled = Boolean(blockedReason);

          return (
            <button
              key={choice.id}
              disabled={disabled}
              onClick={() => {
                sfx.playClick();
                onChoose(choice);
              }}
              className={`w-full text-left px-3.5 py-2.5 rounded-md flex items-center justify-between gap-3 cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#7a4b17] ${
                choice.primary ? 'parchment-choice-primary' : 'parchment-choice'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <span className="mt-0.5">{getChoiceIcon(choice.icon)}</span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#2a170a] leading-snug">
                    {choice.label}
                  </div>
                  {blockedReason && (
                    <div className="text-[11px] text-[#8d2c1c] flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>{blockedReason}</span>
                    </div>
                  )}
                </div>
              </div>

              {choice.styleTag && !blockedReason && (
                <span className="text-[11px] font-medium text-[#6c4720] whitespace-nowrap shrink-0">
                  {choice.styleTag}
                </span>
              )}
            </button>
          );
        })}

        <InkVignette kind={vignette} />
      </div>
    </div>
  );
};
