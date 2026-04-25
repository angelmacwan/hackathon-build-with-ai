
Use firebase for DB and auth.
use login with google for login and signup
DO NOT CREATE INDEX FOR FIREBASE DB
Also store uploaded docs to firebase object storage 
```
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCQz1Fz1uJhCmkTTcaDcx1XpTF5EMkJ_vA",
  authDomain: "build-with-ai-e2358.firebaseapp.com",
  projectId: "build-with-ai-e2358",
  storageBucket: "build-with-ai-e2358.firebasestorage.app",
  messagingSenderId: "949995634094",
  appId: "1:949995634094:web:3b66c555dbb28b86c49c3f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
```

Have proper user management, No data leaks
use google login to login and signup

Follow good coding practices
Proper securuty is also needed

Make sure we have good accessability throughout the app


# NeuralPath — Adaptive Learning Intelligence System
### Feature & Architecture Document v2.0

---

## Vision

**NeuralPath** is an AI-powered personalized learning assistant built with Next.js that uses a multi-agent LangGraph architecture to understand how *you* learn — not just what you're trying to learn. It doesn't teach subjects. It teaches *you*, adapting every explanation, exercise, and curated resource to your pace, background, and cognitive style.

Every response is backed by **live Google Search** — so users always get the most up-to-date articles, videos, papers, and tools, hand-picked by the Resource Agent for exactly where they are in their learning journey.


## System Architecture

### Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend & API Routes | Next.js 14 (App Router) | UI, server-side API handlers, streaming |
| AI Orchestration | LangGraph + LangChain (JS) | Stateful multi-agent graph, tool calling |
| LLM | gemini-3-flash-preview  | Primary LLM for all agents |
| Auth | Firebase Authentication | Google, email/password, magic link sign-in |
| Database | Firebase Firestore | Learner profiles, sessions, knowledge graph, roadmaps |
| File Storage | Firebase Storage | Uploaded PDFs, user-generated content, certificates |
| Web Search | Using GeminiAPI tool, it has this inbuilt | Real-time resource curation per concept |
| Streaming | LangChain streaming + Next.js Route Handlers | Token-by-token response streaming to UI |


## LangGraph Agent Architecture

NeuralPath uses a **graph of 6 specialized agents** that pass a shared `LearnerState` object between them on every user interaction. The graph is compiled once and invoked per session, with Firestore acting as the persistent checkpointer between turns.

```
User Input
    │
    ▼
┌──────────────────┐
│   INTAKE AGENT   │  ← Classifies intent, detects confusion signals
└────────┬─────────┘
         │
    ┌────▼─────────┐
    │ PROFILE AGENT │  ← Updates learner model (knowledge graph, pace, style)
    └────┬──────────┘
         │
    ┌────▼──────────────┐
    │ CURRICULUM AGENT  │  ← Identifies next concept, maps knowledge gaps
    └────┬──────────────┘
         │
    ┌────▼──────────────┐
    │  RESOURCE AGENT   │  ← Google Search → curates articles, videos, papers
    └────┬──────────────┘
         │
    ┌────▼─────────────┐
    │ PEDAGOGY AGENT   │  ← Chooses delivery mode, weaves resources into response
    └────┬─────────────┘
         │
    ┌────▼──────────────┐
    │ EVALUATOR AGENT   │  ← Scores comprehension, decides advance/reinforce/retry
    └────┬──────────────┘
         │
         ▼
  Streamed Response to User
  (explanation + curated resources + follow-up question)
```

Each agent is a **LangGraph node** implemented as a LangChain `RunnableSequence` with Gemini as the backbone LLM. Conditional edges between nodes allow the graph to loop back (e.g. Evaluator decides to reinforce → jumps back to Pedagogy) or short-circuit (Intake detects off-topic → direct response without full pipeline).

---

## Agent Descriptions

### 1. Intake Agent
**Model**: gemini-3-flash-preview (fast, cheap — used for classification only)

- Classifies every user message into one of: `question`, `confusion`, `ready_to_advance`, `off_topic`, `practice_request`, `emotional_frustration`
- Extracts the key concepts being referenced in the message
- Detects signals of genuine understanding vs surface-level pattern matching
- Outputs a structured `IntakeResult` that routes the graph's next step

```typescript
// Intake Agent output type
interface IntakeResult {
  intent: "question" | "confusion" | "ready_to_advance" | "off_topic" | "practice_request" | "emotional_frustration";
  extractedConcepts: string[];
  confusionPoint?: string;   // specific thing they don't understand
  shouldShortCircuit: boolean; // skip full pipeline?
}
```

### 2. Learner Profile Agent
**Model**: gemini-3-flash-preview

- Reads the current `LearnerProfile` from Firestore
- Updates **concept confidence scores** (0–100) based on the quality of this interaction
- Detects and updates **learning style signals**:
  - Does the user ask for examples → `prefersAnalogy` weight increases
  - Do they respond better to step-by-step? → `prefersNarrative` weight increases
  - Do they skip explanations and ask "just show me" → `prefersDrill` weight increases
- Writes updated profile back to Firestore before proceeding
- No LLM call needed for simple updates — uses deterministic scoring rules; LLM only invoked to infer style from natural language patterns

### 3. Curriculum Agent
**Model**: gemini-3-flash-preview

- Reads the learner's full knowledge graph from Firestore
- Identifies **concept gaps** — prerequisites of the current goal that have low confidence
- Determines the optimal next concept using Zone of Proximal Development logic: not too easy (already mastered), not too hard (missing 2+ prerequisites)
- Generates a short `teachingPlan` — what to explain, what analogies to lean on, what prior knowledge to reference
- Can dynamically skip clusters if the learner demonstrates existing knowledge through conversation

### 4. Resource Agent ⭐ (New)
**Model**: gemini-3-flash-preview + Google Custom Search API

This is what separates NeuralPath from any closed knowledge base. Instead of serving static content, the Resource Agent goes to the live web on every concept and curates the best learning materials for *this learner's level*.

**How it works:**

1. Receives the `teachingPlan` from the Curriculum Agent — which concept, at what depth, for what skill level
2. Constructs targeted search queries tailored to the learner's level:
   - Beginner: `"explain [concept] for beginners site:youtube.com OR site:freecodecamp.org"`
   - Intermediate: `"[concept] deep dive tutorial"`
   - Advanced: `"[concept] research paper OR implementation"`
3. Calls the **Google Custom Search API** (configured to search across trusted educational domains: MDN, YouTube, freeCodeCamp, Khan Academy, ArXiv, official docs, etc.)
4. Uses Gemini to **score and filter** results: relevance to the concept, appropriate difficulty, recency, source quality
5. Outputs a ranked `ResourceList`:

```typescript
interface CuratedResource {
  title: string;
  url: string;
  type: "article" | "video" | "documentation" | "paper" | "course" | "tool";
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  whyRecommended: string;  // e.g. "Covers closures with visual diagrams — matches your visual learning style"
}
```

6. Resources are stored in Firestore against the concept node so repeat learners don't re-fetch

**Trusted domain configuration (Google Custom Search Engine):**
- YouTube, freeCodeCamp, MDN Web Docs, Khan Academy, W3Schools, GeeksforGeeks, Towards Data Science, ArXiv, official language/framework docs, Coursera, edX

### 5. Pedagogy Agent
**Model**: gemini-3-flash-preview

- Receives: `teachingPlan` + `CuratedResource[]` + `LearnerProfile`
- Chooses the delivery mode based on the learner's detected style:
  - **Socratic mode** — guides discovery through questions
  - **Analogy mode** — maps the new concept to something already in the knowledge graph
  - **Narrative mode** — wraps the concept in a story or real-world scenario
  - **Drill mode** — immediate practice exercises
  - **Visual mode** — generates mermaid diagrams or ASCII visuals inline
- Generates the explanation, then **naturally weaves in 2–3 curated resources** at the right moment (e.g. "Here's a 6-minute video from Fireship that shows exactly this in action: [link]")
- Adjusts reading level, technical depth, use of jargon, and response length to match the learner

### 6. Evaluator Agent
**Model**: gemini-3-flash-preview

- Silently scores the learner's comprehension (0–100) based on:
  - Quality and depth of follow-up questions
  - Whether the learner can re-explain the concept in their own words
  - Accuracy of answers to embedded Socratic questions
  - Session history patterns (repeated confusion on same concept = lower score)
- Decision output:
  - **advance** (score ≥ 80): move to next concept in roadmap
  - **reinforce** (score 50–79): stay on concept, try different pedagogy mode
  - **backtrack** (score < 50): identify missing prerequisite, teach that first
- When a full concept cluster is mastered: generates a **mastery certificate** (PDF stored in Firebase Storage, shareable link)

---

## Firebase Data Architecture

### Firestore Collections

```
/users/{uid}
  - email, displayName, photoURL
  - createdAt, lastActiveAt
  - streakDays, totalConceptsMastered

/users/{uid}/profile
  - goal: string
  - learningStyle: { prefersAnalogy, prefersSocratic, prefersNarrative, prefersDrill, pace, readingLevel }
  - currentCluster: string
  - roadmap: ConceptCluster[]

/users/{uid}/knowledgeGraph
  - nodes: Array<{ concept, confidence, mastered, lastReviewed, nextReviewDue }>
  - edges: Array<{ from, to, type }>

/users/{uid}/sessions/{sessionId}
  - startedAt, endedAt
  - conceptFocus: string
  - messages: Message[]           ← full conversation history
  - comprehensionScore: number
  - evaluatorDecision: string

/concepts/{conceptId}
  - name, description, cluster, prerequisites[]
  - cachedResources: CuratedResource[]   ← re-used across users
  - resourcesCachedAt: Timestamp

/certificates/{certId}
  - userId, concept, clusterId
  - issuedAt
  - storageUrl                    ← Firebase Storage path to PDF
  - shareToken                    ← public shareable link token
```

### Firebase Storage Structure

```
/uploads/{uid}/{filename}          ← user-uploaded PDFs
/certificates/{certId}.pdf         ← generated mastery certificates
/avatars/{uid}.jpg                 ← profile pictures
```

### Firebase Auth Providers

- Google Sign-In (primary — aligns with Google ecosystem)
- Email/password
- Magic link (passwordless email)

Firestore Security Rules lock all `/users/{uid}/**` paths to `request.auth.uid == uid` — no user can read another's learning data.

---

## Google Search Integration — Deep Dive

### Search Query Strategy

The Resource Agent doesn't just search for the concept name. It constructs contextual queries based on:

**Level-aware query templates:**
```
Beginner:      "[concept] explained simply for beginners"
               "what is [concept] easy explanation"
               "[concept] tutorial for absolute beginners"

Intermediate:  "[concept] practical tutorial with examples"
               "how to use [concept] in real projects"
               "[concept] common mistakes and best practices"

Advanced:      "[concept] under the hood implementation"
               "[concept] advanced patterns"
               "[concept] arXiv paper 2023 2024"
```

**Format-aware queries (based on learning style):**
```
Visual learner:    "[concept] site:youtube.com visual explanation"
Analytical:        "[concept] documentation official"
Project-based:     "[concept] build project tutorial"
```

### Resource Curation Pipeline

```
Google Custom Search API
    ↓ (10 raw results)
gemini-3-flash-preview scoring pass
    → relevance score (0–1)
    → difficulty match score (0–1)
    → source trust score (0–1)
    → recency score (0–1)
    ↓
Top 3–5 resources selected
    ↓
Stored in Firestore /concepts/{id}/cachedResources
    (cache TTL: 7 days — refreshed if stale)
    ↓
Returned to Pedagogy Agent for weaving into response
```

### Resource Display in UI

Resources appear inline in the chat response as rich cards — not just links. Each card shows:
- Resource type icon (video 🎥, article 📄, docs 📘, paper 🔬)
- Title + source domain
- Estimated read/watch time
- A one-line "why this" note personalised to the learner
- Difficulty badge (Beginner / Intermediate / Advanced)

Users can **save resources** to a personal library (stored in Firestore) and mark them as completed.

---

## LangChain + LangGraph Implementation

### LangGraph State Definition

```typescript
import { StateGraph, Annotation } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Shared state that flows through all agents
const LearnerStateAnnotation = Annotation.Root({
  userId: Annotation<string>(),
  userMessage: Annotation<string>(),
  sessionId: Annotation<string>(),

  // Intake outputs
  intent: Annotation<string>(),
  extractedConcepts: Annotation<string[]>(),
  shouldShortCircuit: Annotation<boolean>(),

  // Profile outputs
  learnerProfile: Annotation<LearnerProfile>(),

  // Curriculum outputs
  teachingPlan: Annotation<TeachingPlan>(),

  // Resource outputs
  curatedResources: Annotation<CuratedResource[]>(),

  // Pedagogy outputs
  response: Annotation<string>(),
  pedagogyMode: Annotation<string>(),

  // Evaluator outputs
  comprehensionScore: Annotation<number>(),
  evaluatorDecision: Annotation<"advance" | "reinforce" | "backtrack">(),
});

// Gemini models
const geminiModel = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
  streaming: true,
});
```

### Graph Construction

```typescript
const graph = new StateGraph(LearnerStateAnnotation)
  .addNode("intake", intakeAgent)
  .addNode("profile", profileAgent)
  .addNode("curriculum", curriculumAgent)
  .addNode("resource", resourceAgent)
  .addNode("pedagogy", pedagogyAgent)
  .addNode("evaluator", evaluatorAgent)
  .addEdge("__start__", "intake")
  .addConditionalEdges("intake", routeFromIntake, {
    full_pipeline: "profile",
    short_circuit: "pedagogy",   // off-topic or simple questions bypass full pipeline
  })
  .addEdge("profile", "curriculum")
  .addEdge("curriculum", "resource")
  .addEdge("resource", "pedagogy")
  .addEdge("pedagogy", "evaluator")
  .addConditionalEdges("evaluator", routeFromEvaluator, {
    advance: "__end__",
    reinforce: "pedagogy",       // try different mode on same concept
    backtrack: "curriculum",     // go back and find missing prerequisite
  })
  .compile({ checkpointer: firestoreCheckpointer });
```

### Firestore Checkpointer

Instead of Redis, session state is checkpointed directly to Firestore. A lightweight custom checkpointer saves the `LearnerState` to `/users/{uid}/sessions/{sessionId}/checkpoint` after each node execution. This means:
- Sessions can be resumed across browser tabs and devices
- Full audit trail of how the graph executed
- No additional infrastructure (no Redis, no extra cost)

```typescript
class FirestoreCheckpointer {
  async put(config, checkpoint) {
    const ref = doc(db, `users/${config.userId}/sessions/${config.sessionId}/checkpoint`);
    await setDoc(ref, { state: checkpoint, updatedAt: serverTimestamp() });
  }
  async get(config) {
    const ref = doc(db, `users/${config.userId}/sessions/${config.sessionId}/checkpoint`);
    const snap = await getDoc(ref);
    return snap.exists() ? snap.data().state : null;
  }
}
```

---

## Key Features

### 🧠 Adaptive Learner Profile
Every user has a live **knowledge graph** stored in Firestore — a map of concepts they know, partially know, or haven't touched. NeuralPath continuously updates this as they interact. You don't fill out a quiz to get started. The system infers your level from how you talk.

### 🗺️ Personalised Learning Roadmap
On signup, users enter a **goal** (e.g., "Learn machine learning" or "Understand the French Revolution"). NeuralPath generates a structured roadmap of concept clusters, ordered by dependency. The roadmap updates dynamically — if you demonstrate existing knowledge through conversation, those clusters are auto-skipped.

### 🔍 Live Resource Curation (Google Search)
After every concept explanation, the Resource Agent runs targeted Google searches and surfaces the 3–5 best learning materials for exactly where you are. No static links. No outdated content. Resources are filtered by level, format preference, and source trust — then woven naturally into the response.

### ⚡ Real-Time Streaming Responses
All Gemini outputs stream token-by-token to the UI via LangChain's streaming API and Next.js Route Handlers. Users see the response come alive in real time.

### 🔄 Socratic Loop
NeuralPath never just dumps information. Every explanation ends with a targeted follow-up question. The Evaluator Agent reads the quality of the answer to determine genuine comprehension.

### 📊 Progress Dashboard
- Interactive knowledge graph (D3 force-directed, fetched from Firestore)
- Mastery percentage per topic cluster
- Daily learning streak
- Saved resources library (bookmarked curated content)
- Upcoming spaced repetition review queue

### 🎯 Difficulty Dial
Users manually set a difficulty preference (Gentle / Balanced / Challenging) which biases how aggressively the Curriculum Agent advances them and how technical the Resource Agent's search queries get.

### 💬 Multimodal Input
- Type your question or confusion
- Paste code, a formula, or a paragraph for analysis
- Upload a PDF (stored in Firebase Storage) — NeuralPath parses it and teaches from your own source material

### 🏆 Concept Mastery System
When the Evaluator Agent determines a concept is mastered (score ≥ 80 across 3+ interactions), it marks it as mastered in Firestore, unlocks the next cluster, and generates a shareable PDF certificate stored in Firebase Storage.

### 🔁 Spaced Repetition
Mastered concepts are scheduled for lightweight review using the SM-2 algorithm. Due dates stored on each concept node in Firestore. Daily "5-minute recall" sessions surface the overdue concepts.

---

## How It Helps the End User

| User Problem | NeuralPath Solution |
|---|---|
| "I don't know where to start" | Generates a structured, dependency-ordered roadmap from any goal |
| "I can't find good resources" | Resource Agent curates live, level-matched content via Google Search |
| "This is too fast / too slow" | Evaluator Agent detects pace mismatch and adjusts dynamically |
| "I read it but didn't understand" | Socratic loop surfaces whether real understanding occurred |
| "I keep forgetting what I learned" | Spaced repetition re-surfaces concepts at optimal intervals |
| "I don't know what I don't know" | Knowledge graph in Firestore visualises gaps explicitly |
| "Explanations don't click for me" | Pedagogy Agent tries multiple modes (analogy, story, drill) |
| "I need to learn from my own material" | PDF upload → Firebase Storage → NeuralPath teaches from your source |
| "Links I find are too advanced/basic" | Resource Agent filters by learner level and style preference |

---

## Next.js Project Structure

```
/app
  /api
    /chat/route.ts           ← Streaming LangGraph invocation (POST)
    /roadmap/route.ts        ← Goal → roadmap generation (POST)
    /search/route.ts         ← Google Custom Search proxy (GET)
    /profile/route.ts        ← Learner profile read/write (GET, PATCH)
    /resources/save/route.ts ← Save resource to personal library (POST)
    /upload/route.ts         ← PDF upload to Firebase Storage (POST)
  /dashboard/page.tsx        ← Progress dashboard
  /learn/page.tsx            ← Main chat interface
  /onboarding/page.tsx       ← Goal + diagnostic setup
  /roadmap/page.tsx          ← Interactive concept roadmap
  /resources/page.tsx        ← Saved resources library

/lib
  /agents
    intake.ts                ← Intent classification agent
    profile.ts               ← Learner profile update agent
    curriculum.ts            ← Next-concept selector agent
    resource.ts              ← Google Search + Gemini curation agent
    pedagogy.ts              ← Explanation + resource weaving agent
    evaluator.ts             ← Comprehension scoring agent
  /graph
    learnerGraph.ts          ← LangGraph state machine (compiled graph)
    state.ts                 ← LearnerState type definitions
    checkpointer.ts          ← Firestore checkpointer implementation
    router.ts                ← Conditional edge routing logic
  /firebase
    admin.ts                 ← Firebase Admin SDK (server-side)
    client.ts                ← Firebase Client SDK (browser)
    auth.ts                  ← Auth helper functions
    firestore.ts             ← Firestore CRUD helpers
    storage.ts               ← Firebase Storage helpers
  /search
    googleSearch.ts          ← Google Custom Search API client
    queryBuilder.ts          ← Level-aware query construction
    resourceScorer.ts        ← Gemini-powered result scoring

/components
  ChatInterface.tsx          ← Main chat with streaming
  ResourceCard.tsx           ← Curated resource display card
  KnowledgeGraph.tsx         ← D3 force graph (Firestore data)
  RoadmapView.tsx            ← Visual concept roadmap
  MasteryBadge.tsx           ← Achievement display
  StreamingMessage.tsx       ← Token-by-token render
  ResourceLibrary.tsx        ← Saved resources view
```

---

## LearnerState Schema

```typescript
interface LearnerState {
  // Identity
  userId: string;
  sessionId: string;

  // Goal & Roadmap
  goal: string;
  roadmap: Array<{
    clusterId: string;
    clusterName: string;
    concepts: string[];
    status: "locked" | "active" | "mastered";
  }>;

  // Knowledge Graph (stored in Firestore, referenced here)
  knowledgeGraph: {
    nodes: Array<{
      concept: string;
      confidence: number;     // 0–100
      mastered: boolean;
      lastReviewed: Date;
      nextReviewDue: Date;    // SM-2 spaced repetition
      cachedResources: CuratedResource[];
    }>;
    edges: Array<{
      from: string;
      to: string;
      type: "prerequisite" | "related";
    }>;
  };

  // Learning Style (inferred, not declared)
  learningStyle: {
    prefersAnalogy: number;       // 0–1 weight
    prefersSocratic: number;
    prefersNarrative: number;
    prefersDrill: number;
    prefersVisual: number;
    readingLevel: "beginner" | "intermediate" | "advanced";
    pace: "slow" | "medium" | "fast";
  };

  // Session
  currentCluster: string;
  currentConcept: string;
  sessionHistory: Array<{
    role: "user" | "assistant";
    content: string;
    resources?: CuratedResource[];
    timestamp: Date;
  }>;

  // Meta
  streakDays: number;
  totalConceptsMastered: number;
}
```

---

## Phase Roadmap

- Next.js scaffold + Firebase Auth (Google Sign-In)
- Firestore schema setup (users, sessions, knowledgeGraph)
- Single-agent chat using gemini-3-flash-preview via LangChain
- Basic streaming chat UI
- Manual learner level setting (Beginner / Intermediate / Advanced)
- Full LangGraph graph with all 6 agents
- Google Custom Search integration + Resource Agent
- Resource cards rendered in chat UI
- Knowledge graph stored in Firestore, visualised with D3
- Progress dashboard (streak, mastery %, concept nodes)
- Spaced repetition scheduler (SM-2, Firestore-backed)
- PDF ingestion via Firebase Storage + Gemini parsing
- Learning style auto-detection from conversation patterns
- Mastery certificate generation (PDF → Firebase Storage)
- Saved resources personal library
- Multi-subject support
---


Gamify this a little by rewarding the user with points or badges for completing a task or concept. 

users can show earned badged on profile

Use vitest to write unit tests
