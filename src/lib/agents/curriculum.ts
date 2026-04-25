/**
 * Curriculum Agent — identifies the optimal next concept using ZPD logic.
 */
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { LearnerState, TeachingPlan } from '@/lib/graph/state';

const CURRICULUM_PROMPT = `You are the curriculum agent for NeuralPath.
Given the learner's knowledge graph and current message, determine the optimal teaching plan.

Respond ONLY with a valid JSON object:
{
  "targetConcept": "<the concept to teach>",
  "depth": "<beginner|intermediate|advanced>",
  "analogies": ["<existing concept to use as analogy>"],
  "priorKnowledgeToReference": ["<concepts learner already knows>"],
  "suggestedPedagogyMode": "<socratic|analogy|narrative|drill|visual>"
}

ZPD principles:
- Target concepts with 30-70% confidence (not too easy, not too hard)
- Fill prerequisite gaps before advancing
- Match depth to learner's reading level`;

export async function curriculumAgent(state: LearnerState): Promise<Partial<LearnerState>> {
  const { learnerProfile, knowledgeGraph, userMessage, extractedConcepts } = state;

  const llm = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY!,
    temperature: 0.3,
  });

  // Summarize knowledge graph for the prompt
  const masteredConcepts = (knowledgeGraph?.nodes ?? [])
    .filter((n) => n.mastered)
    .map((n) => n.concept);

  const partialConcepts = (knowledgeGraph?.nodes ?? [])
    .filter((n) => !n.mastered && n.confidence > 0)
    .map((n) => `${n.concept} (${n.confidence}% confident)`);

  const unknownConcepts = extractedConcepts.filter(
    (c) => !(knowledgeGraph?.nodes ?? []).find((n) => n.concept === c)
  );

  const context = `
User goal: ${learnerProfile?.goal ?? 'general learning'}
Reading level: ${learnerProfile?.learningStyle?.readingLevel ?? 'beginner'}
Difficulty preference: ${learnerProfile?.difficultyPreference ?? 'balanced'}
Current message: "${userMessage}"
Mentioned concepts: ${extractedConcepts.join(', ')}
Mastered: ${masteredConcepts.join(', ') || 'none'}
Partially learned: ${partialConcepts.join(', ') || 'none'}
Unknown: ${unknownConcepts.join(', ') || 'none'}
Current roadmap cluster: ${learnerProfile?.currentCluster ?? 'not set'}
`;

  try {
    const response = await llm.invoke([
      new SystemMessage(CURRICULUM_PROMPT),
      new HumanMessage(context),
    ]);

    const text = typeof response.content === 'string' ? response.content : '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const plan: TeachingPlan = JSON.parse(cleaned);

    return { teachingPlan: plan };
  } catch {
    // Fallback: teach the first mentioned concept at beginner level
    return {
      teachingPlan: {
        targetConcept: extractedConcepts[0] ?? 'the topic',
        depth: learnerProfile?.learningStyle?.readingLevel ?? 'beginner',
        analogies: [],
        priorKnowledgeToReference: masteredConcepts.slice(0, 3),
        suggestedPedagogyMode: 'socratic',
      },
    };
  }
}
