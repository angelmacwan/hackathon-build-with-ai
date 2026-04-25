import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LearnerState } from '@/lib/graph/state';

// Mock LLM
vi.mock('@langchain/google-genai', () => {
  const mockInvoke = vi.fn().mockResolvedValue({
    content: JSON.stringify({
      targetConcept: 'recursion',
      depth: 'beginner',
      analogies: ['stack of plates'],
      priorKnowledgeToReference: ['functions'],
      suggestedPedagogyMode: 'analogy'
    }),
  });

  return {
    ChatGoogleGenerativeAI: class MockLLM {
      invoke = mockInvoke;
    },
    __mockInvoke: mockInvoke,
  };
});

describe('Curriculum Agent', () => {
  const baseState: Partial<LearnerState> = {
    userId: 'test-uid',
    userMessage: 'What is recursion?',
    sessionHistory: [],
    extractedConcepts: ['recursion'],
    learnerProfile: {
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
      lastActive: '',
    },
    knowledgeGraph: {
      nodes: [
        { concept: 'functions', confidence: 90, mastered: true, lastReviewed: '', nextReviewDue: '' }
      ],
      edges: [],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a teaching plan using LLM', async () => {
    const { curriculumAgent } = await import('@/lib/agents/curriculum');
    const result = await curriculumAgent(baseState as LearnerState);

    expect(result.teachingPlan?.targetConcept).toBe('recursion');
    expect(result.teachingPlan?.depth).toBe('beginner');
    expect(result.teachingPlan?.suggestedPedagogyMode).toBe('analogy');
  });

  it('handles LLM errors with a reasonable fallback', async () => {
    const { __mockInvoke } = await import('@langchain/google-genai') as any;
    __mockInvoke.mockRejectedValueOnce(new Error('LLM Error'));

    const { curriculumAgent } = await import('@/lib/agents/curriculum');
    const result = await curriculumAgent(baseState as LearnerState);

    expect(result.teachingPlan).toBeDefined();
    expect(result.teachingPlan?.targetConcept).toBe('recursion');
    expect(result.teachingPlan?.suggestedPedagogyMode).toBe('socratic'); // Fallback mode
  });
});
