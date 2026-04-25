/**
 * Evaluator Agent — silently scores comprehension and decides next steps.
 */
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { LearnerState, EvaluatorDecision } from '@/lib/graph/state';

const EVALUATOR_PROMPT = `You are a silent comprehension evaluator for NeuralPath.
Analyze the learner's messages and score their understanding of the target concept.

Return ONLY a JSON object:
{
  "comprehensionScore": <0-100>,
  "decision": "advance|reinforce|backtrack",
  "reasoning": "<brief explanation>"
}

Scoring criteria:
- 80-100 (advance): Learner can re-explain concept, asks deeper questions, demonstrates application
- 50-79 (reinforce): Partial understanding, some correct answers, some gaps
- 0-49 (backtrack): Fundamental confusion, prerequisite gaps, repeated same confusion

Decision rules:
- advance (score ≥ 80): Move to next concept in roadmap
- reinforce (50-79): Stay on concept, try different pedagogy mode
- backtrack (< 50): Find and teach missing prerequisite first`;

export async function evaluatorAgent(state: LearnerState): Promise<Partial<LearnerState>> {
  const { teachingPlan, sessionHistory, userMessage, knowledgeGraph } = state;

  const llm = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY!,
    temperature: 0.1,
  });

  // Get existing confidence for this concept from knowledge graph
  const conceptNode = (knowledgeGraph?.nodes ?? []).find(
    (n) => n.concept === teachingPlan?.targetConcept
  );
  const priorConfidence = conceptNode?.confidence ?? 50;

  const recentHistory = sessionHistory
    .slice(-8)
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const context = `
Target concept: ${teachingPlan?.targetConcept ?? 'unknown'}
Prior confidence: ${priorConfidence}%
Teaching mode used: ${state.pedagogyMode}
Recent conversation:
${recentHistory}
Latest user message: "${userMessage}"
`;

  try {
    const response = await llm.invoke([
      new SystemMessage(EVALUATOR_PROMPT),
      new HumanMessage(context),
    ]);

    const text = typeof response.content === 'string' ? response.content : '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(cleaned);

    const score = Math.max(0, Math.min(100, Number(result.comprehensionScore) || 50));
    const validDecisions: EvaluatorDecision[] = ['advance', 'reinforce', 'backtrack'];
    const decision: EvaluatorDecision = validDecisions.includes(result.decision)
      ? result.decision
      : score >= 80
      ? 'advance'
      : score >= 50
      ? 'reinforce'
      : 'backtrack';

    return {
      comprehensionScore: score,
      evaluatorDecision: decision,
    };
  } catch {
    // Safe fallback: reinforce (don't advance or backtrack on error)
    return {
      comprehensionScore: 50,
      evaluatorDecision: 'reinforce',
    };
  }
}
