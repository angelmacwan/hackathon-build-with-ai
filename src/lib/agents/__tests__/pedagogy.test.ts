import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { LearnerState } from '@/lib/graph/state';

// Mock LLM
vi.mock('@langchain/google-genai', () => {
  const mockInvoke = vi.fn().mockResolvedValue({
    content: 'Mocked pedagogy response',
  });

  return {
    ChatGoogleGenerativeAI: class MockLLM {
      invoke = mockInvoke;
    },
    __mockInvoke: mockInvoke,
  };
});

describe('Pedagogy Agent', () => {
  const baseState: Partial<LearnerState> = {
    userId: 'test-uid',
    userMessage: 'Explain recursion',
    sessionHistory: [],
    intent: 'question',
    teachingPlan: {
      targetConcept: 'recursion',
      depth: 'beginner',
      analogies: ['Russian dolls'],
      priorKnowledgeToReference: [],
      suggestedPedagogyMode: 'analogy'
    },
    learnerProfile: {
      userId: 'test-uid',
      goal: 'learn coding',
      difficultyPreference: 'balanced',
      currentCluster: 'basics',
      learningStyle: {
        prefersAnalogy: 0.1,
        prefersSocratic: 0.9,
        prefersNarrative: 0.1,
        prefersDrill: 0.1,
        prefersVisual: 0.1,
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
    curatedResources: [],
    shouldShortCircuit: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('uses suggested pedagogy mode from teaching plan', async () => {
    const { pedagogyAgent } = await import('@/lib/agents/pedagogy');
    const result = await pedagogyAgent(baseState as LearnerState);

    expect(result.pedagogyMode).toBe('analogy');
  });

  it('overrides pedagogy mode for specific intents', async () => {
    const { pedagogyAgent } = await import('@/lib/agents/pedagogy');
    
    const practiceState = { ...baseState, intent: 'practice_request', teachingPlan: undefined };
    const practiceResult = await pedagogyAgent(practiceState as LearnerState);
    expect(practiceResult.pedagogyMode).toBe('drill');

    const confusionState = { ...baseState, intent: 'confusion', teachingPlan: undefined };
    const confusionResult = await pedagogyAgent(confusionState as LearnerState);
    expect(confusionResult.pedagogyMode).toBe('analogy');
  });

  it('picks highest weighted style if no suggestion or override', async () => {
    const state = { 
      ...baseState, 
      teachingPlan: { ...baseState.teachingPlan, suggestedPedagogyMode: undefined },
      intent: 'question'
    };
    const { pedagogyAgent } = await import('@/lib/agents/pedagogy');
    const result = await pedagogyAgent(state as LearnerState);

    expect(result.pedagogyMode).toBe('socratic'); // high weight in baseState
  });

  it('short-circuits for off-topic messages', async () => {
    const state = { ...baseState, shouldShortCircuit: true, intent: 'off_topic' };
    const { pedagogyAgent } = await import('@/lib/agents/pedagogy');
    const result = await pedagogyAgent(state as LearnerState);

    expect(result.response).toContain("Let's keep focused on your goal");
  });

  it('short-circuits for emotional frustration', async () => {
    const state = { ...baseState, shouldShortCircuit: true, intent: 'emotional_frustration' };
    const { pedagogyAgent } = await import('@/lib/agents/pedagogy');
    const result = await pedagogyAgent(state as LearnerState);

    expect(result.response).toContain("I hear you — learning is genuinely hard sometimes");
  });
});
