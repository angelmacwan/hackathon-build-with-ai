'use client';

import { Flame } from 'lucide-react';

interface StreakCounterProps {
  days: number;
  compact?: boolean;
}

export default function StreakCounter({ days, compact = false }: StreakCounterProps) {
  const isActive = days > 0;
  const isHot = days >= 3;

  return (
    <div
      className={`flex items-center gap-2 ${compact ? 'text-sm' : ''}`}
      aria-label={`${days}-day learning streak`}
    >
      <span
        className={`text-${compact ? 'lg' : '2xl'} ${isHot ? 'animate-float' : ''}`}
        aria-hidden="true"
        style={{ animationDuration: '1.5s' }}
      >
        {isActive ? '🔥' : '💤'}
      </span>
      <div>
        <div
          className={`font-bold ${compact ? 'text-base' : 'text-2xl'}`}
          style={{ color: isHot ? 'var(--np-gold)' : 'var(--text-secondary)' }}
        >
          {days}
          <span className={`font-normal text-gray-500 ${compact ? 'text-xs' : 'text-sm'} ml-1`}>
            day{days !== 1 ? 's' : ''}
          </span>
        </div>
        {!compact && (
          <div className="text-xs text-gray-500">
            {isHot ? '🔥 On fire!' : days > 0 ? 'Keep it up' : 'Start your streak today'}
          </div>
        )}
      </div>
    </div>
  );
}
