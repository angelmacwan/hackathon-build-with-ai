/**
 * Gamification — Badge definitions and unlock logic.
 */

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  xpReward: number;
  unlockCriteria: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const BADGES: Record<string, Badge> = {
  seedling: {
    id: 'seedling',
    name: 'Seedling',
    emoji: '🌱',
    description: 'Completed your first learning session.',
    xpReward: 100,
    unlockCriteria: 'Complete your first session',
    rarity: 'common',
  },
  on_fire: {
    id: 'on_fire',
    name: 'On Fire',
    emoji: '🔥',
    description: 'Maintained a 3-day learning streak.',
    xpReward: 250,
    unlockCriteria: 'Reach a 3-day streak',
    rarity: 'common',
  },
  deep_thinker: {
    id: 'deep_thinker',
    name: 'Deep Thinker',
    emoji: '🧠',
    description: 'Mastered 10 concepts across any subjects.',
    xpReward: 500,
    unlockCriteria: 'Master 10 concepts',
    rarity: 'rare',
  },
  scholar: {
    id: 'scholar',
    name: 'Scholar',
    emoji: '🏆',
    description: 'Completed an entire learning roadmap.',
    xpReward: 1000,
    unlockCriteria: 'Complete a full roadmap',
    rarity: 'epic',
  },
  speed_learner: {
    id: 'speed_learner',
    name: 'Speed Learner',
    emoji: '⚡',
    description: 'Mastered a concept in a single session.',
    xpReward: 300,
    unlockCriteria: 'Master a concept in one session',
    rarity: 'rare',
  },
  diamond_mind: {
    id: 'diamond_mind',
    name: 'Diamond Mind',
    emoji: '💎',
    description: 'Maintained a 30-day learning streak.',
    xpReward: 2000,
    unlockCriteria: 'Reach a 30-day streak',
    rarity: 'legendary',
  },
  curious_cat: {
    id: 'curious_cat',
    name: 'Curious Cat',
    emoji: '🐱',
    description: 'Asked 50 questions across all sessions.',
    xpReward: 200,
    unlockCriteria: 'Ask 50 questions',
    rarity: 'common',
  },
  bookworm: {
    id: 'bookworm',
    name: 'Bookworm',
    emoji: '📚',
    description: 'Saved 20 resources to your personal library.',
    xpReward: 150,
    unlockCriteria: 'Save 20 resources',
    rarity: 'common',
  },
};

export interface BadgeCheckContext {
  totalSessions: number;
  streakDays: number;
  totalConceptsMastered: number;
  roadmapCompleted: boolean;
  masteredInSingleSession: boolean;
  totalQuestions: number;
  savedResourcesCount: number;
  currentBadges: string[];
}

/**
 * Returns an array of badge IDs that should be newly unlocked
 * based on the current user state. Only returns badges not yet earned.
 */
export function checkBadgeUnlocks(ctx: BadgeCheckContext): string[] {
  const newBadges: string[] = [];
  const existing = new Set(ctx.currentBadges);

  if (!existing.has('seedling') && ctx.totalSessions >= 1) {
    newBadges.push('seedling');
  }
  if (!existing.has('on_fire') && ctx.streakDays >= 3) {
    newBadges.push('on_fire');
  }
  if (!existing.has('deep_thinker') && ctx.totalConceptsMastered >= 10) {
    newBadges.push('deep_thinker');
  }
  if (!existing.has('scholar') && ctx.roadmapCompleted) {
    newBadges.push('scholar');
  }
  if (!existing.has('speed_learner') && ctx.masteredInSingleSession) {
    newBadges.push('speed_learner');
  }
  if (!existing.has('diamond_mind') && ctx.streakDays >= 30) {
    newBadges.push('diamond_mind');
  }
  if (!existing.has('curious_cat') && ctx.totalQuestions >= 50) {
    newBadges.push('curious_cat');
  }
  if (!existing.has('bookworm') && ctx.savedResourcesCount >= 20) {
    newBadges.push('bookworm');
  }

  return newBadges;
}
