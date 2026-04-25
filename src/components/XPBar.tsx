'use client';

import { calculateLevel } from '@/lib/gamification/xp';

interface XPBarProps {
  xp: number;
  compact?: boolean;
}

export default function XPBar({ xp, compact = false }: XPBarProps) {
  const info = calculateLevel(xp);

  return (
    <div className={`space-y-1.5 ${compact ? '' : 'w-full'}`} aria-label={`Level ${info.level} ${info.levelName}, ${info.xp} XP`}>
      {!compact && (
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold" style={{ color: 'var(--np-purple)' }}>
            Lv.{info.level} · {info.levelName}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            {info.xpIntoCurrentLevel.toLocaleString()} / {info.xpForNextLevel.toLocaleString()} XP
          </span>
        </div>
      )}

      <div
        className="h-3 rounded-full overflow-hidden"
        style={{ background: '#E5E7EB' }}
        role="progressbar"
        aria-valuenow={info.progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${info.progressPercent}% to next level`}
      >
        <div
          className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{
            width: `${info.progressPercent}%`,
            background: 'linear-gradient(90deg, var(--np-purple), var(--np-teal))',
          }}
        />
      </div>

      {compact && (
        <div className="text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>
          Lv.{info.level} · {info.progressPercent}%
        </div>
      )}
    </div>
  );
}
