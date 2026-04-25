# NeuralPath — Implementation Plan

## Overview

Build **NeuralPath**, a full-stack AI-powered adaptive learning system on the existing Next.js 16.2.4 (App Router) project. The system replaces the current "Dynamic Syllabus Generator" entirely with the NeuralPath platform using Firebase Auth (Google Sign-In), Firestore, Firebase Storage, LangGraph multi-agent AI pipeline, and Gemini as the LLM backbone.

The existing project uses **Next.js 16.2.4 with Tailwind CSS v4**, React 19, and already has a `GEMINI_API_KEY` set up. All new code will follow the App Router conventions from the bundled docs.

---

## User Review Required

> [!IMPORTANT]
> **Complete Architecture Rewrite**: This plan replaces the entire existing `page.tsx`, `layout.tsx`, and `api/chat/route.ts`. The existing "Dynamic Syllabus Generator" will be removed.

> [!IMPORTANT]
> **Firebase Service Account Key**: For server-side Firebase Admin SDK (used in API routes for auth verification and secure Firestore writes), you'll need to create a service account key from the Firebase Console and add it as an env variable. I'll use `FIREBASE_SERVICE_ACCOUNT_JSON` as a base64-encoded JSON env var. You'll need to add this AFTER the project is set up.

> [!WARNING]
> **No Firebase Indexes**: Per your requirement, all Firestore queries will be designed to avoid composite indexes (simple field queries, single `where` clauses, no `orderBy`+`where` combos that require indexes).

> [!IMPORTANT]
> **Google Custom Search**: The Resource Agent uses Google Search via Gemini's built-in Google Search tool (grounding) rather than a separate Custom Search API, matching the spec's note: *"Using GeminiAPI tool, it has this inbuilt"*. This avoids needing a separate Google CSE API key.

---

## Open Questions

> [!NOTE]
> **Vitest setup**: Vitest requires the test files to be in a `__tests__` directory or match `*.test.ts` patterns. Unit tests will cover agents, utility functions, and Firestore helpers. Vitest browser mode is NOT needed — tests run in Node environment.

> [!NOTE]
> **Gamification Badges**: I'll implement a badge/XP system with these tiers:
> - 🌱 **Seedling** (first session)
> - 🔥 **On Fire** (3-day streak)  
> - 🧠 **Deep Thinker** (10 concepts mastered)
> - 🏆 **Scholar** (complete a full roadmap)
> - ⚡ **Speed Learner** (master concept in one session)
> - 💎 **Diamond Mind** (30-day streak)
> Badge progress is stored in Firestore and displayed on user profile.

---

## Proposed Changes

### Phase 1 — Infrastructure & Dependencies

#### [MODIFY] [package.json](file:///Users/angel/Documents/hackathon/package.json)
Add: `firebase`, `firebase-admin`, `@langchain/langgraph`, `@langchain/google-genai`, `@langchain/core`, `vitest`, `@vitejs/plugin-react`, `pdf-parse`, `zod`, `d3`

---

### Phase 2 — Firebase Setup

#### [NEW] `src/lib/firebase/client.ts`
Firebase client SDK init with the provided config. Auth + Firestore + Storage exports for browser use.

#### [NEW] `src/lib/firebase/admin.ts`
Firebase Admin SDK init using `FIREBASE_SERVICE_ACCOUNT_JSON` env var. Singleton pattern to avoid re-initializing in hot reload. Used in API routes for secure operations.

#### [NEW] `src/lib/firebase/auth.ts`
Auth helper functions: `verifyIdToken()` for API route token verification, `getUserProfile()`, `createUserProfile()`.

#### [NEW] `src/lib/firebase/firestore.ts`
Typed CRUD helpers for all Firestore collections:
- `getUserData()`, `updateUserData()`
- `getUserProfile()`, `updateUserProfile()`
- `getKnowledgeGraph()`, `updateKnowledgeGraph()`
- `getSessions()`, `createSession()`, `updateSession()`
- `getConcept()`, `upsertConcept()`
- `saveResource()`, `getSavedResources()`
- `getCertificates()`

#### [NEW] `src/lib/firebase/storage.ts`
Helpers: `uploadFile()`, `getDownloadURL()`, `deleteFile()`

---

### Phase 3 — LangGraph Agent System

#### [NEW] `src/lib/graph/state.ts`
Full TypeScript type definitions for `LearnerState`, `LearnerProfile`, `TeachingPlan`, `CuratedResource`, `IntakeResult`, `KnowledgeGraph` etc.

#### [NEW] `src/lib/agents/intake.ts`
Intent classification agent — classifies user messages into: `question | confusion | ready_to_advance | off_topic | practice_request | emotional_frustration`. Uses structured output with Gemini.

#### [NEW] `src/lib/agents/profile.ts`
Learner profile updater — reads/updates concept confidence, detects learning style signals from conversation patterns.

#### [NEW] `src/lib/agents/curriculum.ts`
Next-concept selector — uses ZPD logic, reads knowledge graph, identifies gaps.

#### [NEW] `src/lib/agents/resource.ts`
Resource curation agent — uses Gemini's built-in Google Search grounding to find live educational resources, scores and filters them by level/style.

#### [NEW] `src/lib/agents/pedagogy.ts`
Explanation generator — chooses delivery mode (Socratic/Analogy/Narrative/Drill/Visual), weaves curated resources into response.

#### [NEW] `src/lib/agents/evaluator.ts`
Comprehension scorer — scores 0–100, outputs advance/reinforce/backtrack decision.

#### [NEW] `src/lib/graph/learnerGraph.ts`
Compiled LangGraph `StateGraph` with all 6 nodes and conditional edges. Streamed invocation function.

#### [NEW] `src/lib/graph/checkpointer.ts`
Simple Firestore-backed session state persistence (no external checkpointer package).

#### [NEW] `src/lib/graph/router.ts`
Conditional routing functions: `routeFromIntake()`, `routeFromEvaluator()`.

---

### Phase 4 — API Routes

#### [MODIFY] `src/app/api/chat/route.ts`
Replace existing with: streaming LangGraph invocation. Verifies Firebase ID token from `Authorization` header. Streams SSE response.

#### [NEW] `src/app/api/roadmap/route.ts`
`POST`: generates personalized concept roadmap from user goal using Gemini. Saves to Firestore.

#### [NEW] `src/app/api/profile/route.ts`
`GET`: returns current learner profile. `PATCH`: updates profile fields.

#### [NEW] `src/app/api/upload/route.ts`
`POST`: receives PDF, uploads to Firebase Storage at `/uploads/{uid}/{filename}`, returns download URL.

#### [NEW] `src/app/api/resources/save/route.ts`
`POST`: saves a curated resource to user's personal library in Firestore.

#### [NEW] `src/app/api/badges/route.ts`
`GET`: returns all earned badges for the authenticated user.

#### [NEW] `src/app/api/auth/session/route.ts`
`POST`: receives Firebase ID token, verifies it, returns user info (used for session establishment).

---

### Phase 5 — Auth Context & Middleware

#### [NEW] `src/contexts/AuthContext.tsx`
`'use client'` React context providing `user`, `loading`, `signInWithGoogle()`, `signOut()` using Firebase client Auth. Wraps the app.

#### [NEW] `src/middleware.ts`
Next.js middleware to protect `/learn`, `/dashboard`, `/roadmap`, `/resources`, `/profile` routes. Checks for Firebase auth cookie. Redirects to `/login` if unauthenticated.

---

### Phase 6 — Pages

#### [MODIFY] `src/app/layout.tsx`
Updated root layout: NeuralPath metadata, `AuthProvider` wrapping, Inter + Space Grotesk fonts from Google Fonts.

#### [MODIFY] `src/app/globals.css`
Completely redesigned design system: NeuralPath brand colors (deep purple, electric cyan, neural gold), premium dark mode, glassmorphism utilities, custom animations.

#### [MODIFY] `src/app/page.tsx`
New landing page: NeuralPath hero section, animated neural network background, feature highlights, "Get Started with Google" CTA.

#### [NEW] `src/app/login/page.tsx`
Auth page: Google Sign-In button, NeuralPath branding, animated background.

#### [NEW] `src/app/onboarding/page.tsx`
Goal setting + initial diagnostic flow. User enters learning goal, difficulty preference, background level. Creates Firestore profile + generates initial roadmap.

#### [NEW] `src/app/learn/page.tsx`
Main chat interface: streaming message display, resource cards inline, PDF upload button, difficulty dial.

#### [NEW] `src/app/dashboard/page.tsx`
Progress dashboard: XP + badge display, streak counter, mastery %, knowledge graph (D3), concept queue.

#### [NEW] `src/app/roadmap/page.tsx`
Interactive visual roadmap: concept clusters, mastery states, progress indicators.

#### [NEW] `src/app/resources/page.tsx`
Saved resources personal library: filter by type/topic, mark as completed.

#### [NEW] `src/app/profile/page.tsx`
User profile: earned badges display, stats, learning style visualization, account settings.

---

### Phase 7 — Components

#### [NEW] `src/components/ChatInterface.tsx`
Main chat component with SSE streaming, message history, resource card rendering.

#### [NEW] `src/components/StreamingMessage.tsx`
Token-by-token message renderer with markdown support and typewriter effect.

#### [NEW] `src/components/ResourceCard.tsx`
Rich resource card: type icon, title, domain, estimated time, difficulty badge, "why this" note, save button.

#### [NEW] `src/components/KnowledgeGraph.tsx`
D3 force-directed graph of concept nodes — fetches from Firestore, renders mastery states.

#### [NEW] `src/components/RoadmapView.tsx`
Visual roadmap with cluster progression, locked/active/mastered states.

#### [NEW] `src/components/BadgeDisplay.tsx`
Badge showcase component for profile page. Animated badge cards with unlock criteria.

#### [NEW] `src/components/XPBar.tsx`
Animated experience points bar with level indicator.

#### [NEW] `src/components/StreakCounter.tsx`
Daily streak display with fire animation.

#### [NEW] `src/components/PDFUploader.tsx`
File drag-and-drop component for PDF uploads to Firebase Storage.

#### [NEW] `src/components/NavBar.tsx`
Top navigation bar with user avatar, XP display, notification bell, sign-out.

---

### Phase 8 — Gamification System

#### [NEW] `src/lib/gamification/badges.ts`
Badge definitions, unlock criteria, XP values. Evaluation function `checkBadgeUnlocks(state)`.

#### [NEW] `src/lib/gamification/xp.ts`
XP calculation: concept mastered (+100), session completed (+25), streak day (+50), badge earned (+200), etc.

---

### Phase 9 — Testing

#### [NEW] `vitest.config.ts`
Vitest config targeting `src/**/*.test.ts`.

#### [NEW] `src/lib/agents/__tests__/intake.test.ts`
Unit tests for intake agent intent classification.

#### [NEW] `src/lib/agents/__tests__/evaluator.test.ts`
Unit tests for evaluator scoring logic.

#### [NEW] `src/lib/gamification/__tests__/badges.test.ts`
Unit tests for badge unlock criteria.

#### [NEW] `src/lib/gamification/__tests__/xp.test.ts`
Unit tests for XP calculation.

#### [NEW] `src/lib/firebase/__tests__/firestore.test.ts`
Unit tests for Firestore helper functions (mocked Firebase).

---

## Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User-owned data: strict uid-based access
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
      
      match /{subcollection=**} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
    
    // Concepts: readable by authenticated users, writable only by server
    match /concepts/{conceptId} {
      allow read: if request.auth != null;
      allow write: if false; // server-only via Admin SDK
    }
    
    // Certificates: owner can read, server writes
    match /certificates/{certId} {
      allow read: if request.auth != null && 
                     resource.data.userId == request.auth.uid;
      allow write: if false;
    }
  }
}
```

---

## Environment Variables Needed

```bash
# Already exists
GEMINI_API_KEY=...

# New - Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyCQz1Fz1uJhCmkTTcaDcx1XpTF5EMkJ_vA
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=build-with-ai-e2358.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=build-with-ai-e2358
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=build-with-ai-e2358.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=949995634094
NEXT_PUBLIC_FIREBASE_APP_ID=1:949995634094:web:3b66c555dbb28b86c49c3f

# Server-only - Firebase Admin (base64-encoded service account JSON)
FIREBASE_SERVICE_ACCOUNT_JSON=<base64-encoded JSON>
```

---

## Verification Plan

### Automated Tests
```bash
npx vitest run
```
Tests cover: agent logic, badge unlocks, XP calculation, Firestore helpers (mocked).

### Build Verification
```bash
npm run build
```

### Manual Verification
1. Google Sign-In flow works → user created in Firestore
2. Onboarding → roadmap generated → saved to Firestore
3. Chat sends message → LangGraph pipeline runs → streamed response received
4. Resource cards appear in chat with Google Search results
5. Concept mastered → XP + badge awarded → visible on dashboard
6. PDF upload → stored in Firebase Storage → accessible via URL
7. Dashboard shows streak, XP, knowledge graph D3 visualization
8. Profile page shows earned badges
9. Sign out → redirected to login → protected routes inaccessible
