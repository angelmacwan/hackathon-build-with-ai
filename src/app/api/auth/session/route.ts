/**
 * POST /api/auth/session — Verify Firebase ID token and create/update user record.
 * Called client-side after Google Sign-In to establish server-side user data.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken, ensureUserDocument } from '@/lib/firebase/auth';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: { idToken: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { idToken } = body;
  if (!idToken) {
    return NextResponse.json({ error: 'idToken is required' }, { status: 400 });
  }

  try {
    const decoded = await verifyIdToken(idToken);
    const { uid, name, email, picture } = decoded;

    await ensureUserDocument(uid, name ?? null, email ?? null, picture ?? null);

    return NextResponse.json({ uid, displayName: name, email, photoURL: picture });
  } catch (err) {
    console.error('Auth session error:', err);
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}
