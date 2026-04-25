/**
 * POST /api/roadmap — Generate personalized learning roadmap from a goal.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/lib/firebase/auth';
import { updateLearnerProfile, updateRoadmap } from '@/lib/firebase/firestore';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ConceptCluster, DifficultyLevel } from '@/lib/graph/state';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let uid: string;
  try {
    uid = await verifyAuthHeader(req.headers.get('Authorization'));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { goal: string; difficultyPreference?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { goal, difficultyPreference = 'balanced' } = body;
  if (!goal?.trim()) {
    return NextResponse.json({ error: 'Goal is required' }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `You are a curriculum designer. Create a structured learning roadmap for this goal: "${goal}"
  
  Difficulty preference: ${difficultyPreference}
  
  Return ONLY a valid JSON array of 5-8 concept clusters:
  [
    {
      "clusterId": "cluster_1",
      "clusterName": "Foundations",
      "concepts": ["concept1", "concept2", "concept3"],
      "status": "active"
    },
    {
      "clusterId": "cluster_2",
      "clusterName": "Core Concepts",
      "concepts": ["concept4", "concept5"],
      "status": "locked"
    }
  ]
  
  Rules:
  - First cluster is "active", rest are "locked"
  - Order clusters by dependency (prerequisites first)
  - Each cluster has 2-5 specific, learnable concepts
  - Cluster names should be descriptive phases of the learning journey
  - No markdown, just raw JSON array`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const jsonMatch = cleaned.match(/\[[\s\S]*\]/);

    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to generate roadmap' }, { status: 500 });
    }

    const roadmap: ConceptCluster[] = JSON.parse(jsonMatch[0]);

    // Save profile and roadmap to Firestore
    await Promise.all([
      updateLearnerProfile(uid, {
        goal,
        currentCluster: roadmap[0]?.clusterId ?? '',
        roadmap,
        difficultyPreference: difficultyPreference as 'gentle' | 'balanced' | 'challenging',
      }),
      updateRoadmap(uid, roadmap),
    ]);

    return NextResponse.json({ roadmap, goal });
  } catch (err) {
    console.error('Roadmap generation error:', err);
    return NextResponse.json({ error: 'Failed to generate roadmap' }, { status: 500 });
  }
}
