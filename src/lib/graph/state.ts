/**
 * LearnerState — shared state flowing through all LangGraph agents.
 * All type definitions for the NeuralPath agent system.
 */
import { Annotation } from '@langchain/langgraph';

// ─── Resource Types ─────────────────────────────────────────────────────────

export type ResourceType = 'article' | 'video' | 'documentation' | 'paper' | 'course' | 'tool';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export interface CuratedResource {
  title: string;
  url: string;
  type: ResourceType;
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
  whyRecommended: string;
  sourceDomain?: string;
}

// ─── Intake Types ────────────────────────────────────────────────────────────

export type IntentType =
  | 'question'
  | 'confusion'
  | 'ready_to_advance'
  | 'off_topic'
  | 'practice_request'
  | 'emotional_frustration';

export interface IntakeResult {
  intent: IntentType;
  extractedConcepts: string[];
  confusionPoint?: string;
  shouldShortCircuit: boolean;
}

// ─── Learning Style ──────────────────────────────────────────────────────────

export interface LearningStyle {
  prefersAnalogy: number;     // 0–1 weight
  prefersSocratic: number;
  prefersNarrative: number;
  prefersDrill: number;
  prefersVisual: number;
  readingLevel: DifficultyLevel;
  pace: 'slow' | 'medium' | 'fast';
}

// ─── Knowledge Graph ─────────────────────────────────────────────────────────

export interface ConceptNode {
  concept: string;
  confidence: number;         // 0–100
  mastered: boolean;
  lastReviewed?: string;      // ISO timestamp
  nextReviewDue?: string;     // ISO timestamp (SM-2)
  cachedResources?: CuratedResource[];
}

export interface ConceptEdge {
  from: string;
  to: string;
  type: 'prerequisite' | 'related';
}

export interface KnowledgeGraph {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

// ─── Roadmap ─────────────────────────────────────────────────────────────────

export interface ConceptCluster {
  clusterId: string;
  clusterName: string;
  concepts: string[];
  status: 'locked' | 'active' | 'mastered';
}

// ─── Teaching Plan ───────────────────────────────────────────────────────────

export interface TeachingPlan {
  targetConcept: string;
  depth: DifficultyLevel;
  analogies: string[];
  priorKnowledgeToReference: string[];
  suggestedPedagogyMode: string;
}

// ─── Learner Profile ─────────────────────────────────────────────────────────

export interface LearnerProfile {
  goal: string;
  learningStyle: LearningStyle;
  currentCluster: string;
  roadmap: ConceptCluster[];
  difficultyPreference: 'gentle' | 'balanced' | 'challenging';
}

// ─── Session Message ─────────────────────────────────────────────────────────

export interface SessionMessage {
  role: 'user' | 'assistant';
  content: string;
  resources?: CuratedResource[];
  timestamp: string;
}

// ─── Evaluator Decision ──────────────────────────────────────────────────────

export type EvaluatorDecision = 'advance' | 'reinforce' | 'backtrack';

// ─── LangGraph State Annotation ──────────────────────────────────────────────

export const LearnerStateAnnotation = Annotation.Root({
  // Identity
  userId: Annotation<string>({ reducer: (_, b) => b }),
  sessionId: Annotation<string>({ reducer: (_, b) => b }),

  // Input
  userMessage: Annotation<string>({ reducer: (_, b) => b }),

  // Intake outputs
  intent: Annotation<IntentType>({ reducer: (_, b) => b }),
  extractedConcepts: Annotation<string[]>({ reducer: (_, b) => b }),
  shouldShortCircuit: Annotation<boolean>({ reducer: (_, b) => b }),
  confusionPoint: Annotation<string | undefined>({ reducer: (_, b) => b }),

  // Profile outputs
  learnerProfile: Annotation<LearnerProfile | null>({ reducer: (_, b) => b }),
  knowledgeGraph: Annotation<KnowledgeGraph | null>({ reducer: (_, b) => b }),

  // Curriculum outputs
  teachingPlan: Annotation<TeachingPlan | null>({ reducer: (_, b) => b }),

  // Resource outputs
  curatedResources: Annotation<CuratedResource[]>({ reducer: (_, b) => b }),

  // Pedagogy outputs
  response: Annotation<string>({ reducer: (_, b) => b }),
  pedagogyMode: Annotation<string>({ reducer: (_, b) => b }),

  // Evaluator outputs
  comprehensionScore: Annotation<number>({ reducer: (_, b) => b }),
  evaluatorDecision: Annotation<EvaluatorDecision>({ reducer: (_, b) => b }),

  // Session history
  sessionHistory: Annotation<SessionMessage[]>({ reducer: (_, b) => b }),
});

export type LearnerState = typeof LearnerStateAnnotation.State;
