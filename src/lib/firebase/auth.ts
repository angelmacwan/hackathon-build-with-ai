/**
 * Firebase Auth helpers — server-side token verification and user management.
 * Uses Firebase Admin SDK. Only call from API routes.
 */
import { adminAuth, adminDb } from './admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { LearnerProfile, KnowledgeGraph } from '@/lib/graph/state';

/** Verifies a Firebase ID token. Returns the decoded claims. */
export async function verifyIdToken(token: string) {
  return adminAuth.verifyIdToken(token);
}

/** Extracts and verifies the bearer token from an Authorization header. Returns uid. */
export async function verifyAuthHeader(authHeader: string | null): Promise<string> {
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header');
  }
  const token = authHeader.slice(7);
  const decoded = await verifyIdToken(token);
  return decoded.uid;
}

/** Ensures a user document exists in Firestore after first sign-in. */
export async function ensureUserDocument(
  uid: string,
  displayName: string | null,
  email: string | null,
  photoURL: string | null
): Promise<void> {
  const userRef = adminDb.collection('users').doc(uid);
  const snap = await userRef.get();

  if (!snap.exists) {
    const now = FieldValue.serverTimestamp();
    await userRef.set({
      displayName: displayName ?? 'Learner',
      email: email ?? '',
      photoURL: photoURL ?? '',
      createdAt: now,
      lastActiveAt: now,
      streakDays: 0,
      totalConceptsMastered: 0,
      xp: 0,
      level: 1,
      badges: [],
    });
  } else {
    // Update last active timestamp
    await userRef.update({ lastActiveAt: FieldValue.serverTimestamp() });
  }
}

/** Returns the default learner profile for new users. */
export function getDefaultProfile(): LearnerProfile {
  return {
    goal: '',
    learningStyle: {
      prefersAnalogy: 0.5,
      prefersSocratic: 0.5,
      prefersNarrative: 0.5,
      prefersDrill: 0.3,
      prefersVisual: 0.5,
      readingLevel: 'beginner',
      pace: 'medium',
    },
    currentCluster: '',
    roadmap: [],
    difficultyPreference: 'balanced',
  };
}

/** Returns the default empty knowledge graph for new users. */
export function getDefaultKnowledgeGraph(): KnowledgeGraph {
  return { nodes: [], edges: [] };
}
