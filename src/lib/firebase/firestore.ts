/**
 * Firestore CRUD helpers — typed access to all NeuralPath collections.
 * Server-side helpers use adminDb; client queries should use the client SDK directly.
 * All queries use simple single-field filters to avoid composite index requirements.
 */
import { adminDb } from './admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type {
  LearnerProfile,
  KnowledgeGraph,
  ConceptNode,
  CuratedResource,
  ConceptCluster,
  SessionMessage,
} from '@/lib/graph/state';
import { getDefaultProfile, getDefaultKnowledgeGraph } from './auth';

// ─── User Document ────────────────────────────────────────────────────────────

export interface UserData {
  displayName: string;
  email: string;
  photoURL: string;
  createdAt: Timestamp | FieldValue;
  lastActiveAt: Timestamp | FieldValue;
  streakDays: number;
  totalConceptsMastered: number;
  xp: number;
  level: number;
  badges: string[];
}

export async function getUserData(uid: string): Promise<UserData | null> {
  const snap = await adminDb.collection('users').doc(uid).get();
  return snap.exists ? (snap.data() as UserData) : null;
}

export async function updateUserData(uid: string, data: Partial<UserData>): Promise<void> {
  await adminDb.collection('users').doc(uid).update({
    ...data,
    lastActiveAt: FieldValue.serverTimestamp(),
  });
}

// ─── Learner Profile ──────────────────────────────────────────────────────────

export async function getLearnerProfile(uid: string): Promise<LearnerProfile> {
  const snap = await adminDb.collection('users').doc(uid).collection('profile').doc('main').get();
  return snap.exists ? (snap.data() as LearnerProfile) : getDefaultProfile();
}

export async function updateLearnerProfile(uid: string, data: Partial<LearnerProfile>): Promise<void> {
  await adminDb
    .collection('users')
    .doc(uid)
    .collection('profile')
    .doc('main')
    .set(data, { merge: true });
}

// ─── Knowledge Graph ─────────────────────────────────────────────────────────

export async function getKnowledgeGraph(uid: string): Promise<KnowledgeGraph> {
  const snap = await adminDb
    .collection('users')
    .doc(uid)
    .collection('knowledgeGraph')
    .doc('main')
    .get();
  return snap.exists ? (snap.data() as KnowledgeGraph) : getDefaultKnowledgeGraph();
}

export async function updateKnowledgeGraph(uid: string, graph: KnowledgeGraph): Promise<void> {
  await adminDb
    .collection('users')
    .doc(uid)
    .collection('knowledgeGraph')
    .doc('main')
    .set(graph, { merge: false });
}

export async function upsertConceptNode(uid: string, node: ConceptNode): Promise<void> {
  const graph = await getKnowledgeGraph(uid);
  const existingIdx = graph.nodes.findIndex((n) => n.concept === node.concept);
  if (existingIdx >= 0) {
    graph.nodes[existingIdx] = { ...graph.nodes[existingIdx], ...node };
  } else {
    graph.nodes.push(node);
  }
  await updateKnowledgeGraph(uid, graph);
}

// ─── Sessions ────────────────────────────────────────────────────────────────

export interface SessionData {
  startedAt: Timestamp | FieldValue;
  endedAt?: Timestamp | FieldValue;
  conceptFocus: string;
  messages: SessionMessage[];
  comprehensionScore: number;
  evaluatorDecision: string;
}

export async function createSession(uid: string, conceptFocus: string): Promise<string> {
  const ref = await adminDb
    .collection('users')
    .doc(uid)
    .collection('sessions')
    .add({
      startedAt: FieldValue.serverTimestamp(),
      conceptFocus,
      messages: [],
      comprehensionScore: 0,
      evaluatorDecision: 'advance',
    });
  return ref.id;
}

export async function updateSessionMessages(
  uid: string,
  sessionId: string,
  messages: SessionMessage[],
  comprehensionScore: number,
  evaluatorDecision: string
): Promise<void> {
  await adminDb
    .collection('users')
    .doc(uid)
    .collection('sessions')
    .doc(sessionId)
    .update({
      messages,
      comprehensionScore,
      evaluatorDecision,
      endedAt: FieldValue.serverTimestamp(),
    });
}

// ─── Session Checkpoint ──────────────────────────────────────────────────────

export async function saveSessionCheckpoint(
  uid: string,
  sessionId: string,
  state: Record<string, unknown>
): Promise<void> {
  await adminDb
    .collection('users')
    .doc(uid)
    .collection('sessions')
    .doc(sessionId)
    .collection('checkpoint')
    .doc('latest')
    .set({ state, updatedAt: FieldValue.serverTimestamp() });
}

export async function getSessionCheckpoint(
  uid: string,
  sessionId: string
): Promise<Record<string, unknown> | null> {
  const snap = await adminDb
    .collection('users')
    .doc(uid)
    .collection('sessions')
    .doc(sessionId)
    .collection('checkpoint')
    .doc('latest')
    .get();
  return snap.exists ? (snap.data()!.state as Record<string, unknown>) : null;
}

// ─── Concepts (shared, admin-write-only) ─────────────────────────────────────

export interface ConceptDocument {
  name: string;
  description: string;
  cluster: string;
  prerequisites: string[];
  cachedResources: CuratedResource[];
  resourcesCachedAt?: Timestamp;
}

export async function getConcept(conceptId: string): Promise<ConceptDocument | null> {
  const snap = await adminDb.collection('concepts').doc(conceptId).get();
  return snap.exists ? (snap.data() as ConceptDocument) : null;
}

export async function upsertConcept(
  conceptId: string,
  data: Partial<ConceptDocument>
): Promise<void> {
  await adminDb.collection('concepts').doc(conceptId).set(data, { merge: true });
}

// ─── Saved Resources ─────────────────────────────────────────────────────────

export interface SavedResource extends CuratedResource {
  savedAt: Timestamp | FieldValue;
  completed: boolean;
  conceptTag?: string;
}

export async function saveResourceToLibrary(
  uid: string,
  resource: CuratedResource,
  conceptTag?: string
): Promise<void> {
  await adminDb.collection('users').doc(uid).collection('savedResources').add({
    ...resource,
    savedAt: FieldValue.serverTimestamp(),
    completed: false,
    conceptTag: conceptTag ?? '',
  });
}

export async function getSavedResources(uid: string): Promise<SavedResource[]> {
  // Simple query without orderBy to avoid index requirements
  const snap = await adminDb.collection('users').doc(uid).collection('savedResources').get();
  return snap.docs.map((d) => d.data() as SavedResource);
}

// ─── Certificates ────────────────────────────────────────────────────────────

export interface Certificate {
  userId: string;
  concept: string;
  clusterId: string;
  issuedAt: Timestamp | FieldValue;
  storageUrl: string;
  shareToken: string;
}

export async function createCertificate(cert: Omit<Certificate, 'issuedAt'>): Promise<string> {
  const ref = await adminDb.collection('certificates').add({
    ...cert,
    issuedAt: FieldValue.serverTimestamp(),
  });
  return ref.id;
}

// ─── Roadmap Helpers ─────────────────────────────────────────────────────────

export async function updateRoadmap(uid: string, roadmap: ConceptCluster[]): Promise<void> {
  await adminDb
    .collection('users')
    .doc(uid)
    .collection('profile')
    .doc('main')
    .set({ roadmap }, { merge: true });
}
