'use client';

import { BADGES, type Badge } from '@/lib/gamification/badges';

interface BadgeDisplayProps {
  earnedBadgeIds: string[];
  showAll?: boolean;
  compact?: boolean;
}

const RARITY_STYLES = {
  common:    { bg: '#F3F4F6', border: '#E5E7EB', color: '#6B7280' },
  rare:      { bg: '#CCFBF1', border: '#5EEAD4', color: '#0d9488' },
  epic:      { bg: '#EDE9FE', border: '#C4B5FD', color: '#6d28d9' },
  legendary: { bg: '#FEF3C7', border: '#FCD34D', color: '#d97706' },
};

interface SingleBadgeProps {
  badge: Badge;
  earned: boolean;
  compact?: boolean;
  animateIn?: boolean;
}

function SingleBadge({ badge, earned, compact = false, animateIn = false }: SingleBadgeProps) {
  const rarity = RARITY_STYLES[badge.rarity];

  return (
    <div
      className={`${compact ? 'p-3' : 'p-5'} rounded-2xl border text-center transition-all ${
        animateIn ? 'animate-badge-pop' : ''
      }`}
      style={
        earned
          ? { background: rarity.bg, borderColor: rarity.border }
          : { background: '#F9FAFB', borderColor: '#E5E7EB', opacity: 0.5 }
      }
      role="img"
      aria-label={`${badge.name} badge${earned ? '' : ' (locked)'}: ${badge.unlockCriteria}`}
    >
      <div
        className={`${compact ? 'text-2xl' : 'text-4xl'} mb-2 ${
          earned && badge.rarity === 'legendary' ? 'animate-float' : ''
        } ${!earned ? 'grayscale' : ''}`}
        aria-hidden="true"
      >
        {badge.emoji}
      </div>

      <div
        className={`font-bold ${compact ? 'text-xs' : 'text-sm'}`}
        style={{ color: earned ? rarity.color : 'var(--text-muted)' }}
      >
        {badge.name}
      </div>

      {!compact && (
        <>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {badge.unlockCriteria}
          </div>
          <div
            className="text-[10px] font-semibold mt-2 px-2 py-0.5 rounded-full inline-block capitalize"
            style={{ background: 'white', color: rarity.color, border: `1px solid ${rarity.border}` }}
          >
            {badge.rarity}
          </div>
          {earned && (
            <div className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
              +{badge.xpReward} XP
            </div>
          )}
          {!earned && (
            <div className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>🔒 Locked</div>
          )}
        </>
      )}
    </div>
  );
}

export default function BadgeDisplay({ earnedBadgeIds, showAll = true, compact = false }: BadgeDisplayProps) {
  const earnedSet = new Set(earnedBadgeIds);
  const allBadges = Object.values(BADGES);
  const displayBadges = showAll ? allBadges : allBadges.filter((b) => earnedSet.has(b.id));

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {earnedBadgeIds.length} of {allBadges.length} badges earned
        </div>
      )}

      <div
        className={`grid gap-3 ${
          compact ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
        }`}
        aria-label="Badge collection"
      >
        {displayBadges.map((badge) => (
          <SingleBadge
            key={badge.id}
            badge={badge}
            earned={earnedSet.has(badge.id)}
            compact={compact}
          />
        ))}
      </div>

      {displayBadges.length === 0 && !showAll && (
        <p className="text-center text-sm py-8" style={{ color: 'var(--text-muted)' }}>
          No badges earned yet. Keep learning! 🌱
        </p>
      )}
    </div>
  );
}
