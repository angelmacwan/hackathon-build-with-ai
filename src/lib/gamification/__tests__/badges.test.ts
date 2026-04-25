import { describe, it, expect } from 'vitest';
import { checkBadgeUnlocks, BADGES } from '@/lib/gamification/badges';
import type { BadgeCheckContext } from '@/lib/gamification/badges';

const baseContext: BadgeCheckContext = {
  totalSessions: 0,
  streakDays: 0,
  totalConceptsMastered: 0,
  roadmapCompleted: false,
  masteredInSingleSession: false,
  totalQuestions: 0,
  savedResourcesCount: 0,
  currentBadges: [],
};

describe('Badge Unlock Logic', () => {
  it('unlocks Seedling badge after first session', () => {
    const newBadges = checkBadgeUnlocks({ ...baseContext, totalSessions: 1 });
    expect(newBadges).toContain('seedling');
  });

  it('does not re-unlock already earned badges', () => {
    const newBadges = checkBadgeUnlocks({
      ...baseContext,
      totalSessions: 5,
      currentBadges: ['seedling'],
    });
    expect(newBadges).not.toContain('seedling');
  });

  it('unlocks On Fire badge at 3-day streak', () => {
    const newBadges = checkBadgeUnlocks({ ...baseContext, streakDays: 3 });
    expect(newBadges).toContain('on_fire');
  });

  it('does not unlock On Fire at 2-day streak', () => {
    const newBadges = checkBadgeUnlocks({ ...baseContext, streakDays: 2 });
    expect(newBadges).not.toContain('on_fire');
  });

  it('unlocks Deep Thinker at 10 concepts mastered', () => {
    const newBadges = checkBadgeUnlocks({ ...baseContext, totalConceptsMastered: 10 });
    expect(newBadges).toContain('deep_thinker');
  });

  it('unlocks Scholar when roadmap completed', () => {
    const newBadges = checkBadgeUnlocks({ ...baseContext, roadmapCompleted: true });
    expect(newBadges).toContain('scholar');
  });

  it('unlocks Speed Learner when mastered in single session', () => {
    const newBadges = checkBadgeUnlocks({
      ...baseContext,
      totalSessions: 1,
      masteredInSingleSession: true,
    });
    expect(newBadges).toContain('speed_learner');
  });

  it('unlocks Diamond Mind at 30-day streak', () => {
    const newBadges = checkBadgeUnlocks({ ...baseContext, streakDays: 30 });
    expect(newBadges).toContain('diamond_mind');
  });

  it('unlocks multiple badges simultaneously', () => {
    const newBadges = checkBadgeUnlocks({
      ...baseContext,
      totalSessions: 1,
      streakDays: 3,
      totalConceptsMastered: 10,
    });
    expect(newBadges).toContain('seedling');
    expect(newBadges).toContain('on_fire');
    expect(newBadges).toContain('deep_thinker');
  });

  it('returns empty array when no criteria met', () => {
    const newBadges = checkBadgeUnlocks(baseContext);
    expect(newBadges).toHaveLength(0);
  });

  it('all badge definitions have required fields', () => {
    for (const badge of Object.values(BADGES)) {
      expect(badge.id).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.emoji).toBeTruthy();
      expect(badge.xpReward).toBeGreaterThan(0);
      expect(['common', 'rare', 'epic', 'legendary']).toContain(badge.rarity);
    }
  });
});
