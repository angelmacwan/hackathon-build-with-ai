/**
 * Pedagogy Agent — chooses delivery mode and generates the explanation.
 * Weaves curated resources naturally into the response.
 */
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { LearnerState } from '@/lib/graph/state';

type PedagogyMode = 'socratic' | 'analogy' | 'narrative' | 'drill' | 'visual';

function selectPedagogyMode(state: LearnerState): PedagogyMode {
  const { learnerProfile, intent, teachingPlan } = state;
  const style = learnerProfile?.learningStyle;

  if (!style) return 'socratic';

  // Intent overrides
  if (intent === 'practice_request') return 'drill';
  if (intent === 'confusion') return 'analogy'; // Confusion → try analogies

  // Use suggested mode if provided
  if (teachingPlan?.suggestedPedagogyMode) {
    return teachingPlan.suggestedPedagogyMode as PedagogyMode;
  }

  // Pick highest-weighted style
  const weights: Record<PedagogyMode, number> = {
    socratic: style.prefersSocratic,
    analogy: style.prefersAnalogy,
    narrative: style.prefersNarrative,
    drill: style.prefersDrill,
    visual: style.prefersVisual,
  };

  return (Object.entries(weights).sort(([, a], [, b]) => b - a)[0][0] as PedagogyMode);
}

function buildSystemPrompt(mode: PedagogyMode, state: LearnerState): string {
  const { teachingPlan, learnerProfile, curatedResources } = state;
  const level = teachingPlan?.depth ?? 'beginner';
  const concept = teachingPlan?.targetConcept ?? 'the topic';
  const analogies = teachingPlan?.analogies?.join(', ') ?? '';
  const priorKnowledge = teachingPlan?.priorKnowledgeToReference?.join(', ') ?? '';

  const resourceList =
    curatedResources.length > 0
      ? curatedResources
          .slice(0, 3)
          .map(
            (r) =>
              `- ${r.type === 'video' ? '🎥' : r.type === 'article' ? '📄' : r.type === 'documentation' ? '📘' : '🔬'} [${r.title}](${r.url}) — ${r.whyRecommended} (~${r.estimatedMinutes} min)`
          )
          .join('\n')
      : 'No external resources available.';

  const modeInstructions: Record<PedagogyMode, string> = {
    socratic: `Use the Socratic method — guide discovery through questions. Don't give the answer directly. Ask 1-2 probing questions to help the learner figure it out themselves. End with a targeted follow-up question.`,
    analogy: `Explain using analogies and comparisons. Map the new concept (${concept}) to something the learner already knows (${analogies || 'everyday objects or experiences'}). Use "This is like..." phrasing. End with a follow-up question.`,
    narrative: `Wrap the explanation in a real-world story or scenario. Make it concrete and relatable. Use actual examples from software, science, history, or daily life. End with a Socratic follow-up.`,
    drill: `Give the learner 2-3 progressive practice exercises or coding problems. Start easy, increase complexity. Explain what each exercise tests. Encourage them to attempt before revealing answers.`,
    visual: `Use ASCII diagrams, mermaid diagram code blocks, or step-by-step visual breakdowns to explain the concept. Structure information spatially. Use tables or formatted lists.`,
  };

  return `You are NeuralPath's pedagogy agent — a world-class adaptive tutor.

CONCEPT TO TEACH: "${concept}"
LEARNER LEVEL: ${level}
TEACHING MODE: ${mode}
PRIOR KNOWLEDGE: ${priorKnowledge || 'none documented'}

TEACHING INSTRUCTION: ${modeInstructions[mode]}

CURATED RESOURCES (naturally weave 1-2 of these into your response at the right moment):
${resourceList}

RULES:
- Adjust vocabulary to ${level} level — no unnecessary jargon for beginners
- Be concise but thorough (aim for 300-500 words unless drill mode)
- Format with Markdown for clarity
- Naturally embed resources inline — don't just list them at the end
- ALWAYS end with a follow-up question to check understanding
- If the learner seems frustrated, be encouraging and empathetic first`;
}

export async function pedagogyAgent(state: LearnerState): Promise<Partial<LearnerState>> {
  const mode = selectPedagogyMode(state);

  // Short-circuit response for off-topic / emotional messages
  if (state.shouldShortCircuit) {
    let shortResponse: string;

    if (state.intent === 'off_topic') {
      shortResponse = `I'm here to help you learn! Let's keep focused on your goal: **${state.learnerProfile?.goal ?? 'your learning journey'}**. What would you like to explore next in that area?`;
    } else if (state.intent === 'emotional_frustration') {
      shortResponse = `I hear you — learning is genuinely hard sometimes, and it's completely normal to feel frustrated. 💙 

Take a breath. You've already shown you care by being here.

Let's try a different approach. What specifically feels unclear? Sometimes just naming the stuck point is enough to unstick it.`;
    } else {
      shortResponse = `Let's refocus on your learning goals. What would you like to explore?`;
    }

    return { response: shortResponse, pedagogyMode: mode };
  }

  const llm = new ChatGoogleGenerativeAI({
    model: 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY!,
    temperature: 0.7,
  });

  const systemPrompt = buildSystemPrompt(mode, state);

  // Build conversation history for context
  const historyMessages = state.sessionHistory
    .slice(-6)
    .map((m) =>
      m.role === 'user'
        ? new HumanMessage(m.content)
        : new SystemMessage(`Assistant said: ${m.content}`)
    );

  const messages = [
    new SystemMessage(systemPrompt),
    ...historyMessages,
    new HumanMessage(state.userMessage),
  ];

  try {
    const response = await llm.invoke(messages);
    const text = typeof response.content === 'string' ? response.content : '';
    return { response: text, pedagogyMode: mode };
  } catch (e) {
    return {
      response: `I'm having trouble generating a response right now. Please try again in a moment.`,
      pedagogyMode: mode,
    };
  }
}
