import React from 'react';
import { PortraitId, SceneArtId } from '../types/game';
import { ASSETS, PORTRAIT_CROPS, SCENE_CROPS } from '../utils/assets';

interface PortraitFrameProps {
  id: PortraitId;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  active?: boolean;
  danger?: boolean;
}

export const PortraitFrame: React.FC<PortraitFrameProps> = ({
  id,
  size = 'md',
  className = '',
  active = false,
  danger = false,
}) => {
  const sizeClass =
    size === 'sm' ? 'w-11 h-11' : size === 'lg' ? 'w-20 h-20' : 'w-14 h-14';
  const borderClass = active
    ? 'border-[#f4c668] shadow-[0_0_12px_rgba(244,198,104,0.5)]'
    : danger
    ? 'border-[#c24130]'
    : 'border-[#9c723c]';

  const crop = PORTRAIT_CROPS[id];

  if (crop) {
    return (
      <div
        role="img"
        aria-label={crop.alt}
        className={`${sizeClass} relative shrink-0 overflow-hidden rounded-md border-2 ${borderClass} bg-[#18120e] ${className}`}
      >
        <div
          className="h-full w-full bg-no-repeat"
          style={{
            backgroundImage: `url(${crop.src})`,
            backgroundSize: crop.bgSize,
            backgroundPosition: crop.bgPos,
          }}
        />
        <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_10px_rgba(0,0,0,0.65)]" />
      </div>
    );
  }

  // Bespoke stylized SVG portraits for procedural abyssal/imperial enemies
  return (
    <div
      className={`${sizeClass} relative shrink-0 overflow-hidden rounded-md border-2 ${borderClass} bg-[#121921] flex items-center justify-center ${className}`}
    >
      {id === 'enemy_imperial' && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <defs>
            <radialGradient id="impBg" cx="50%" cy="35%" r="65%">
              <stop offset="0%" stopColor="#2e4052" />
              <stop offset="100%" stopColor="#0c1218" />
            </radialGradient>
          </defs>
          <rect width="64" height="64" fill="url(#impBg)" />
          <path d="M14 64 C16 48 48 48 50 64 Z" fill="#2c333b" stroke="#8c6c3b" strokeWidth="1.5" />
          <circle cx="32" cy="30" r="16" fill="#4f5a64" stroke="#b38a4c" strokeWidth="2.5" />
          <circle cx="32" cy="30" r="9" fill="#0d232b" stroke="#d4a759" strokeWidth="2" />
          <line x1="23" y1="30" x2="41" y2="30" stroke="#8a6a38" strokeWidth="1.5" />
          <line x1="32" y1="21" x2="32" y2="39" stroke="#8a6a38" strokeWidth="1.5" />
          <circle cx="32" cy="30" r="3" fill="#ff5b36" opacity="0.9" />
          <rect x="28" y="10" width="8" height="5" rx="1" fill="#b38a4c" />
        </svg>
      )}
      {id === 'enemy_bounty' && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <rect width="64" height="64" fill="#1d1412" />
          <path d="M12 64 C14 46 50 46 52 64 Z" fill="#3b261d" stroke="#8f5d32" strokeWidth="1.5" />
          <circle cx="32" cy="29" r="14" fill="#5e4030" stroke="#24150f" strokeWidth="2" />
          <path d="M16 24 Q32 10 48 24 L46 19 Q32 6 18 19 Z" fill="#261914" />
          <rect x="20" y="25" width="24" height="6" rx="2" fill="#1a120f" />
          <circle cx="26" cy="28" r="2.2" fill="#f5b342" />
          <circle cx="38" cy="28" r="2.2" fill="#f5b342" />
          <path d="M22 36 Q32 42 42 36 L44 46 L20 46 Z" fill="#3a2922" />
        </svg>
      )}
      {id === 'enemy_mutant' && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <rect width="64" height="64" fill="#0d1e20" />
          <path d="M14 64 C16 44 48 44 50 64 Z" fill="#1e3c3c" />
          <ellipse cx="32" cy="31" rx="14" ry="16" fill="#2d5753" stroke="#132928" strokeWidth="2" />
          <circle cx="25" cy="27" r="3.4" fill="#7fffe0" />
          <circle cx="39" cy="28" r="4.2" fill="#7fffe0" />
          <circle cx="31" cy="21" r="2" fill="#9affea" />
          <path d="M24 38 Q32 34 40 38" stroke="#0d1d1c" strokeWidth="2.5" fill="none" />
          <path d="M18 22 C12 18 12 28 16 32" stroke="#4ea698" strokeWidth="2.5" fill="none" />
          <path d="M46 22 C52 18 52 28 48 32" stroke="#4ea698" strokeWidth="2.5" fill="none" />
        </svg>
      )}
      {id === 'enemy_abyssal' && (
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <defs>
            <radialGradient id="abyssGlow" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor="#35d4b6" stopOpacity="0.65" />
              <stop offset="100%" stopColor="#070d14" />
            </radialGradient>
          </defs>
          <rect width="64" height="64" fill="url(#abyssGlow)" />
          <path d="M8 58 Q18 32 10 14" stroke="#18474c" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M56 58 Q46 32 54 14" stroke="#18474c" strokeWidth="5" fill="none" strokeLinecap="round" />
          <ellipse cx="32" cy="32" rx="18" ry="12" fill="#0d252b" stroke="#4ee8c7" strokeWidth="1.5" />
          <ellipse cx="32" cy="32" rx="5" ry="10" fill="#75ffdf" />
          <ellipse cx="32" cy="32" rx="2" ry="8" fill="#061217" />
        </svg>
      )}
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_10px_rgba(0,0,0,0.6)]" />
    </div>
  );
};

interface SceneIllustrationProps {
  art: SceneArtId;
  className?: string;
  caption?: string;
}

export const SceneIllustration: React.FC<SceneIllustrationProps> = ({
  art,
  className = '',
  caption,
}) => {
  // Map SceneArtId to official cropped artwork when available
  const directCropMap: Partial<Record<SceneArtId, keyof typeof SCENE_CROPS>> = {
    bar_admiral: 'bar_admiral',
    bar_brawl: 'bar_brawl',
    storeroom: 'storeroom',
    jill_john_bond: 'jill_john_bond',
    silver_pouring: 'silver_pouring',
    silver_smoking: 'silver_smoking',
    scrapyard: 'john_workshop',
  };

  const cropKey = directCropMap[art];
  if (cropKey) {
    const spec = SCENE_CROPS[cropKey];
    return (
      <div className={`relative overflow-hidden rounded-md border-2 border-[#7b572d] bg-[#120e0b] ${className}`}>
        <div
          role="img"
          aria-label={spec.alt}
          className="h-full w-full bg-no-repeat transition-transform duration-500"
          style={{
            backgroundImage: `url(${spec.src})`,
            backgroundSize: spec.bgSize,
            backgroundPosition: spec.bgPos,
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#120d09]/75 via-transparent to-[#120d09]/20" />
        {caption && (
          <div className="absolute bottom-2 left-3 right-3 text-xs text-[#f2dfbe] drop-shadow">
            {caption}
          </div>
        )}
      </div>
    );
  }

  // Flint parlor uses Flint character sheet hero portrait + atmospheric overlay
  if (art === 'flint_parlor') {
    return (
      <div className={`relative overflow-hidden rounded-md border-2 border-[#7b572d] bg-[#140e0e] ${className}`}>
        <div
          role="img"
          aria-label="Капитан Флинт за картой Атлантиды"
          className="h-full w-full bg-no-repeat"
          style={{
            backgroundImage: `url(${ASSETS.flintSheet})`,
            backgroundSize: '235%',
            backgroundPosition: '6% 18%',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#140e0c]/30 via-transparent to-[#140e0c]/85" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#120d09]/80 via-transparent to-transparent" />
        <div className="pointer-events-none absolute right-4 top-4 w-28 h-28 rounded-full border border-[#d6a756]/35 bg-[#1b120e]/60 flex items-center justify-center">
          <svg viewBox="0 0 80 80" className="w-20 h-20 text-[#e5b865]/75">
            <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 3" />
            <polygon points="40,8 45,35 72,40 45,45 40,72 35,45 8,40 35,35" fill="currentColor" opacity="0.55" />
            <circle cx="40" cy="40" r="5" fill="#1b120e" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
        {caption && (
          <div className="absolute bottom-2 left-3 right-3 text-xs text-[#f2dfbe] drop-shadow">
            {caption}
          </div>
        )}
      </div>
    );
  }

  // Atmospheric dieselpunk & deep-sea horror procedural SVG illustrations for expeditions & grotto outskirts
  return (
    <div className={`relative overflow-hidden rounded-md border-2 border-[#7b572d] bg-[#08131b] ${className}`}>
      <DeepSeaBackdrop art={art} />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_32px_rgba(0,0,0,0.8)]" />
      {caption && (
        <div className="absolute bottom-2 left-3 right-3 text-xs text-[#d6ece7] drop-shadow">
          {caption}
        </div>
      )}
    </div>
  );
};

const DeepSeaBackdrop: React.FC<{ art: SceneArtId }> = ({ art }) => {
  const palette =
    art === 'atlantis_gate'
      ? { top: '#09242e', mid: '#0d3b46', accent: '#56f0d0', warm: '#e8b65a' }
      : art === 'mutant_trench' || art === 'whispering_reef'
      ? { top: '#0c1624', mid: '#172736', accent: '#62e5b8', warm: '#d17843' }
      : art === 'imperial_patrol'
      ? { top: '#0d1520', mid: '#1a2736', accent: '#ff6448', warm: '#e2ae52' }
      : { top: '#0c1821', mid: '#142634', accent: '#eab556', warm: '#d89a45' };

  return (
    <svg viewBox="0 0 600 320" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
      <defs>
        <linearGradient id={`bg_${art}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.top} />
          <stop offset="65%" stopColor={palette.mid} />
          <stop offset="100%" stopColor="#050b10" />
        </linearGradient>
        <radialGradient id={`beam_${art}`} cx="50%" cy="35%" r="55%">
          <stop offset="0%" stopColor={palette.accent} stopOpacity="0.32" />
          <stop offset="100%" stopColor={palette.accent} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="600" height="320" fill={`url(#bg_${art})`} />
      <circle cx="300" cy="120" r="210" fill={`url(#beam_${art})`} />

      {/* Distant underwater canyon silhouettes */}
      <path d="M0 320 L0 190 L85 150 L150 220 L240 165 L340 230 L450 140 L540 195 L600 160 L600 320 Z" fill="#071018" opacity="0.72" />
      <path d="M0 320 L0 245 L110 215 L220 265 L350 220 L485 260 L600 220 L600 320 Z" fill="#04090e" opacity="0.92" />

      {/* Scene-specific focal element */}
      {(art === 'submarine_dock' || art === 'sunken_wreck' || art === 'bounty_ambush') && (
        <g transform="translate(135, 115)">
          {/* Searchlight cone */}
          <polygon points="300,48 450,5 450,115" fill={palette.warm} opacity="0.18" />
          {/* Dieselpunk Submarine hull */}
          <ellipse cx="165" cy="52" rx="145" ry="38" fill="#1e2a33" stroke="#99733d" strokeWidth="3" />
          <path d="M90 18 L115 -14 L185 -14 L205 18 Z" fill="#23313b" stroke="#99733d" strokeWidth="2.5" />
          <rect x="145" y="-34" width="6" height="22" fill="#8b6938" />
          <circle cx="148" cy="-34" r="4" fill={palette.warm} />
          {/* Riveted portholes */}
          {[95, 145, 195, 245].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="50" r="12" fill="#0c151c" stroke="#c89a4d" strokeWidth="2.5" />
              <circle cx={cx} cy="50" r="8" fill={palette.warm} opacity="0.75" />
            </g>
          ))}
          {/* Brass propeller */}
          <ellipse cx="16" cy="52" rx="6" ry="20" fill="#8f6a37" />
        </g>
      )}

      {art === 'imperial_patrol' && (
        <g>
          {/* Red sonar search beams */}
          <polygon points="140,40 40,300 240,300" fill="#ff5538" opacity="0.14" />
          <polygon points="460,55 340,300 560,300" fill="#ff5538" opacity="0.14" />
          {/* Imperial dreadnought silhouette */}
          <path d="M90 70 L510 70 L470 125 L130 125 Z" fill="#182029" stroke="#9c6c3b" strokeWidth="2.5" />
          <rect x="235" y="34" width="130" height="36" fill="#202a36" stroke="#b58347" strokeWidth="2" />
          <circle cx="300" cy="52" r="10" fill="#ff593a" opacity="0.8" />
          {/* Sea mines */}
          {[120, 300, 480].map((mx, i) => (
            <g key={mx} transform={`translate(${mx}, ${190 + (i % 2) * 28})`}>
              <line x1="0" y1="16" x2="0" y2="120" stroke="#475966" strokeWidth="2" strokeDasharray="4 4" />
              <circle cx="0" cy="0" r="16" fill="#1e272e" stroke="#856338" strokeWidth="2" />
              <circle cx="0" cy="0" r="4" fill="#ff5238" />
            </g>
          ))}
        </g>
      )}

      {(art === 'mutant_trench' || art === 'whispering_reef') && (
        <g>
          {/* Giant abyssal silhouettes & tentacles */}
          <path d="M70 320 Q110 210 175 180 Q135 245 150 320" fill="#123236" stroke="#47bfa6" strokeWidth="1.5" opacity="0.8" />
          <path d="M520 320 Q470 200 410 155 Q460 225 450 320" fill="#123236" stroke="#47bfa6" strokeWidth="1.5" opacity="0.8" />
          {/* Eerie watching eyes in the dark */}
          <ellipse cx="265" cy="130" rx="18" ry="8" fill="#5ff5cf" opacity="0.72" />
          <ellipse cx="265" cy="130" rx="4" ry="7" fill="#061217" />
          <ellipse cx="335" cy="130" rx="18" ry="8" fill="#5ff5cf" opacity="0.72" />
          <ellipse cx="335" cy="130" rx="4" ry="7" fill="#061217" />
          {/* Glowing jellyfish */}
          {[140, 445].map((jx, idx) => (
            <g key={jx} transform={`translate(${jx}, ${85 + idx * 24})`} opacity="0.7">
              <path d="M-18 0 A18 14 0 0 1 18 0 Z" fill="#63f0cc" opacity="0.45" stroke="#85ffe0" strokeWidth="1.5" />
              <path d="M-10 2 Q-14 24 -8 42 M0 2 Q4 26 -2 46 M10 2 Q14 22 9 40" stroke="#85ffe0" strokeWidth="1.2" fill="none" />
            </g>
          ))}
        </g>
      )}

      {art === 'atlantis_gate' && (
        <g transform="translate(300, 165)">
          {/* Glowing Atlantean Ring Gate */}
          <circle cx="0" cy="0" r="102" fill="none" stroke="#c89a4d" strokeWidth="10" />
          <circle cx="0" cy="0" r="88" fill="#082830" stroke="#5bf2d2" strokeWidth="2.5" strokeDasharray="10 6" />
          <circle cx="0" cy="0" r="64" fill="none" stroke="#5bf2d2" strokeWidth="1.5" opacity="0.65" />
          <polygon points="0,-54 14,-14 54,0 14,14 0,54 -14,14 -54,0 -14,-14" fill="#5bf2d2" opacity="0.35" stroke="#e8c26b" strokeWidth="2" />
          {/* 3 Key sockets */}
          {[-72, 0, 72].map((kx) => (
            <circle key={kx} cx={kx} cy={kx === 0 ? -98 : 68} r="9" fill="#18120c" stroke="#f0c469" strokeWidth="2.5" />
          ))}
        </g>
      )}

      {/* Bubbles & bioluminescent motes */}
      {[55, 130, 215, 365, 420, 525, 560].map((bx, i) => (
        <circle
          key={bx}
          cx={bx}
          cy={45 + ((i * 47) % 210)}
          r={2 + (i % 3)}
          fill={palette.accent}
          opacity="0.45"
        />
      ))}

      {/* Brass porthole corner bolts */}
      <rect x="8" y="8" width="584" height="304" rx="8" fill="none" stroke="#99733d" strokeWidth="2" opacity="0.55" />
    </svg>
  );
};

export const InkVignette: React.FC<{ kind?: 'keys' | 'cylinder' | 'mug' | 'octopus' | 'submarine' | 'compass' }> = ({
  kind = 'compass',
}) => {
  // Subtle sepia ink sketch on parchment (extracted cleanly from the stickers sheet or bespoke ink SVG)
  return (
    <div className="pointer-events-none select-none opacity-65 flex justify-end pt-1">
      <svg viewBox="0 0 120 48" className="h-11 w-28 text-[#5c3d22]">
        {kind === 'keys' && (
          <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <circle cx="28" cy="24" r="9" />
            <circle cx="28" cy="24" r="4" />
            <path d="M37 24 L82 24 M68 24 L68 32 M76 24 L76 30" />
            <circle cx="38" cy="34" r="6" />
            <path d="M44 34 L74 42 M64 39 L62 45" />
          </g>
        )}
        {kind === 'cylinder' && (
          <g fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="28" y="13" width="64" height="22" rx="4" />
            <line x1="40" y1="13" x2="40" y2="35" />
            <line x1="80" y1="13" x2="80" y2="35" />
            <circle cx="60" cy="24" r="5" />
            <path d="M60 17 L60 31 M53 24 L67 24" />
          </g>
        )}
        {kind === 'mug' && (
          <g fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="38" y="14" width="28" height="24" rx="3" />
            <path d="M66 19 Q76 19 76 26 Q76 33 66 33" />
            <path d="M22 38 Q48 44 88 38" strokeDasharray="3 2" />
            <path d="M44 10 Q48 6 52 10 Q56 6 60 10" />
          </g>
        )}
        {kind === 'octopus' && (
          <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <ellipse cx="60" cy="18" rx="14" ry="11" />
            <circle cx="55" cy="19" r="1.5" fill="currentColor" />
            <circle cx="65" cy="19" r="1.5" fill="currentColor" />
            <path d="M48 25 Q32 32 26 42 M54 28 Q46 38 42 44 M66 28 Q74 38 78 44 M72 25 Q88 32 94 42" />
          </g>
        )}
        {kind === 'submarine' && (
          <g fill="none" stroke="currentColor" strokeWidth="1.5">
            <ellipse cx="62" cy="28" rx="34" ry="11" />
            <path d="M48 17 L54 9 L72 9 L76 17" />
            <circle cx="48" cy="28" r="3.5" />
            <circle cx="62" cy="28" r="3.5" />
            <circle cx="76" cy="28" r="3.5" />
            <path d="M24 22 L28 28 L24 34" />
          </g>
        )}
        {kind === 'compass' && (
          <g fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="60" cy="24" r="17" />
            <polygon points="60,9 63,21 75,24 63,27 60,39 57,27 45,24 57,21" />
            <circle cx="60" cy="24" r="2.5" fill="currentColor" />
          </g>
        )}
      </svg>
    </div>
  );
};
