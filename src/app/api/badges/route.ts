/**
 * GET /api/badges — Returns all badge info and earned status for the user.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/lib/firebase/auth';
import { getUserData } from '@/lib/firebase/firestore';
import { BADGES } from '@/lib/gamification/badges';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  let uid: string;
  try {
    uid = await verifyAuthHeader(req.headers.get('Authorization'));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userData = await getUserData(uid);
  const earnedBadgeIds: string[] = userData?.badges ?? [];

  const allBadges = Object.values(BADGES).map((badge) => ({
    ...badge,
    earned: earnedBadgeIds.includes(badge.id),
  }));

  return NextResponse.json({ badges: allBadges, earnedCount: earnedBadgeIds.length });
}
