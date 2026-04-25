/**
 * Intake Agent — classifies user intent and extracts key concepts.
 * Fast, lightweight classification using Gemini structured output.
 */
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { LearnerState, IntakeResult, IntentType } from '@/lib/graph/state';

const INTENT_TYPES: IntentType[] = [
  'question',
  'confusion',
  'ready_to_advance',
  'off_topic',
  'practice_request',
  'emotional_frustration',
];

const SYSTEM_PROMPT = `You are the intake agent for NeuralPath, an adaptive learning system.
Your job is to classify the user's message and extract key information.

Respond ONLY with a valid JSON object in this exact format:
{
  "intent": "<one of: question|confusion|ready_to_advance|off_topic|practice_request|emotional_frustration>",
  "extractedConcepts": ["concept1", "concept2"],
  "confusionPoint": "<specific thing they don't understand, or null>",
  "shouldShortCircuit": <true if off_topic or emotional_frustration, else false>
}

Intent definitions:
- question: User is asking to understand something
- confusion: User expresses they don't understand something specific
- ready_to_advance: User signals mastery / wants to move forward
- off_topic: Completely unrelated to learning
- practice_request: User wants exercises or problems to solve
- emotional_frustration: User is frustrated or discouraged`;

export async function intakeAgent(state: LearnerState): Promise<Partial<LearnerState>> {
  const llm = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY!,
    temperature: 0.1,
  });

  const conversationContext = state.sessionHistory
    .slice(-4) // Last 2 exchanges
    .map((m) => `${m.role}: ${m.content}`)
    .join('\n');

  const messages = [
    new SystemMessage(SYSTEM_PROMPT),
    new HumanMessage(
      `Conversation context:\n${conversationContext}\n\nNew message: "${state.userMessage}"`
    ),
  ];

  try {
    const response = await llm.invoke(messages);
    const text = typeof response.content === 'string' ? response.content : '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result: IntakeResult = JSON.parse(cleaned);

    return {
      intent: INTENT_TYPES.includes(result.intent) ? result.intent : 'question',
      extractedConcepts: Array.isArray(result.extractedConcepts) ? result.extractedConcepts : [],
      confusionPoint: result.confusionPoint ?? undefined,
      shouldShortCircuit: Boolean(result.shouldShortCircuit),
    };
  } catch {
    // Fallback: treat as a simple question
    return {
      intent: 'question',
      extractedConcepts: [],
      shouldShortCircuit: false,
    };
  }
}
