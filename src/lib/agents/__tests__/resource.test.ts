import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LearnerState } from '@/lib/graph/state';

// Mock Google Generative AI
vi.mock('@google/generative-ai', () => {
  const mockGenerateContent = vi.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify([
        {
          title: 'Recursion for Beginners',
          url: 'https://youtube.com/recursion',
          type: 'video',
          difficulty: 'beginner',
          estimatedMinutes: 10,
          whyRecommended: 'Visual explanation of the stack.',
          sourceDomain: 'youtube.com'
        }
      ]),
    },
  });

  const mockGetGenerativeModel = vi.fn().mockReturnValue({
    generateContent: mockGenerateContent,
  });

  return {
    GoogleGenerativeAI: class MockGenAI {
      getGenerativeModel = mockGetGenerativeModel;
    },
    __mockGenerateContent: mockGenerateContent,
  };
});

// Mock Firestore
vi.mock('@/lib/firebase/firestore', () => ({
  getConcept: vi.fn(),
  upsertConcept: vi.fn(),
}));

import { getConcept, upsertConcept } from '@/lib/firebase/firestore';

describe('Resource Agent', () => {
  const baseState: Partial<LearnerState> = {
    userId: 'test-uid',
    teachingPlan: {
      targetConcept: 'Recursion',
      depth: 'beginner',
      analogies: [],
      priorKnowledgeToReference: [],
      suggestedPedagogyMode: 'visual'
    },
    learnerProfile: {
      userId: 'test-uid',
      goal: 'coding',
      difficultyPreference: 'balanced',
      currentCluster: 'basics',
      learningStyle: {
        prefersAnalogy: 0.5,
        prefersSocratic: 0.5,
        prefersNarrative: 0.5,
        prefersDrill: 0.5,
        prefersVisual: 0.8, // Should detect visual style
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
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches resources from LLM when cache is empty', async () => {
    (getConcept as any).mockResolvedValue(null);
    const { resourceAgent } = await import('@/lib/agents/resource');
    const result = await resourceAgent(baseState as LearnerState);

    expect(result.curatedResources).toHaveLength(1);
    expect(result.curatedResources?.[0].title).toBe('Recursion for Beginners');
    expect(upsertConcept).toHaveBeenCalled();
  });

  it('returns cached resources if available and fresh', async () => {
    const cachedResources = [{ title: 'Cached Resource', url: 'https://cached.com', type: 'article' }];
    (getConcept as any).mockResolvedValue({
      cachedResources,
      resourcesCachedAt: { toDate: () => new Date() } // Fresh
    });

    const { resourceAgent } = await import('@/lib/agents/resource');
    const result = await resourceAgent(baseState as LearnerState);

    expect(result.curatedResources).toEqual(cachedResources);
    expect(upsertConcept).not.toHaveBeenCalled();
  });

  it('handles LLM errors gracefully', async () => {
    (getConcept as any).mockResolvedValue(null);
    const { __mockGenerateContent } = await import('@google/generative-ai') as any;
    __mockGenerateContent.mockRejectedValueOnce(new Error('LLM Error'));

    const { resourceAgent } = await import('@/lib/agents/resource');
    const result = await resourceAgent(baseState as LearnerState);

    expect(result.curatedResources).toEqual([]);
  });
});
