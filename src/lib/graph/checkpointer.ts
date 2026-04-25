/**
 * Firestore Checkpointer — saves LangGraph session state to Firestore.
 * Lightweight custom implementation without external checkpointer packages.
 */
import { saveSessionCheckpoint, getSessionCheckpoint } from '@/lib/firebase/firestore';
import type { LearnerState } from './state';

export class FirestoreCheckpointer {
  async put(uid: string, sessionId: string, state: Partial<LearnerState>): Promise<void> {
    await saveSessionCheckpoint(uid, sessionId, state as Record<string, unknown>);
  }

  async get(uid: string, sessionId: string): Promise<Partial<LearnerState> | null> {
    const data = await getSessionCheckpoint(uid, sessionId);
    return data as Partial<LearnerState> | null;
  }
}

export const firestoreCheckpointer = new FirestoreCheckpointer();
