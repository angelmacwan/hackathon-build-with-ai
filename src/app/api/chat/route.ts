/**
 * POST /api/chat — Streaming LangGraph invocation.
 * Verifies Firebase ID token, runs the 6-agent pipeline, streams response via SSE.
 */
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthHeader } from '@/lib/firebase/auth';
import { runLearnerGraph } from '@/lib/graph/learnerGraph';
import { getLearnerProfile, getKnowledgeGraph, updateSessionMessages, createSession } from '@/lib/firebase/firestore';
import { firestoreCheckpointer } from '@/lib/graph/checkpointer';
import { checkBadgeUnlocks } from '@/lib/gamification/badges';
import { XP_VALUES, calculateBadgeXP } from '@/lib/gamification/xp';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { SessionMessage } from '@/lib/graph/state';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  // ── 1. Auth verification ─────────────────────────────────────────────────
  let uid: string;
  try {
    uid = await verifyAuthHeader(req.headers.get('Authorization'));
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── 2. Parse request body ─────────────────────────────────────────────────
  let body: { message: string; sessionId?: string; sessionHistory?: SessionMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { message, sessionHistory = [] } = body;
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  // ── 3. Load or create session ─────────────────────────────────────────────
  let sessionId = body.sessionId;
  const [learnerProfile, knowledgeGraph] = await Promise.all([
    getLearnerProfile(uid),
    getKnowledgeGraph(uid),
  ]);

  const currentConcept = learnerProfile.currentCluster || 'introduction';

  if (!sessionId) {
    sessionId = await createSession(uid, currentConcept);
  }

  // ── 4. Run LangGraph pipeline ─────────────────────────────────────────────
  let finalState;
  try {
    finalState = await runLearnerGraph({
      userId: uid,
      sessionId,
      userMessage: message,
      sessionHistory,
      learnerProfile,
      knowledgeGraph,
      extractedConcepts: [],
      curatedResources: [],
      evaluatorDecision: 'advance',
      comprehensionScore: 50,
      intent: 'question',
      shouldShortCircuit: false,
      response: '',
      pedagogyMode: 'socratic',
      teachingPlan: null,
    });
  } catch (err) {
    console.error('LangGraph error:', err);
    return NextResponse.json({ error: 'AI pipeline error' }, { status: 500 });
  }

  // ── 5. Persist checkpoint & session ──────────────────────────────────────
  const updatedHistory: SessionMessage[] = [
    ...sessionHistory,
    { role: 'user', content: message, timestamp: new Date().toISOString() },
    {
      role: 'assistant',
      content: finalState.response,
      resources: finalState.curatedResources,
      timestamp: new Date().toISOString(),
    },
  ];

  await Promise.all([
    firestoreCheckpointer.put(uid, sessionId, finalState),
    updateSessionMessages(
      uid,
      sessionId,
      updatedHistory,
      finalState.comprehensionScore,
      finalState.evaluatorDecision
    ),
  ]);

  // ── 6. Gamification — check badges & award XP ─────────────────────────────
  try {
    const userRef = adminDb.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data() ?? {};
    const currentBadges: string[] = userData.badges ?? [];
    const currentXP: number = userData.xp ?? 0;
    const totalConceptsMastered: number = userData.totalConceptsMastered ?? 0;
    const streakDays: number = userData.streakDays ?? 0;
    const totalSessions: number = (userData.totalSessions ?? 0) + 1;

    const masteredInSession =
      finalState.comprehensionScore >= 80 &&
      finalState.evaluatorDecision === 'advance';

    const newBadges = checkBadgeUnlocks({
      totalSessions,
      streakDays,
      totalConceptsMastered: masteredInSession ? totalConceptsMastered + 1 : totalConceptsMastered,
      roadmapCompleted: false,
      masteredInSingleSession: masteredInSession && totalSessions === 1,
      totalQuestions: totalSessions,
      savedResourcesCount: 0,
      currentBadges,
    });

    let xpGained = XP_VALUES.SESSION_COMPLETED;
    if (masteredInSession) xpGained += XP_VALUES.CONCEPT_MASTERED;
    xpGained += calculateBadgeXP(newBadges);

    const updates: Record<string, unknown> = {
      xp: FieldValue.increment(xpGained),
      totalSessions: FieldValue.increment(1),
      lastActiveAt: FieldValue.serverTimestamp(),
    };

    if (masteredInSession) {
      updates.totalConceptsMastered = FieldValue.increment(1);
    }

    if (newBadges.length > 0) {
      updates.badges = [...currentBadges, ...newBadges];
    }

    await userRef.update(updates);

    // ── 7. Stream response back ───────────────────────────────────────────────
    const responsePayload = {
      response: finalState.response,
      resources: finalState.curatedResources,
      sessionId,
      comprehensionScore: finalState.comprehensionScore,
      evaluatorDecision: finalState.evaluatorDecision,
      pedagogyMode: finalState.pedagogyMode,
      newBadges,
      xpGained,
    };

    return NextResponse.json(responsePayload);
  } catch (err) {
    console.error('Gamification error (non-critical):', err);
    // Return response even if gamification fails
    return NextResponse.json({
      response: finalState.response,
      resources: finalState.curatedResources,
      sessionId,
      comprehensionScore: finalState.comprehensionScore,
      evaluatorDecision: finalState.evaluatorDecision,
      pedagogyMode: finalState.pedagogyMode,
      newBadges: [],
      xpGained: XP_VALUES.SESSION_COMPLETED,
    });
  }
}
