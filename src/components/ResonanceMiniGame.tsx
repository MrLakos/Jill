import React, { useEffect, useMemo, useState } from 'react';
import { Eye, Radio } from 'lucide-react';
import { ResonanceState } from '../types/game';
import { sfx } from '../utils/sound';

interface ResonanceMiniGameProps {
  puzzle: ResonanceState;
  mediumLevel: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ResonanceMiniGame: React.FC<ResonanceMiniGameProps> = ({
  puzzle,
  mediumLevel,
  onSuccess,
  onCancel,
}) => {
  const target = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < puzzle.puzzleId.length; i++) {
      hash = (hash * 37 + puzzle.puzzleId.charCodeAt(i)) % 991;
    }
    return {
      freq: 2 + (hash % 5) * 0.8, // 2.0 .. 5.2
      amp: 28 + ((hash * 3) % 44), // 28 .. 71
    };
  }, [puzzle.puzzleId]);

  const [freq, setFreq] = useState(3.0);
  const [amp, setAmp] = useState(45);
  const [syncProgress, setSyncProgress] = useState(0);
  const [done, setDone] = useState(false);

  const freqTolerance = 0.35 + mediumLevel * 0.14;
  const ampTolerance = 7 + mediumLevel * 3;

  const isAligned =
    Math.abs(freq - target.freq) <= freqTolerance &&
    Math.abs(amp - target.amp) <= ampTolerance;

  useEffect(() => {
    if (done) return;
    const timer = setInterval(() => {
      setSyncProgress((prev) => {
        if (isAligned) {
          const next = Math.min(100, prev + 8);
          if (next >= 100) {
            setDone(true);
            sfx.playAbyssWhisper();
            setTimeout(() => onSuccess(), 650);
          }
          return next;
        }
        return Math.max(0, prev - 4);
      });
    }, 100);
    return () => clearInterval(timer);
  }, [isAligned, done, onSuccess]);

  const buildWavePath = (f: number, a: number) => {
    const pts: string[] = [];
    for (let x = 0; x <= 420; x += 6) {
      const t = (x / 420) * Math.PI * 2 * f;
      const y = 90 + Math.sin(t) * a;
      pts.push(`${x === 0 ? 'M' : 'L'}${x},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  };

  return (
    <div className="flex flex-col flex-1 gap-3 animate-page-in">
      <div className="brass-plate rounded-lg p-4">
        <div className="flex items-center justify-between text-xs text-[#b8ebe0] mb-2">
          <div className="flex items-center gap-2 font-semibold">
            <Radio className="w-4 h-4 text-[#5ef0cf]" />
            <span>{puzzle.title}</span>
          </div>
          <span className="text-[#c5aa7c] tabular-nums">Медиум: {mediumLevel}</span>
        </div>

        <p className="text-xs text-[#cbb894] mb-3">{puzzle.subtitle}</p>

        {/* Brass Sonar Oscilloscope */}
        <div className="relative h-[195px] rounded-md border-2 border-[#6a5230] bg-[#06181e] overflow-hidden">
          <svg viewBox="0 0 420 180" className="w-full h-full">
            {/* Sonar grid */}
            {[30, 60, 90, 120, 150].map((y) => (
              <line key={y} x1="0" y1={y} x2="420" y2={y} stroke="#19444a" strokeWidth="1" />
            ))}
            {[70, 140, 210, 280, 350].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="180" stroke="#19444a" strokeWidth="1" />
            ))}

            {/* Target Abyssal Wave */}
            <path
              d={buildWavePath(target.freq, target.amp)}
              fill="none"
              stroke="#57f2cf"
              strokeWidth="2.5"
              strokeDasharray="6 4"
              opacity="0.72"
            />

            {/* Jill's Live Tuned Wave */}
            <path
              d={buildWavePath(freq, amp)}
              fill="none"
              stroke={isAligned ? '#ffe07d' : '#e09d44'}
              strokeWidth="3"
            />
          </svg>

          <div className="absolute top-2 right-2.5 text-[11px] font-semibold tabular-nums text-[#84ffe3]">
            {done
              ? 'Резонанс достигнут!'
              : isAligned
              ? `Удерживай волну... ${syncProgress}%`
              : 'Совмести золотую волну с бирюзовой'}
          </div>
        </div>

        {/* Sync Meter */}
        <div className="mt-3">
          <div className="h-2.5 w-full rounded bg-[#0a1317] border border-[#4c6f6d] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#36bda0] to-[#f4cf6a] transition-all duration-100"
              style={{ width: `${syncProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Brass Tuning Dials */}
      <div className="brass-plate rounded-lg p-4 space-y-3.5 text-[#f2dfbe]">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#64e8ca]" />
              Частота импульса (Гц)
            </span>
            <span className="tabular-nums font-semibold text-[#f5cd73]">{freq.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min={1.4}
            max={6.0}
            step={0.1}
            value={freq}
            disabled={done}
            onChange={(e) => {
              setFreq(parseFloat(e.target.value));
            }}
            className="w-full accent-[#e4b04e] cursor-pointer"
          />
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span>Глубина резонанса (Амплитуда)</span>
            <span className="tabular-nums font-semibold text-[#f5cd73]">{amp}</span>
          </div>
          <input
            type="range"
            min={18}
            max={78}
            step={1}
            value={amp}
            disabled={done}
            onChange={(e) => {
              setAmp(parseInt(e.target.value, 10));
            }}
            className="w-full accent-[#59e8c8] cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => sfx.playSonarPing()}
            className="px-3 py-1.5 rounded bg-[#182c31] border border-[#4a998a] text-xs text-[#a5f5e2] hover:bg-[#1f3d44] cursor-pointer"
          >
            Импульс сонара
          </button>
          <button
            type="button"
            onClick={() => {
              sfx.playClick();
              onCancel();
            }}
            className="text-xs text-[#dfc08d] hover:underline cursor-pointer"
          >
            Прервать настройку
          </button>
        </div>
      </div>
    </div>
  );
};
