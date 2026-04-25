import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/lib/firebase/auth';
import { getLearnerProfile } from '@/lib/firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { CuratedResource } from '@/lib/graph/state';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  try {
    const uid = await verifyAuthHeader(req.headers.get('Authorization'));
    
    // Get the user's current topic/cluster
    const profile = await getLearnerProfile(uid);
    const topic = profile.currentCluster || 'Next.js web development';

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      tools: [{ googleSearch: {} }] as any,
    });

    const prompt = `Search for the best and most recent educational resources (videos, articles, documentation) about: "${topic}"

Find resources suitable for a software developer looking to learn this concept.
    
After searching, return ONLY a JSON array of up to 6 diverse resources:
[
  {
    "title": "Resource title",
    "url": "https://...",
    "type": "article|video|documentation|course",
    "difficulty": "intermediate",
    "estimatedMinutes": <number>,
    "whyRecommended": "One short sentence explaining why this helps for this concept",
    "sourceDomain": "domain.com"
  }
]

Ensure you include at least one video (e.g., youtube.com) and one article.
Return ONLY the JSON array, no other text or markdown formatting.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Failed to parse resources from model output.');
    }

    const resources: CuratedResource[] = JSON.parse(jsonMatch[0]);
    const validResources = resources
      .filter((r) => r.url && r.title && r.type)
      .slice(0, 6);

    return NextResponse.json({ resources: validResources });
  } catch (error: any) {
    console.error('Error discovering resources:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to discover resources' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
