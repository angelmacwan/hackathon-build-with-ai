/**
 * Learner Profile Agent — updates concept confidence and learning style.
 * Uses deterministic scoring rules; only invokes LLM for style inference.
 */
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { LearnerState, LearnerProfile, LearningStyle } from '@/lib/graph/state';
import { getLearnerProfile, getKnowledgeGraph, upsertConceptNode } from '@/lib/firebase/firestore';

const STYLE_PROMPT = `Analyze this learning conversation and detect style signals.
Return ONLY a JSON object:
{
  "prefersAnalogy": <0.0-1.0>,
  "prefersSocratic": <0.0-1.0>,
  "prefersNarrative": <0.0-1.0>,
  "prefersDrill": <0.0-1.0>,
  "prefersVisual": <0.0-1.0>,
  "readingLevel": "<beginner|intermediate|advanced>",
  "pace": "<slow|medium|fast>"
}

Signals to look for:
- "like before" / "similar to" → prefersAnalogy
- "why" / "how does" → prefersSocratic
- "tell me a story" / "real world" → prefersNarrative  
- "give me problems" / "practice" → prefersDrill
- "show me" / "diagram" / "visualize" → prefersVisual
- Vocabulary complexity → readingLevel
- Number of follow-ups before satisfaction → pace`;

export async function profileAgent(state: LearnerState): Promise<Partial<LearnerState>> {
  const { userId, userMessage, extractedConcepts, sessionHistory } = state;

  // Load current profile and knowledge graph
  const [profile, graph] = await Promise.all([
    getLearnerProfile(userId),
    getKnowledgeGraph(userId),
  ]);

  // ── Deterministic concept confidence update ──────────────────────────────
  for (const concept of extractedConcepts) {
    const existing = graph.nodes.find((n) => n.concept === concept);
    const currentConfidence = existing?.confidence ?? 0;

    // Heuristic: each mention with intent context adjusts confidence
    let delta = 0;
    if (state.intent === 'question') delta = -5;           // Still exploring
    else if (state.intent === 'confusion') delta = -10;    // Struggling
    else if (state.intent === 'ready_to_advance') delta = 15; // Confident
    else if (state.intent === 'practice_request') delta = 5;  // Testing knowledge

    const newConfidence = Math.max(0, Math.min(100, currentConfidence + delta));

    await upsertConceptNode(userId, {
      concept,
      confidence: newConfidence,
      mastered: newConfidence >= 80,
      lastReviewed: new Date().toISOString(),
      nextReviewDue: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  // ── LLM-based learning style update (lightweight) ─────────────────────────
  let updatedStyle: Partial<LearningStyle> = {};
  try {
    const llm = new ChatGoogleGenerativeAI({
      model: 'gemini-2.5-flash',
      apiKey: process.env.GEMINI_API_KEY!,
      temperature: 0.1,
    });

    const recentHistory = sessionHistory
      .slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');

    const response = await llm.invoke([
      new SystemMessage(STYLE_PROMPT),
      new HumanMessage(`Conversation:\n${recentHistory}\nLatest message: "${userMessage}"`),
    ]);

    const text = typeof response.content === 'string' ? response.content : '';
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const detected = JSON.parse(cleaned) as Partial<LearningStyle>;

    // Exponential moving average — blend detected signals with existing
    const blend = (existing: number, detected: number) =>
      Math.round((existing * 0.7 + detected * 0.3) * 100) / 100;

    updatedStyle = {
      prefersAnalogy: blend(profile.learningStyle.prefersAnalogy, detected.prefersAnalogy ?? 0.5),
      prefersSocratic: blend(profile.learningStyle.prefersSocratic, detected.prefersSocratic ?? 0.5),
      prefersNarrative: blend(profile.learningStyle.prefersNarrative, detected.prefersNarrative ?? 0.5),
      prefersDrill: blend(profile.learningStyle.prefersDrill, detected.prefersDrill ?? 0.3),
      prefersVisual: blend(profile.learningStyle.prefersVisual, detected.prefersVisual ?? 0.5),
      readingLevel: detected.readingLevel ?? profile.learningStyle.readingLevel,
      pace: detected.pace ?? profile.learningStyle.pace,
    };
  } catch {
    updatedStyle = profile.learningStyle;
  }

  const updatedProfile: LearnerProfile = {
    ...profile,
    learningStyle: { ...profile.learningStyle, ...updatedStyle },
  };

  // Reload updated graph
  const updatedGraph = await getKnowledgeGraph(userId);

  return {
    learnerProfile: updatedProfile,
    knowledgeGraph: updatedGraph,
  };
}
