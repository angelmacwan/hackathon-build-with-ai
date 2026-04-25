import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LearnerState, LearnerProfile, KnowledgeGraph } from '@/lib/graph/state';

// Mock LLM
vi.mock('@langchain/google-genai', () => {
  const mockInvoke = vi.fn().mockResolvedValue({
    content: JSON.stringify({
      prefersAnalogy: 0.8,
      prefersSocratic: 0.2,
      prefersNarrative: 0.5,
      prefersDrill: 0.1,
      prefersVisual: 0.9,
      readingLevel: 'intermediate',
      pace: 'fast'
    }),
  });

  return {
    ChatGoogleGenerativeAI: class MockLLM {
      invoke = mockInvoke;
    },
    __mockInvoke: mockInvoke,
  };
});

// Mock Firestore
vi.mock('@/lib/firebase/firestore', () => ({
  getLearnerProfile: vi.fn(),
  getKnowledgeGraph: vi.fn(),
  upsertConceptNode: vi.fn(),
}));

import { getLearnerProfile, getKnowledgeGraph, upsertConceptNode } from '@/lib/firebase/firestore';

describe('Profile Agent', () => {
  const baseProfile: LearnerProfile = {
    userId: 'test-uid',
    goal: 'learn coding',
    difficultyPreference: 'balanced',
    currentCluster: 'basics',
    learningStyle: {
      prefersAnalogy: 0.5,
      prefersSocratic: 0.5,
      prefersNarrative: 0.5,
      prefersDrill: 0.5,
      prefersVisual: 0.5,
      readingLevel: 'beginner',
      pace: 'medium',
    },
    roadmap: [],
    xp: 0,
    level: 1,
    badges: [],
    streak: 0,
    lastActive: new Date().toISOString(),
  };

  const baseGraph: KnowledgeGraph = {
    nodes: [
      { concept: 'recursion', confidence: 50, mastered: false, lastReviewed: '', nextReviewDue: '' }
    ],
    edges: [],
  };

  const baseState: Partial<LearnerState> = {
    userId: 'test-uid',
    userMessage: 'I understand recursion now!',
    sessionHistory: [],
    intent: 'ready_to_advance',
    extractedConcepts: ['recursion'],
    learnerProfile: baseProfile,
    knowledgeGraph: baseGraph,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (getLearnerProfile as any).mockResolvedValue(baseProfile);
    (getKnowledgeGraph as any).mockResolvedValue(baseGraph);
  });

  it('updates concept confidence based on intent', async () => {
    const { profileAgent } = await import('@/lib/agents/profile');
    await profileAgent(baseState as LearnerState);

    expect(upsertConceptNode).toHaveBeenCalledWith('test-uid', expect.objectContaining({
      concept: 'recursion',
      confidence: 65, // 50 + 15 for ready_to_advance
      mastered: false,
    }));
  });

  it('marks concept as mastered if confidence reaches 80', async () => {
    const state = {
      ...baseState,
      knowledgeGraph: {
        nodes: [{ concept: 'recursion', confidence: 70, mastered: false, lastReviewed: '', nextReviewDue: '' }],
        edges: [],
      }
    };
    (getKnowledgeGraph as any).mockResolvedValue(state.knowledgeGraph);

    const { profileAgent } = await import('@/lib/agents/profile');
    await profileAgent(state as LearnerState);

    expect(upsertConceptNode).toHaveBeenCalledWith('test-uid', expect.objectContaining({
      concept: 'recursion',
      confidence: 85, // 70 + 15
      mastered: true,
    }));
  });

  it('blends learning style signals using exponential moving average', async () => {
    const { profileAgent } = await import('@/lib/agents/profile');
    const result = await profileAgent(baseState as LearnerState);

    // EMA: existing * 0.7 + detected * 0.3
    // prefersAnalogy: 0.5 * 0.7 + 0.8 * 0.3 = 0.35 + 0.24 = 0.59
    expect(result.learnerProfile?.learningStyle.prefersAnalogy).toBe(0.59);
    // prefersVisual: 0.5 * 0.7 + 0.9 * 0.3 = 0.35 + 0.27 = 0.62
    expect(result.learnerProfile?.learningStyle.prefersVisual).toBe(0.62);
    // readingLevel: detected = intermediate
    expect(result.learnerProfile?.learningStyle.readingLevel).toBe('intermediate');
  });

  it('handles LLM errors by keeping current style', async () => {
    const { __mockInvoke } = await import('@langchain/google-genai') as any;
    __mockInvoke.mockRejectedValueOnce(new Error('LLM Error'));

    const { profileAgent } = await import('@/lib/agents/profile');
    const result = await profileAgent(baseState as LearnerState);

    expect(result.learnerProfile?.learningStyle).toEqual(baseProfile.learningStyle);
  });
});
