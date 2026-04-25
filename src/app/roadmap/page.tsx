'use client';

import { useEffect, useState } from 'react';
import { useAuth, getAuthHeaders } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import { CheckCircle2, Lock, Loader2, ChevronRight, Target } from 'lucide-react';
import Link from 'next/link';

interface Cluster {
  clusterId: string;
  clusterName: string;
  concepts: string[];
  status: 'locked' | 'active' | 'mastered';
}

const STATUS_STYLE = {
  mastered: { bg: 'var(--pastel-mint)',     border: 'var(--pastel-mint-border)',     color: '#2d6a4f', dotBg: 'var(--pastel-mint)' },
  active:   { bg: 'var(--pastel-lavender)', border: 'var(--pastel-lavender-border)', color: 'var(--primary)', dotBg: 'var(--pastel-lavender)' },
  locked:   { bg: 'var(--surface-container-low)', border: 'var(--outline-variant)', color: 'var(--outline)', dotBg: 'var(--surface-container)' },
};

export default function RoadmapPage() {
  const { user, loading, getIdToken } = useAuth();
  const router = useRouter();
  const [roadmap, setRoadmap] = useState<Cluster[]>([]);
  const [goal, setGoal] = useState('');
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    const load = async () => {
      try {
        const headers = await getAuthHeaders(getIdToken);
        if (!headers) return;
        const res = await fetch('/api/profile', { headers });
        if (res.ok) {
          const data = await res.json();
          setRoadmap(data.profile?.roadmap ?? []);
          setGoal(data.profile?.goal ?? '');
        }
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [user, getIdToken]);

  const masteredCount = roadmap.filter((c) => c.status === 'mastered').length;
  const progress = roadmap.length > 0 ? Math.round((masteredCount / roadmap.length) * 100) : 0;

  if (loading || fetching) {
    return (
      <div className="app-container">
        <NavBar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={28} style={{ color: 'var(--secondary)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <NavBar />
      <main className="main-content">
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* Header */}
          <section style={{ marginBottom: '2rem' }}>
            <h1
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: 'clamp(1.5rem, 2.5vw, 2rem)',
                fontWeight: 800,
                letterSpacing: '-0.05em',
                color: 'var(--primary)',
                marginBottom: '0.35rem',
              }}
            >
              Learning Roadmap
            </h1>
            {goal && (
              <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)' }}>
                Goal:{' '}
                <span style={{ fontWeight: 600, color: 'var(--on-surface)' }}>{goal}</span>
              </p>
            )}

            {roadmap.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--outline)', marginBottom: '0.4rem' }}>
                  <span>{masteredCount} of {roadmap.length} clusters mastered</span>
                  <span>{progress}%</span>
                </div>
                <div
                  style={{ height: 6, borderRadius: 99, overflow: 'hidden', background: 'var(--surface-container-high)' }}
                  role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}
                  aria-label={`Roadmap ${progress}% complete`}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progress}%`,
                      borderRadius: 99,
                      background: 'var(--gradient-primary)',
                      transition: 'width 1s ease',
                    }}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Empty state */}
          {roadmap.length === 0 && (
            <div
              className="np-card"
              style={{
                padding: '3rem 2rem',
                textAlign: 'center',
                background: 'var(--pastel-lavender)',
                borderColor: 'var(--pastel-lavender-border)',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }} aria-hidden="true">🗺️</div>
              <h2
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  marginBottom: '0.5rem',
                }}
              >
                No roadmap yet
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Set a learning goal to generate your personalized roadmap.
              </p>
              <Link href="/onboarding" className="btn-primary" aria-label="Set learning goal">
                <Target size={15} aria-hidden="true" />
                Set Your Goal
              </Link>
            </div>
          )}

          {/* Roadmap timeline */}
          {roadmap.length > 0 && (
            <ol style={{ display: 'flex', flexDirection: 'column', gap: 0, listStyle: 'none' }} aria-label="Learning roadmap">
              {roadmap.map((cluster, i) => {
                const st = STATUS_STYLE[cluster.status];
                const isLast = i === roadmap.length - 1;

                return (
                  <li key={cluster.clusterId} style={{ position: 'relative', display: 'flex', gap: '1rem' }}>
                    {/* Timeline connector */}
                    {!isLast && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 19,
                          top: 42,
                          bottom: 0,
                          width: 2,
                          background: cluster.status === 'mastered'
                            ? 'linear-gradient(to bottom, var(--pastel-mint-border), var(--outline-variant))'
                            : 'var(--outline-variant)',
                          borderRadius: 2,
                        }}
                        aria-hidden="true"
                      />
                    )}

                    {/* Status dot */}
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: `2px solid ${st.border}`,
                        background: st.dotBg,
                        zIndex: 1,
                        marginTop: 6,
                      }}
                      aria-hidden="true"
                    >
                      {cluster.status === 'mastered' ? (
                        <CheckCircle2 size={18} style={{ color: st.color }} />
                      ) : cluster.status === 'locked' ? (
                        <Lock size={13} style={{ color: st.color }} />
                      ) : (
                        <div style={{ width: 12, height: 12, borderRadius: '50%', background: st.color, animation: 'pulse-ring 2s ease-in-out infinite' }} />
                      )}
                    </div>

                    {/* Card */}
                    <div
                      className="np-card"
                      style={{
                        flex: 1,
                        marginBottom: '1rem',
                        background: st.bg,
                        borderColor: st.border,
                        padding: '1.1rem 1.25rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <h2
                          style={{
                            fontFamily: 'Manrope, sans-serif',
                            fontSize: '1rem',
                            fontWeight: 700,
                            color: 'var(--on-surface)',
                            letterSpacing: '-0.02em',
                          }}
                        >
                          {cluster.clusterName}
                        </h2>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 99,
                            textTransform: 'capitalize',
                            letterSpacing: '0.04em',
                            background: 'var(--surface-container-lowest)',
                            color: st.color,
                            border: `1px solid ${st.border}`,
                          }}
                          aria-label={`Status: ${cluster.status}`}
                        >
                          {cluster.status}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: cluster.status === 'active' ? '0.85rem' : 0 }} aria-label="Concepts">
                        {cluster.concepts.map((concept) => (
                          <span
                            key={concept}
                            style={{
                              fontSize: '0.75rem',
                              padding: '3px 10px',
                              borderRadius: 99,
                              textTransform: 'capitalize',
                              background: 'var(--surface-container-lowest)',
                              color: cluster.status === 'locked' ? 'var(--outline)' : 'var(--on-surface-variant)',
                              border: `1px solid ${st.border}`,
                            }}
                          >
                            {concept}
                          </span>
                        ))}
                      </div>

                      {cluster.status === 'active' && (
                        <Link href="/learn" className="btn-primary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem' }} aria-label={`Continue ${cluster.clusterName}`}>
                          Continue <ChevronRight size={13} aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </main>
    </div>
  );
}
