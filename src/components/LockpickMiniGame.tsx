import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, KeyRound, ShieldAlert, Wrench } from 'lucide-react';
import { LockpickState } from '../types/game';
import { sfx } from '../utils/sound';

interface LockpickMiniGameProps {
  lock: LockpickState;
  mechanicsLevel: number;
  lockpickCount: number;
  onSuccess: () => void;
  onConsumePick: () => void;
  onCancel: () => void;
}

interface PinData {
  id: number;
  target: number; // 28..76 (% lift height)
  height: number; // current lift 0..100
  locked: boolean;
}

export const LockpickMiniGame: React.FC<LockpickMiniGameProps> = ({
  lock,
  mechanicsLevel,
  lockpickCount,
  onSuccess,
  onConsumePick,
  onCancel,
}) => {
  // Deterministic target positions per lockId
  const initialPins = useMemo<PinData[]>(() => {
    let hash = 0;
    for (let i = 0; i < lock.lockId.length; i++) {
      hash = (hash * 31 + lock.lockId.charCodeAt(i)) % 997;
    }
    return Array.from({ length: lock.pins }, (_, idx) => ({
      id: idx,
      target: 32 + ((hash + idx * 29 + lock.difficulty * 13) % 44),
      height: 0,
      locked: false,
    }));
  }, [lock.lockId, lock.pins, lock.difficulty]);

  const [pins, setPins] = useState<PinData[]>(initialPins);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lifting, setLifting] = useState(false);
  const [tension, setTension] = useState(0); // 0..100
  const [statusMsg, setStatusMsg] = useState(
    'Выбери штифт и удерживай «Поднять штифт» (или Пробел). Отпусти, когда штифт попадёт в золотую зону щелчка!'
  );
  const [completed, setCompleted] = useState(false);

  // Mechanics skill widens sweet spot tolerance!
  const tolerance = Math.max(7, 13 - lock.difficulty * 1.5 + mechanicsLevel * 2.5);
  const liftingRef = useRef(false);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;
  liftingRef.current = lifting;

  // Animation loop for pin lifting and spring return
  useEffect(() => {
    if (completed) return;
    let rafId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      setPins((prev) =>
        prev.map((pin, idx) => {
          if (pin.locked) return pin;
          if (idx === activeIndexRef.current && liftingRef.current) {
            const speed = 48 + lock.difficulty * 6;
            const nextH = Math.min(96, pin.height + speed * dt);
            return { ...pin, height: nextH };
          } else if (pin.height > 0) {
            const drop = 110 * dt;
            return { ...pin, height: Math.max(0, pin.height - drop) };
          }
          return pin;
        })
      );

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [completed, lock.difficulty]);

  // Monitor over-lifting tension while holding lift
  useEffect(() => {
    if (!lifting || completed) return;
    const pin = pins[activeIndex];
    if (!pin || pin.locked) return;

    if (pin.height > pin.target + tolerance + 4) {
      setTension((t) => {
        const next = t + 8;
        if (next >= 100) {
          // Snap pick!
          sfx.playPinSnap();
          setLifting(false);
          onConsumePick();
          setStatusMsg('Хруст! Слишком сильный нажим — отмычка погнулась и сломалась!');
          setPins((prev) => prev.map((p, i) => (i === activeIndex ? { ...p, height: 0 } : p)));
          return 0;
        }
        return next;
      });
    } else if (Math.abs(pin.height - pin.target) <= tolerance) {
      setTension((t) => Math.max(0, t - 2));
    }
  }, [pins, lifting, activeIndex, tolerance, completed, onConsumePick]);

  // Attempt to set pin when releasing lift
  const releaseLift = () => {
    if (!lifting || completed) return;
    setLifting(false);

    const pin = pins[activeIndex];
    if (!pin || pin.locked) return;

    const diff = Math.abs(pin.height - pin.target);
    if (diff <= tolerance) {
      sfx.playPinClick();
      const updated = pins.map((p, idx) =>
        idx === activeIndex ? { ...p, height: p.target, locked: true } : p
      );
      setPins(updated);
      setTension(0);

      const allLocked = updated.every((p) => p.locked);
      if (allLocked) {
        setCompleted(true);
        sfx.playLockOpen();
        setStatusMsg('Щёлк! Все штифты выстроились в ряд — замок открыт!');
        setTimeout(() => {
          onSuccess();
        }, 700);
      } else {
        setStatusMsg(`Штифт #${activeIndex + 1} зафиксирован со звонким щелчком!`);
        const nextUnlocked = updated.findIndex((p) => !p.locked);
        if (nextUnlocked !== -1) setActiveIndex(nextUnlocked);
      }
    } else if (pin.height > 12) {
      sfx.playClick();
      setStatusMsg(
        pin.height < pin.target
          ? 'Слишком рано — штифт не дошёл до линии разрыва. Подними чуть выше.'
          : 'Перебор! Отпускай чуть раньше, пока пружина не заклинила.'
      );
    }
  };

  // Keyboard support (A/D or Arrows, Space/W to lift, Escape to cancel)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (completed) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'ф' || e.key === 'Ф') {
        setActiveIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'в' || e.key === 'В') {
        setActiveIndex((i) => Math.min(pins.length - 1, i + 1));
      } else if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (lockpickCount > 0 && !pins[activeIndex]?.locked) {
          setLifting(true);
        }
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        releaseLift();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  });

  const activePin = pins[activeIndex];
  const inSweetSpot =
    activePin && !activePin.locked && Math.abs(activePin.height - activePin.target) <= tolerance;
  const overLifted =
    activePin && !activePin.locked && activePin.height > activePin.target + tolerance + 2;

  return (
    <div className="flex flex-col flex-1 gap-3 animate-page-in">
      {/* Visual Brass Lock Cylinder Chamber */}
      <div className="brass-plate relative rounded-lg p-4 overflow-hidden">
        <div className="flex items-center justify-between text-xs text-[#dfc18f] mb-3">
          <div className="flex items-center gap-2 font-semibold">
            <KeyRound className="w-4 h-4 text-[#f0be5b]" />
            <span>{lock.title}</span>
          </div>
          <div className="tabular-nums text-[#c4a678]">
            Отмычек: <strong className={lockpickCount > 0 ? 'text-[#f8d37a]' : 'text-[#e8624d]'}>{lockpickCount}</strong>
            <span className="mx-1.5">·</span>
            Механика: <strong className="text-[#f8d37a]">{mechanicsLevel}</strong>
          </div>
        </div>

        {/* Interactive Mechanical Cutaway */}
        <div className="relative h-[245px] rounded-md border-2 border-[#7b572d] bg-gradient-to-b from-[#231913] via-[#17110d] to-[#0e0a07] overflow-hidden select-none">
          {/* Brass housing anchor engraving */}
          <div className="pointer-events-none absolute left-3 top-3 opacity-35 text-[#c89649]">
            <svg viewBox="0 0 40 40" className="w-9 h-9" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="20" cy="8" r="3" />
              <line x1="20" y1="11" x2="20" y2="33" />
              <line x1="12" y1="18" x2="28" y2="18" />
              <path d="M10 26 Q20 38 30 26" />
            </svg>
          </div>

          {/* Horizontal Shear Line Indicator */}
          <div
            className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-[#d9a44b]/45"
            style={{ top: '42%' }}
          >
            <span className="absolute right-2 -top-4 text-[10px] text-[#c7a05d]/70">
              Линия замка
            </span>
          </div>

          {/* Pins Grid */}
          <div className="relative z-10 h-[182px] px-10 pt-3 flex items-end justify-around gap-3">
            {pins.map((pin, idx) => {
              const isSelected = idx === activeIndex;
              const sweet = !pin.locked && Math.abs(pin.height - pin.target) <= tolerance;
              const tooHigh = !pin.locked && pin.height > pin.target + tolerance + 2;
              const liftPx = (pin.height / 100) * 68;

              return (
                <button
                  key={pin.id}
                  type="button"
                  onClick={() => {
                    if (!completed) {
                      sfx.playClick();
                      setActiveIndex(idx);
                    }
                  }}
                  className={`relative w-14 h-full rounded-t border transition-colors flex flex-col items-center justify-end pb-2 cursor-pointer ${
                    isSelected
                      ? 'border-[#f4c668] bg-[#2f2218]/90'
                      : 'border-[#5a4024] bg-[#1b140f]/75 hover:border-[#8e6638]'
                  }`}
                >
                  {/* Target Sweet-Spot Glow Hint (subtle visual tactile cue when lifting near target) */}
                  {mechanicsLevel >= 2 && !pin.locked && (
                    <div
                      className="pointer-events-none absolute left-1 right-1 h-3 rounded bg-[#f5c85b]/15 border border-[#f5c85b]/30"
                      style={{ bottom: `${28 + (pin.target / 100) * 68}px` }}
                    />
                  )}

                  {/* Coiled Brass Spring */}
                  <div
                    className="w-6 flex-1 flex flex-col justify-between py-1 opacity-75"
                    style={{ maxHeight: `${Math.max(18, 72 - liftPx * 0.7)}px` }}
                  >
                    {[0, 1, 2, 3, 4].map((s) => (
                      <div key={s} className="h-[2px] w-full rounded bg-[#a9814b]" />
                    ))}
                  </div>

                  {/* Upper Driver Pin + Lower Key Pin */}
                  <div
                    className="w-8 flex flex-col items-center transition-transform duration-75"
                    style={{ transform: `translateY(-${liftPx}px)` }}
                  >
                    <div
                      className={`w-7 h-10 rounded-t-sm border ${
                        pin.locked
                          ? 'bg-gradient-to-r from-[#d4a345] via-[#fae097] to-[#b5832c] border-[#fff0be]'
                          : sweet
                          ? 'bg-gradient-to-r from-[#d99d36] via-[#ffe28a] to-[#b87b22] border-[#ffeba8] shadow-[0_0_12px_rgba(255,215,102,0.75)]'
                          : tooHigh
                          ? 'bg-gradient-to-r from-[#9e3a28] via-[#d95d46] to-[#7a2518] border-[#ff927d]'
                          : 'bg-gradient-to-r from-[#8f6734] via-[#d2a45a] to-[#704e23] border-[#b48948]'
                      }`}
                    />
                    <div className="w-7 h-7 rounded-b-md bg-gradient-to-r from-[#565f68] via-[#9aa4ad] to-[#424950] border border-[#2c3136]" />
                  </div>

                  {/* Pin Index & State */}
                  <span className="mt-1 text-[10px] font-semibold text-[#d9bc8c] tabular-nums">
                    {pin.locked ? '✓' : `#${idx + 1}`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Movable Steel Lockpick Blade at Bottom */}
          <div className="relative h-[58px] bg-[#110c09] border-t border-[#5a4024] flex items-center px-4">
            <div
              className="h-2.5 rounded-r-full bg-gradient-to-r from-[#59422a] via-[#9aa3ab] to-[#d5dce3] border border-[#2d3338] transition-all duration-150 flex items-center justify-end pr-1"
              style={{
                width: `${28 + ((activeIndex + 0.5) / pins.length) * 62}%`,
                transform: lifting ? 'translateY(-10px) rotate(-1.5deg)' : 'translateY(0)',
              }}
            >
              <div className="w-2.5 h-3.5 -mt-2 rounded-t-full bg-[#dce3ea]" />
            </div>
          </div>
        </div>

        {/* Tension Bar & Tactile Feedback */}
        <div className="mt-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex-1">
            <div className="flex items-center justify-between text-[11px] text-[#cbb086] mb-1">
              <span>Напряжение отмычки</span>
              <span className="tabular-nums">
                {inSweetSpot
                  ? 'Слышен мягкий щелчок — ОТПУСКАЙ!'
                  : overLifted
                  ? 'Опасно! Слишком высоко!'
                  : `${tension}%`}
              </span>
            </div>
            <div className="h-2 w-full rounded bg-[#100b08] border border-[#5a4124] overflow-hidden">
              <div
                className={`h-full transition-all duration-100 ${
                  inSweetSpot
                    ? 'bg-[#e8bd55]'
                    : tension > 55 || overLifted
                    ? 'bg-[#d64933]'
                    : 'bg-[#5fa378]'
                }`}
                style={{ width: `${Math.min(100, inSweetSpot ? 35 : Math.max(8, tension))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Instructions & Direct Controls */}
      <div className="brass-plate rounded-lg p-3.5 text-[#f0dec0]">
        <div className="text-xs leading-relaxed text-[#e3cea8] mb-3 flex items-start gap-2">
          {overLifted ? (
            <ShieldAlert className="w-4 h-4 shrink-0 text-[#e85f46] mt-0.5" />
          ) : (
            <Wrench className="w-4 h-4 shrink-0 text-[#e8b85a] mt-0.5" />
          )}
          <span>{statusMsg}</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            disabled={activeIndex === 0 || completed}
            onClick={() => {
              sfx.playClick();
              setActiveIndex((i) => Math.max(0, i - 1));
            }}
            className="py-2.5 px-2 rounded bg-[#271d16] border border-[#7c592f] hover:border-[#e6b75e] text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-40 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Левее</span>
          </button>

          <button
            type="button"
            disabled={completed || lockpickCount <= 0 || activePin?.locked}
            onMouseDown={() => setLifting(true)}
            onMouseUp={releaseLift}
            onMouseLeave={() => lifting && releaseLift()}
            onTouchStart={(e) => {
              e.preventDefault();
              setLifting(true);
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              releaseLift();
            }}
            className={`col-span-2 py-2.5 px-3 rounded text-xs sm:text-sm font-semibold transition-all select-none cursor-pointer disabled:opacity-45 ${
              inSweetSpot
                ? 'bg-[#e6b34b] text-[#1f1207] border border-[#fff0be] shadow-[0_0_16px_rgba(240,188,82,0.65)]'
                : 'bg-gradient-to-b from-[#9c6d30] to-[#744d1d] text-[#fff3d6] border border-[#dfa954] hover:brightness-110'
            }`}
          >
            {lockpickCount <= 0
              ? 'Нет отмычек'
              : activePin?.locked
              ? 'Штифт открыт'
              : lifting
              ? inSweetSpot
                ? 'Отпусти сейчас!'
                : 'Поднимаем...'
              : 'Удерживай: Поднять штифт'}
          </button>

          <button
            type="button"
            disabled={activeIndex >= pins.length - 1 || completed}
            onClick={() => {
              sfx.playClick();
              setActiveIndex((i) => Math.min(pins.length - 1, i + 1));
            }}
            className="py-2.5 px-2 rounded bg-[#271d16] border border-[#7c592f] hover:border-[#e6b75e] text-xs font-medium flex items-center justify-center gap-1 disabled:opacity-40 cursor-pointer"
          >
            <span>Правее</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-[11px] text-[#b49b72]">
          <span>Клавиши: A / D — выбор · Пробел — поднять штифт</span>
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              onCancel();
            }}
            className="text-[#e8ba6c] hover:underline cursor-pointer"
          >
            Отменить (Esc)
          </button>
        </div>
      </div>
    </div>
  );
};
