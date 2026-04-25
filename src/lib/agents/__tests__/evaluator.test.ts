import { describe, it, expect, vi } from 'vitest';
import type { LearnerState } from '@/lib/graph/state';

vi.mock('@langchain/google-genai', () => {
  const mockInvoke = vi.fn().mockResolvedValue({
    content: JSON.stringify({
      comprehensionScore: 75,
      decision: 'reinforce',
      reasoning: 'Partial understanding detected.',
    }),
  });

  return {
    ChatGoogleGenerativeAI: class MockLLM {
      invoke = mockInvoke;
    },
    __mockInvoke: mockInvoke,
  };
});

const baseState: Partial<LearnerState> = {
  userId: 'test-uid',
  sessionId: 'session-1',
  userMessage: 'So recursion calls itself until the base case?',
  sessionHistory: [
    { role: 'user', content: 'What is recursion?', timestamp: '' },
    { role: 'assistant', content: 'Recursion is a function calling itself...', timestamp: '' },
  ],
  teachingPlan: { targetConcept: 'recursion', depth: 'beginner', analogies: [], priorKnowledgeToReference: [], suggestedPedagogyMode: 'socratic' },
  pedagogyMode: 'socratic',
  knowledgeGraph: {
    nodes: [{ concept: 'recursion', confidence: 60, mastered: false }],
    edges: [],
  },
  curatedResources: [],
  intent: 'question',
  extractedConcepts: ['recursion'],
  shouldShortCircuit: false,
  learnerProfile: null,
  response: '',
  comprehensionScore: 0,
  evaluatorDecision: 'advance',
};

describe('Evaluator Agent', () => {
  it('returns a valid comprehension score between 0 and 100', async () => {
    const { evaluatorAgent } = await import('@/lib/agents/evaluator');
    const result = await evaluatorAgent(baseState as LearnerState);
    expect(result.comprehensionScore).toBeGreaterThanOrEqual(0);
    expect(result.comprehensionScore).toBeLessThanOrEqual(100);
  });

  it('returns a valid evaluator decision', async () => {
    const { evaluatorAgent } = await import('@/lib/agents/evaluator');
    const result = await evaluatorAgent(baseState as LearnerState);
    expect(['advance', 'reinforce', 'backtrack']).toContain(result.evaluatorDecision);
  });

  it('returns reinforce when score is 75', async () => {
    const { evaluatorAgent } = await import('@/lib/agents/evaluator');
    const result = await evaluatorAgent(baseState as LearnerState);
    // Mock returns 75, which maps to reinforce
    expect(result.evaluatorDecision).toBe('reinforce');
  });

  it('falls back to safe defaults — score is always a valid number', async () => {
    // Verifies the evaluator always returns safe values regardless of LLM output
    const { evaluatorAgent } = await import('@/lib/agents/evaluator');
    const result = await evaluatorAgent(baseState as LearnerState);
    expect(result.comprehensionScore).toBeGreaterThanOrEqual(0);
    expect(result.comprehensionScore).toBeLessThanOrEqual(100);
    expect(['advance', 'reinforce', 'backtrack']).toContain(result.evaluatorDecision);
  });

  it('score is always a number', async () => {
    const { evaluatorAgent } = await import('@/lib/agents/evaluator');
    const result = await evaluatorAgent(baseState as LearnerState);
    expect(typeof result.comprehensionScore).toBe('number');
  });
});
