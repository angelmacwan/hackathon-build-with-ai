import { describe, it, expect } from 'vitest';
import { calculateLevel, calculateXPGain, calculateBadgeXP, XP_VALUES, LEVEL_THRESHOLDS } from '@/lib/gamification/xp';
import { BADGES } from '@/lib/gamification/badges';

describe('XP System', () => {
  describe('calculateLevel', () => {
    it('returns level 1 for 0 XP', () => {
      const info = calculateLevel(0);
      expect(info.level).toBe(1);
      expect(info.levelName).toBe('Beginner');
    });

    it('returns level 2 at threshold', () => {
      const info = calculateLevel(500);
      expect(info.level).toBe(2);
    });

    it('returns level 3 at threshold', () => {
      const info = calculateLevel(1200);
      expect(info.level).toBe(3);
    });

    it('progressPercent is between 0 and 100', () => {
      for (const xp of [0, 100, 500, 1200, 2500, 36000]) {
        const { progressPercent } = calculateLevel(xp);
        expect(progressPercent).toBeGreaterThanOrEqual(0);
        expect(progressPercent).toBeLessThanOrEqual(100);
      }
    });

    it('returns max level for very high XP', () => {
      const info = calculateLevel(999999);
      expect(info.level).toBeLessThanOrEqual(LEVEL_THRESHOLDS.length);
    });

    it('xpIntoCurrentLevel is always less than xpForNextLevel', () => {
      for (const xp of [0, 300, 750, 2000, 10000]) {
        const { xpIntoCurrentLevel, xpForNextLevel } = calculateLevel(xp);
        expect(xpIntoCurrentLevel).toBeLessThanOrEqual(xpForNextLevel);
      }
    });
  });

  describe('calculateXPGain', () => {
    it('calculates XP for session completed', () => {
      const xp = calculateXPGain(['SESSION_COMPLETED']);
      expect(xp).toBe(XP_VALUES.SESSION_COMPLETED);
    });

    it('calculates XP for multiple events', () => {
      const xp = calculateXPGain(['SESSION_COMPLETED', 'CONCEPT_MASTERED', 'BADGE_EARNED']);
      expect(xp).toBe(XP_VALUES.SESSION_COMPLETED + XP_VALUES.CONCEPT_MASTERED + XP_VALUES.BADGE_EARNED);
    });

    it('returns 0 for empty events array', () => {
      expect(calculateXPGain([])).toBe(0);
    });
  });

  describe('calculateBadgeXP', () => {
    it('calculates XP for a known badge', () => {
      const xp = calculateBadgeXP(['seedling']);
      expect(xp).toBe(BADGES.seedling.xpReward);
    });

    it('calculates XP for multiple badges', () => {
      const xp = calculateBadgeXP(['seedling', 'scholar']);
      expect(xp).toBe(BADGES.seedling.xpReward + BADGES.scholar.xpReward);
    });

    it('returns 0 for unknown badge IDs', () => {
      const xp = calculateBadgeXP(['unknown_badge']);
      expect(xp).toBe(0);
    });

    it('returns 0 for empty badge list', () => {
      expect(calculateBadgeXP([])).toBe(0);
    });
  });

  describe('XP Values', () => {
    it('all XP values are positive', () => {
      for (const value of Object.values(XP_VALUES)) {
        expect(value).toBeGreaterThan(0);
      }
    });

    it('concept mastered XP is greater than session completed XP', () => {
      expect(XP_VALUES.CONCEPT_MASTERED).toBeGreaterThan(XP_VALUES.SESSION_COMPLETED);
    });

    it('badge earned XP is substantial', () => {
      expect(XP_VALUES.BADGE_EARNED).toBeGreaterThan(100);
    });
  });
});
