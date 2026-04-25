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

const DIFFICULTY_OPTIONS: Array<{
  value: Difficulty;
  label: string;
  desc: string;
  bg: string;
  border: string;
  activeBg: string;
}> = [
  { value: 'gentle',      label: '🌱 Gentle',     desc: 'Thorough explanations, slower pace', bg: 'var(--surface-container-low)', border: 'var(--outline-variant)', activeBg: 'var(--pastel-mint)' },
  { value: 'balanced',    label: '⚡ Balanced',    desc: 'Best of both worlds',               bg: 'var(--surface-container-low)', border: 'var(--outline-variant)', activeBg: 'var(--pastel-lavender)' },
  { value: 'challenging', label: '🔥 Challenging', desc: 'Fast-paced, depth-first',           bg: 'var(--surface-container-low)', border: 'var(--outline-variant)', activeBg: 'var(--pastel-peach)' },
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
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface)',
        }}
      >
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--secondary)' }} />
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        background:
          'radial-gradient(circle at top left, rgba(255,220,197,0.45), transparent 32%), linear-gradient(180deg, #f7f4ef 0%, #eef1f0 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 580 }} className="animate-fade-up">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '0.85rem',
              borderRadius: 16,
              background: 'var(--gradient-primary)',
              marginBottom: '1.25rem',
              boxShadow: '0 12px 28px rgba(18,40,60,0.18)',
            }}
            aria-hidden="true"
          >
            <Brain size={32} style={{ color: '#ffffff' }} />
          </div>
          <h1
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
              fontWeight: 800,
              letterSpacing: '-0.06em',
              color: 'var(--primary)',
              lineHeight: 1.05,
              marginBottom: '0.65rem',
            }}
          >
            What do you want to learn?
          </h1>
          <p style={{ fontSize: '0.95rem', color: 'var(--on-surface-variant)', lineHeight: 1.65, maxWidth: '52ch', margin: '0 auto' }}>
            NeuralPath will build a personalized roadmap and adapt to how you learn.
          </p>
        </div>

        <div className="np-card" style={{ padding: '2rem' }}>
          {/* Goal input */}
          <section aria-labelledby="goal-label" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                1
              </div>
              <h2 id="goal-label" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
                What&apos;s your learning goal?
              </h2>
            </div>

            <textarea
              id="goal-input"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Learn machine learning from scratch, Understand quantum physics, Master React…"
              className="input-field"
              style={{ minHeight: 96, resize: 'none', marginBottom: '0.75rem' }}
              aria-label="Enter your learning goal"
              aria-required="true"
              maxLength={300}
            />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {EXAMPLE_GOALS.map((eg, i) => (
                <button
                  key={i}
                  onClick={() => setGoal(eg)}
                  style={{
                    fontSize: '0.78rem',
                    padding: '0.35rem 0.85rem',
                    borderRadius: 99,
                    border: '1px solid var(--outline-variant)',
                    color: 'var(--on-surface-variant)',
                    background: 'var(--surface-container-low)',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, color 0.15s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--outline-variant)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--on-surface-variant)';
                  }}
                  aria-label={`Use example: ${eg}`}
                >
                  {eg}
                </button>
              ))}
            </div>
          </section>

          {/* Difficulty */}
          <section aria-labelledby="difficulty-label" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--gradient-primary)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                2
              </div>
              <h2 id="difficulty-label" style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 700, fontSize: '1.05rem', color: 'var(--on-surface)', letterSpacing: '-0.02em' }}>
                How fast should we push?
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }} role="radiogroup" aria-labelledby="difficulty-label">
              {DIFFICULTY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  role="radio"
                  aria-checked={difficulty === opt.value}
                  onClick={() => setDifficulty(opt.value)}
                  style={{
                    padding: '1rem 0.75rem',
                    borderRadius: 10,
                    border: `1px solid ${difficulty === opt.value ? 'var(--primary)' : 'var(--outline-variant)'}`,
                    background: difficulty === opt.value ? opt.activeBg : 'var(--surface-container-lowest)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--on-surface)', marginBottom: '0.3rem' }}>{opt.label}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {error && (
            <div
              role="alert"
              style={{
                fontSize: '0.875rem',
                borderRadius: 10,
                padding: '0.75rem 1rem',
                color: 'var(--error)',
                background: 'var(--error-container)',
                border: '1px solid rgba(186,26,26,0.2)',
                marginBottom: '1.25rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            id="generate-roadmap-btn"
            onClick={handleGenerate}
            disabled={!goal.trim() || isGenerating}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '0.9rem', fontSize: '0.95rem' }}
            aria-label="Generate my personalized learning roadmap"
          >
            {isGenerating ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Building your roadmap…
              </>
            ) : (
              <>
                <Target size={17} />
                Generate My Roadmap
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </div>
      </div>
    </main>
  );
}
