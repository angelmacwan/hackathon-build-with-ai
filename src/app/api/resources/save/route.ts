/**
 * GET  /api/resources/save — List saved resources for the authenticated user.
 * POST /api/resources/save — Save a curated resource to personal library.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/lib/firebase/auth';
import { saveResourceToLibrary, getSavedResources } from '@/lib/firebase/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { CuratedResource } from '@/lib/graph/state';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  let uid: string;
  try {
    uid = await verifyAuthHeader(req.headers.get('Authorization'));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const resources = await getSavedResources(uid);
  return NextResponse.json({ resources });
}

export async function POST(req: NextRequest) {
  let uid: string;
  try {
    uid = await verifyAuthHeader(req.headers.get('Authorization'));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { resource: CuratedResource; conceptTag?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { resource, conceptTag } = body;
  if (!resource?.url || !resource?.title) {
    return NextResponse.json({ error: 'Resource must have a URL and title' }, { status: 400 });
  }

  await saveResourceToLibrary(uid, resource, conceptTag);

  // Award XP for saving a resource
  await adminDb.collection('users').doc(uid).update({
    xp: FieldValue.increment(10),
  });

  return NextResponse.json({ success: true });
}
