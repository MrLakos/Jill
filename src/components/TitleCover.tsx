import React, { useState } from 'react';
import { BookOpen, Compass, RotateCcw, Sparkles } from 'lucide-react';
import { PortraitFrame, SceneIllustration } from './CroppedArt';
import { sfx } from '../utils/sound';

interface TitleCoverProps {
  hasSavedGame: boolean;
  onContinue: () => void;
  onStartNew: (seed: number) => void;
}

export const TitleCover: React.FC<TitleCoverProps> = ({
  hasSavedGame,
  onContinue,
  onStartNew,
}) => {
  const [seedInput, setSeedInput] = useState(() => String(Math.floor(1000 + Math.random() * 8999)));

  const handleStart = () => {
    sfx.playPageTurn();
    const parsed = parseInt(seedInput.replace(/\D/g, ''), 10) || Math.floor(1000 + Math.random() * 8999);
    onStartNew(parsed);
  };

  return (
    <div className="abyss-table-bg min-h-screen w-full flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[1060px] rounded-2xl p-3 sm:p-4 bg-gradient-to-br from-[#3d2616] via-[#24150c] to-[#170d07] border-2 border-[#7b552c] shadow-[0_30px_80px_rgba(0,0,0,0.88)]">
        <div className="grid grid-cols-1 lg:grid-cols-12 rounded-xl overflow-hidden border border-[#614021] bg-[#16100c]">
          {/* Left Side: Illustrated Atmospheric Cover */}
          <div className="lg:col-span-7 relative flex flex-col justify-between p-6 sm:p-8 bg-gradient-to-b from-[#1f1610] to-[#110c09]">
            <div>
              <div className="text-xs tracking-widest text-[#d4a95a] mb-2">
                ДИЗЕЛЬПАНК · ГЛУБОКОВОДНЫЙ ХОРРОР · ИНТЕРАКТИВНАЯ КНИГА
              </div>
              <h1
                className="font-display text-4xl sm:text-5xl font-bold text-[#f7e3bc] leading-[1.08] mb-3"
                style={{ textWrap: 'balance' }}
              >
                Хроники Бездны: Секрет «Адмирала»
              </h1>
              <p className="text-sm sm:text-[15px] text-[#cbb794] leading-relaxed mb-5 max-w-xl">
                Тайный подводный грот контрабандистов. Девятилетняя механик-медиум Джил, её
                боевой дроид Маленький Джон со свалки, одноногий опекун Сильвер и хитроумный
                капитан Флинт, манящий кладом затерянной Атлантиды.
              </p>
            </div>

            <SceneIllustration art="bar_admiral" className="h-[235px] sm:h-[265px] mb-5" />

            {/* Cast Portraits Strip */}
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { id: 'jill' as const, name: 'Джил', role: 'Механик и медиум' },
                { id: 'john' as const, name: 'Мал. Джон', role: 'Дроид J-17' },
                { id: 'silver' as const, name: 'Сильвер', role: 'Хозяин бара' },
                { id: 'flint' as const, name: 'Кап. Флинт', role: 'Авантюрист' },
              ].map((hero) => (
                <div
                  key={hero.id}
                  className="flex items-center gap-2 p-2 rounded-md bg-[#1c1510] border border-[#5d4224]"
                >
                  <PortraitFrame id={hero.id} size="sm" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[#f5dfba] truncate">{hero.name}</div>
                    <div className="text-[10px] text-[#b49b72] truncate">{hero.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Parchment Action & World Seed Panel */}
          <div className="lg:col-span-5 parchment-right p-6 sm:p-8 flex flex-col justify-between text-[#2a190d]">
            <div>
              <div className="text-xs font-semibold text-[#6f4a24] mb-1">
                ❖ Разворот приключения ❖
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2b170b] mb-4">
                Открой дневник экспедиции
              </h2>

              <ul className="space-y-2.5 text-sm text-[#352010] mb-6">
                <li className="flex items-start gap-2">
                  <BookOpen className="w-4 h-4 text-[#784b1d] shrink-0 mt-0.5" />
                  <span>
                    <strong>Две страницы жизни:</strong> нарратив и выборы слева, бой, взлом замков,
                    торговля и резонанс справа.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Compass className="w-4 h-4 text-[#784b1d] shrink-0 mt-0.5" />
                  <span>
                    <strong>Процедурные глубины:</strong> каждый запуск генерирует карту секторов с
                    имперцами, охотниками за головами, мутантами и артефактами.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-[#784b1d] shrink-0 mt-0.5" />
                  <span>
                    <strong>Стиль игры и мораль:</strong> скрытность или лобовой бой, починка
                    Маленького Джона и 4 разные концовки.
                  </span>
                </li>
              </ul>

              {/* Procedural Seed Input */}
              <div className="p-3.5 rounded-md bg-[#dfc497]/75 border border-[#966e3d]/70 mb-5">
                <label className="block text-xs font-semibold text-[#472b13] mb-1.5">
                  Зерно генерации океана (реиграбельность)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={seedInput}
                    onChange={(e) => setSeedInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded bg-[#f7ebd3] border border-[#966e3d] text-sm font-semibold text-[#2a190d] tabular-nums focus:outline-2 focus:outline-[#7c4d19]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      sfx.playClick();
                      setSeedInput(String(Math.floor(1000 + Math.random() * 8999)));
                    }}
                    title="Случайное зерно"
                    className="p-2 rounded bg-[#e8cf9f] border border-[#8e6739] hover:bg-[#f2dca9] text-[#3a220e] cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2.5">
              {hasSavedGame && (
                <button
                  type="button"
                  onClick={() => {
                    sfx.playPageTurn();
                    onContinue();
                  }}
                  className="w-full py-3 px-4 rounded-md parchment-choice-primary text-[#241307] font-bold text-base cursor-pointer"
                >
                  Продолжить сохранённую книгу
                </button>
              )}

              <button
                type="button"
                onClick={handleStart}
                className={`w-full py-3 px-4 rounded-md font-bold text-base cursor-pointer ${
                  hasSavedGame
                    ? 'parchment-choice text-[#2b180b]'
                    : 'parchment-choice-primary text-[#241307]'
                }`}
              >
                {hasSavedGame ? 'Начать новую историю' : 'Открыть книгу и начать игру'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
