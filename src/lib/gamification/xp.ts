/**
 * Gamification — XP system with level progression.
 */
import { BADGES } from './badges';

// XP awarded for various actions
export const XP_VALUES = {
  SESSION_COMPLETED: 25,
  CONCEPT_MASTERED: 100,
  STREAK_DAY: 50,
  BADGE_EARNED: 200,
  RESOURCE_SAVED: 10,
  QUIZ_CORRECT: 30,
  PDF_UPLOADED: 40,
} as const;

// Level thresholds — XP required to reach each level (1-indexed)
export const LEVEL_THRESHOLDS = [
  0,      // Level 1
  500,    // Level 2
  1200,   // Level 3
  2500,   // Level 4
  4500,   // Level 5
  7500,   // Level 6
  12000,  // Level 7
  18000,  // Level 8
  26000,  // Level 9
  36000,  // Level 10
];

export interface LevelInfo {
  level: number;
  xp: number;
  xpForNextLevel: number;
  xpIntoCurrentLevel: number;
  progressPercent: number;
  levelName: string;
}

const LEVEL_NAMES = [
  'Beginner',
  'Explorer',
  'Learner',
  'Scholar',
  'Thinker',
  'Expert',
  'Master',
  'Sage',
  'Luminary',
  'Legend',
];

export function calculateLevel(totalXP: number): LevelInfo {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (totalXP >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }

  const currentThreshold = LEVEL_THRESHOLDS[level - 1];
  const nextThreshold = LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 50000;
  const xpIntoCurrentLevel = totalXP - currentThreshold;
  const xpForNextLevel = nextThreshold - currentThreshold;
  const progressPercent = Math.min(100, Math.round((xpIntoCurrentLevel / xpForNextLevel) * 100));

  return {
    level,
    xp: totalXP,
    xpForNextLevel,
    xpIntoCurrentLevel,
    progressPercent,
    levelName: LEVEL_NAMES[level - 1] ?? 'Legend',
  };
}

/**
 * Calculates total XP gained from a list of events.
 */
export function calculateXPGain(events: Array<keyof typeof XP_VALUES>): number {
  return events.reduce((sum, event) => sum + XP_VALUES[event], 0);
}

/**
 * Calculates XP from newly earned badges.
 */
export function calculateBadgeXP(badgeIds: string[]): number {
  return badgeIds.reduce((sum, id) => sum + (BADGES[id]?.xpReward ?? 0), 0);
}
