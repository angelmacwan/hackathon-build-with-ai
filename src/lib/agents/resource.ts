/**
 * Resource Agent — uses Gemini's built-in Google Search grounding
 * to find and curate live educational resources.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { LearnerState, CuratedResource, ResourceType, DifficultyLevel } from '@/lib/graph/state';
import { upsertConcept, getConcept } from '@/lib/firebase/firestore';

const TRUSTED_DOMAINS = [
  'youtube.com',
  'freecodecamp.org',
  'developer.mozilla.org',
  'khanacademy.org',
  'w3schools.com',
  'geeksforgeeks.org',
  'towardsdatascience.com',
  'arxiv.org',
  'coursera.org',
  'edx.org',
  'medium.com',
  'dev.to',
];

function buildSearchQuery(concept: string, depth: DifficultyLevel, style: string): string {
  const queries: Record<DifficultyLevel, string[]> = {
    beginner: [
      `${concept} explained simply for beginners`,
      `what is ${concept} easy explanation`,
    ],
    intermediate: [
      `${concept} practical tutorial with examples`,
      `how to use ${concept} in real projects`,
    ],
    advanced: [
      `${concept} advanced patterns under the hood`,
      `${concept} deep dive implementation`,
    ],
  };

  const styleQuery = style === 'visual' ? ` site:youtube.com OR` : '';
  const base = queries[depth][0];
  return `${styleQuery} ${base}`;
}

function detectDominantStyle(profile: LearnerState['learnerProfile']): string {
  if (!profile) return 'general';
  const { prefersVisual, prefersDrill, prefersAnalogy } = profile.learningStyle;
  if (prefersVisual > 0.6) return 'visual';
  if (prefersDrill > 0.6) return 'project';
  if (prefersAnalogy > 0.6) return 'analogy';
  return 'general';
}

export async function resourceAgent(state: LearnerState): Promise<Partial<LearnerState>> {
  const { teachingPlan, learnerProfile } = state;
  if (!teachingPlan) return { curatedResources: [] };

  const concept = teachingPlan.targetConcept;
  const conceptId = concept.toLowerCase().replace(/\s+/g, '_');

  // Check Firestore cache (7-day TTL)
  try {
    const cached = await getConcept(conceptId);
    if (cached?.cachedResources?.length && cached.resourcesCachedAt) {
      const cachedAt = (cached.resourcesCachedAt as any).toDate?.() ?? new Date(0);
      const ageMs = Date.now() - cachedAt.getTime();
      if (ageMs < 7 * 24 * 60 * 60 * 1000) {
        return { curatedResources: cached.cachedResources.slice(0, 5) };
      }
    }
  } catch { /* proceed with fresh search */ }

  const style = detectDominantStyle(learnerProfile);
  const searchQuery = buildSearchQuery(concept, teachingPlan.depth, style);

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} }] as any,
    });

    const scoringPrompt = `Search for the best educational resources about: "${concept}"
    
    Find resources suitable for a ${teachingPlan.depth} level learner.
    Search query to use: "${searchQuery}"
    
    After searching, return ONLY a JSON array of up to 5 resources:
    [
      {
        "title": "Resource title",
        "url": "https://...",
        "type": "article|video|documentation|paper|course|tool",
        "difficulty": "${teachingPlan.depth}",
        "estimatedMinutes": <number>,
        "whyRecommended": "One sentence explaining why this helps for this concept",
        "sourceDomain": "domain.com"
      }
    ]
    
    Prioritize: ${TRUSTED_DOMAINS.slice(0, 6).join(', ')}
    Return ONLY the JSON array, no other text.`;

    const result = await model.generateContent(scoringPrompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Extract JSON array from response
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return { curatedResources: [] };

    const resources: CuratedResource[] = JSON.parse(jsonMatch[0]);
    const validResources = resources
      .filter((r) => r.url && r.title && r.type)
      .slice(0, 5);

    // Cache in Firestore for future use
    try {
      await upsertConcept(conceptId, {
        name: concept,
        description: '',
        cluster: learnerProfile?.currentCluster ?? '',
        prerequisites: [],
        cachedResources: validResources,
      });
    } catch { /* non-critical */ }

    return { curatedResources: validResources };
  } catch {
    return { curatedResources: [] };
  }
}
