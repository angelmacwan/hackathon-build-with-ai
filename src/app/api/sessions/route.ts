import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/lib/firebase/auth';
import { getUserSessions } from '@/lib/firebase/firestore';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const uid = await verifyAuthHeader(req.headers.get('Authorization'));
    const sessions = await getUserSessions(uid);
    return NextResponse.json({ sessions });
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch sessions' },
      { status: error.message === 'Unauthorized' ? 401 : 500 }
    );
  }
}
