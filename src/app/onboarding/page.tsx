'use client';

import { useState, useEffect } from 'react';
import { useAuth, getAuthHeaders } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Brain, ArrowRight, Target, Loader2 } from 'lucide-react';

type Difficulty = 'gentle' | 'balanced' | 'challenging';

const EXAMPLE_GOALS = [
  'Learn machine learning from scratch',
  'Understand the French Revolution',
  'Master TypeScript and React',
  'Learn how to play guitar',
  'Study quantum physics basics',
];

const DIFFICULTY_OPTIONS: Array<{ value: Difficulty; label: string; desc: string; bg: string; border: string }> = [
  { value: 'gentle',      label: '🌱 Gentle',     desc: 'Thorough explanations, slower pace', bg: '#CCFBF1', border: '#5EEAD4' },
  { value: 'balanced',    label: '⚡ Balanced',    desc: 'Best of both worlds',               bg: '#EDE9FE', border: '#C4B5FD' },
  { value: 'challenging', label: '🔥 Challenging', desc: 'Fast-paced, depth-first',           bg: '#FEF3C7', border: '#FCD34D' },
];

export default function OnboardingPage() {
  const { user, loading, getIdToken } = useAuth();
  const router = useRouter();

  const [goal, setGoal] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('balanced');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  const handleGenerate = async () => {
    if (!goal.trim()) return;
    setIsGenerating(true);
    setError(null);
    try {
      const headers = await getAuthHeaders(getIdToken);
      if (!headers) throw new Error('Not authenticated');

      const res = await fetch('/api/roadmap', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal, difficultyPreference: difficulty }),
      });

      if (!res.ok) throw new Error('Failed to generate roadmap');
      router.push('/learn');
    } catch {
      setError('Failed to generate your roadmap. Please try again.');
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--np-purple)' }} />
      </div>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center px-6 py-12" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full max-w-2xl space-y-8 animate-fade-up">
        {/* Header */}
        <div className="text-center space-y-3">
          <div
            className="inline-flex p-3 rounded-2xl"
            style={{ background: '#EDE9FE', border: '1px solid #C4B5FD' }}
            aria-hidden="true"
          >
            <Brain size={36} style={{ color: 'var(--np-purple)' }} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            What do you want to <span className="gradient-text">learn?</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            NeuralPath will build a personalized roadmap and adapt to how you learn.
          </p>
        </div>

        <div className="np-card p-8 space-y-8">
          {/* Goal input */}
          <section aria-labelledby="goal-label">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: 'var(--np-purple)' }}
                aria-hidden="true"
              >
                1
              </div>
              <h2 id="goal-label" className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                What&apos;s your learning goal?
              </h2>
            </div>

            <div className="space-y-3">
              <textarea
                id="goal-input"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="e.g. Learn machine learning from scratch, Understand quantum physics, Master React…"
                className="input-field min-h-[100px] resize-none"
                aria-label="Enter your learning goal"
                aria-required="true"
                maxLength={300}
              />
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_GOALS.map((eg, i) => (
                  <button
                    key={i}
                    onClick={() => setGoal(eg)}
                    className="text-xs px-3 py-1.5 rounded-full border transition-all"
                    style={{
                      borderColor: 'var(--border-default)',
                      color: 'var(--text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--np-purple)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--np-purple)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
                      (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                    }}
                    aria-label={`Use example goal: ${eg}`}
                  >
                    {eg}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Difficulty */}
          <section aria-labelledby="difficulty-label">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: 'var(--np-purple)' }}
                aria-hidden="true"
              >
                2
              </div>
              <h2 id="difficulty-label" className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>
                How fast should we push?
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-labelledby="difficulty-label">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  role="radio"
                  aria-checked={difficulty === opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  className="p-4 rounded-xl border text-center transition-all space-y-1"
                  style={
                    difficulty === opt.value
                      ? { background: opt.bg, borderColor: opt.border }
                      : { borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }
                  }
                >
                  <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {opt.label}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {error && (
            <div
              role="alert"
              className="text-sm rounded-xl px-4 py-3"
              style={{ color: '#dc2626', background: '#FEE2E2', border: '1px solid #FECACA' }}
            >
              {error}
            </div>
          )}

          <button
            id="generate-roadmap-btn"
            onClick={handleGenerate}
            disabled={!goal.trim() || isGenerating}
            className="btn-primary w-full justify-center py-4 text-base"
            aria-label="Generate my personalized learning roadmap"
          >
            {isGenerating ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Building your roadmap…
              </>
            ) : (
              <>
                <Target size={18} />
                Generate My Roadmap
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
