/**
 * GET /api/profile — Returns full learner profile
 * PATCH /api/profile — Updates learner profile fields
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/lib/firebase/auth';
import { getLearnerProfile, updateLearnerProfile, getUserData, getKnowledgeGraph } from '@/lib/firebase/firestore';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  let uid: string;
  try {
    uid = await verifyAuthHeader(req.headers.get('Authorization'));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [profile, userData, knowledgeGraph] = await Promise.all([
    getLearnerProfile(uid),
    getUserData(uid),
    getKnowledgeGraph(uid),
  ]);

  return NextResponse.json({ profile, userData, knowledgeGraph });
}

export async function PATCH(req: NextRequest) {
  let uid: string;
  try {
    uid = await verifyAuthHeader(req.headers.get('Authorization'));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  // Allowlist of updatable fields to prevent data injection
  const allowed = ['goal', 'difficultyPreference', 'currentCluster'];
  const sanitized = Object.fromEntries(
    Object.entries(body).filter(([key]) => allowed.includes(key))
  );

  await updateLearnerProfile(uid, sanitized);
  return NextResponse.json({ success: true });
}
