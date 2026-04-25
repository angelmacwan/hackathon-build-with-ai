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
  mastered: { bg: '#CCFBF1', border: '#5EEAD4', color: '#0d9488', dotBg: '#CCFBF1' },
  active:   { bg: '#EDE9FE', border: '#C4B5FD', color: '#6d28d9', dotBg: '#EDE9FE' },
  locked:   { bg: '#F9FAFB', border: '#E5E7EB', color: '#9CA3AF', dotBg: '#F3F4F6' },
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
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-base)' }}>
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--np-purple)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <NavBar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-8 pb-24 md:pb-8">
        {/* Header */}
        <section className="space-y-2">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Learning <span className="gradient-text">Roadmap</span>
          </h1>
          {goal && (
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Goal: <span className="font-semibold" style={{ color: 'var(--np-purple)' }}>{goal}</span>
            </p>
          )}

          {roadmap.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>{masteredCount} of {roadmap.length} clusters mastered</span>
                <span>{progress}%</span>
              </div>
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ background: '#E5E7EB' }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`Roadmap ${progress}% complete`}
              >
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, var(--np-purple), var(--np-teal))',
                  }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Empty state */}
        {roadmap.length === 0 && (
          <div
            className="np-card p-12 text-center space-y-4"
            style={{ background: '#EDE9FE', borderColor: '#C4B5FD' }}
          >
            <div className="text-4xl" aria-hidden="true">🗺️</div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              No roadmap yet
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              Set a learning goal to generate your personalized roadmap.
            </p>
            <Link href="/onboarding" className="btn-primary inline-flex" aria-label="Set learning goal">
              <Target size={16} aria-hidden="true" />
              Set Your Goal
            </Link>
          </div>
        )}

        {/* Roadmap timeline */}
        {roadmap.length > 0 && (
          <ol className="relative space-y-0" aria-label="Learning roadmap">
            {roadmap.map((cluster, i) => {
              const style = STATUS_STYLE[cluster.status];
              const isLast = i === roadmap.length - 1;

              return (
                <li key={cluster.clusterId} className="relative flex gap-4">
                  {/* Timeline line */}
                  {!isLast && (
                    <div
                      className="absolute left-[19px] top-10 bottom-0 w-px"
                      style={{
                        background:
                          cluster.status === 'mastered'
                            ? 'linear-gradient(to bottom, #5EEAD4, #E5E7EB)'
                            : '#E5E7EB',
                      }}
                      aria-hidden="true"
                    />
                  )}

                  {/* Status dot */}
                  <div
                    className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border-2 z-10 mt-1"
                    style={{ borderColor: style.border, background: style.dotBg }}
                    aria-hidden="true"
                  >
                    {cluster.status === 'mastered' ? (
                      <CheckCircle2 size={18} style={{ color: style.color }} />
                    ) : cluster.status === 'locked' ? (
                      <Lock size={14} style={{ color: style.color }} />
                    ) : (
                      <div
                        className="w-3 h-3 rounded-full animate-pulse"
                        style={{ background: style.color }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div
                    className="np-card p-5 flex-1 mb-4 space-y-3"
                    style={{ background: style.bg, borderColor: style.border }}
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>
                        {cluster.clusterName}
                      </h2>
                      <span
                        className="text-xs font-semibold px-3 py-1 rounded-full capitalize"
                        style={{ background: 'white', color: style.color, border: `1px solid ${style.border}` }}
                        aria-label={`Status: ${cluster.status}`}
                      >
                        {cluster.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2" aria-label="Concepts in this cluster">
                      {cluster.concepts.map((concept) => (
                        <span
                          key={concept}
                          className="text-xs px-3 py-1 rounded-full capitalize"
                          style={{
                            background: 'white',
                            color: cluster.status === 'locked' ? 'var(--text-muted)' : 'var(--text-secondary)',
                            border: `1px solid ${style.border}`,
                          }}
                        >
                          {concept}
                        </span>
                      ))}
                    </div>

                    {cluster.status === 'active' && (
                      <Link
                        href="/learn"
                        className="btn-primary inline-flex text-sm"
                        aria-label={`Continue learning ${cluster.clusterName}`}
                      >
                        Continue <ChevronRight size={14} aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </div>
  );
}
