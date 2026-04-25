'use client';

import { useEffect, useState } from 'react';
import { useAuth, getAuthHeaders } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import XPBar from '@/components/XPBar';
import BadgeDisplay from '@/components/BadgeDisplay';
import Link from 'next/link';
import {
  BookOpen, Brain, Trophy, Loader2, ArrowRight,
  CheckCircle2, Target, Zap,
} from 'lucide-react';

interface DashboardData {
  userData: {
    displayName: string;
    xp: number;
    level: number;
    streakDays: number;
    totalConceptsMastered: number;
    badges: string[];
  };
  profile: {
    goal: string;
    roadmap: Array<{ clusterId: string; clusterName: string; status: string }>;
    currentCluster: string;
  };
  knowledgeGraph: {
    nodes: Array<{ concept: string; confidence: number; mastered: boolean }>;
  };
}

const STAT_CARDS = [
  { key: 'xp',       label: 'Total XP',         icon: Zap,    bg: 'var(--pastel-lavender)', border: 'var(--pastel-lavender-border)', color: 'var(--primary)' },
  { key: 'streak',   label: 'Day Streak',        icon: null,   bg: 'var(--pastel-peach)',    border: 'var(--pastel-peach-border)',    color: '#b45309' },
  { key: 'concepts', label: 'Concepts Mastered', icon: Brain,  bg: 'var(--pastel-mint)',     border: 'var(--pastel-mint-border)',     color: '#2d6a4f' },
  { key: 'badges',   label: 'Badges Earned',     icon: Trophy, bg: 'var(--surface-container-low)', border: 'var(--outline-variant)', color: 'var(--secondary)' },
];

export default function DashboardPage() {
  const { user, loading, getIdToken } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
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
        if (res.ok) setData(await res.json());
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [user, getIdToken]);

  useEffect(() => {
    if (!loading && !fetching && data && !data.profile?.goal) {
      router.push('/onboarding');
    }
  }, [loading, fetching, data, router]);

  if (loading || fetching) {
    return (
      <div className="app-container">
        <NavBar />
        <div className="main-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={28} style={{ color: 'var(--secondary)' }} />
        </div>
      </div>
    );
  }

  if (!data?.profile?.goal) return null;

  const { userData, profile, knowledgeGraph } = data;
  const masteredConcepts = knowledgeGraph?.nodes?.filter((n) => n.mastered) ?? [];
  const inProgressConcepts = knowledgeGraph?.nodes?.filter((n) => !n.mastered && n.confidence > 0) ?? [];
  const roadmapProgress = profile.roadmap?.length
    ? Math.round((profile.roadmap.filter((c) => c.status === 'mastered').length / profile.roadmap.length) * 100)
    : 0;

  const statValues = [
    { ...STAT_CARDS[0], value: (userData?.xp ?? 0).toLocaleString(), sub: `Level ${userData?.level ?? 1}` },
    { ...STAT_CARDS[1], value: `${userData?.streakDays ?? 0}🔥`, sub: 'Keep it going!', icon: null },
    { ...STAT_CARDS[2], value: userData?.totalConceptsMastered ?? 0, sub: `${inProgressConcepts.length} in progress` },
    { ...STAT_CARDS[3], value: userData?.badges?.length ?? 0, sub: 'of 8 total' },
  ];

  return (
    <div className="app-container">
      <NavBar />

      <main className="main-content" aria-label="Dashboard">
        <div style={{ maxWidth: 940, margin: '0 auto' }}>

          {/* Welcome header */}
          <section
            className="np-card"
            style={{
              background: 'var(--gradient-primary)',
              border: 'none',
              marginBottom: '1.5rem',
              padding: '1.75rem 2rem',
            }}
            aria-labelledby="welcome-heading"
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <p
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.65)',
                    marginBottom: '0.35rem',
                  }}
                >
                  Welcome back
                </p>
                <h1
                  id="welcome-heading"
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.05em',
                    color: '#ffffff',
                    lineHeight: 1.1,
                    marginBottom: '0.5rem',
                  }}
                >
                  {userData?.displayName?.split(' ')[0] ?? 'Learner'}
                </h1>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>
                  Goal:{' '}
                  <span style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}>
                    {profile.goal}
                  </span>
                </p>
              </div>
              <Link
                href="/learn"
                className="btn"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', boxShadow: 'none', flexShrink: 0 }}
                aria-label="Continue learning"
              >
                Continue Learning <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
          </section>

          {/* Stat cards */}
          <section aria-labelledby="stats-heading" style={{ marginBottom: '1.5rem' }}>
            <h2 id="stats-heading" className="sr-only">Learning statistics</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {statValues.map((stat, i) => (
                <article
                  key={i}
                  className="np-card"
                  style={{ background: stat.bg, borderColor: stat.border, padding: '1.2rem' }}
                  aria-label={`${stat.label}: ${stat.value}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        color: stat.color,
                      }}
                    >
                      {stat.label}
                    </span>
                    {stat.icon && (
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 9,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: `${stat.color}1a`,
                        }}
                        aria-hidden="true"
                      >
                        <stat.icon size={14} style={{ color: stat.color }} />
                      </div>
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: 'Manrope, sans-serif',
                      fontSize: 'clamp(1.4rem, 2vw, 1.9rem)',
                      fontWeight: 800,
                      letterSpacing: '-0.05em',
                      color: 'var(--on-surface)',
                      lineHeight: 1,
                      marginBottom: '0.3rem',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--on-surface-variant)' }}>{stat.sub}</div>
                </article>
              ))}
            </div>
          </section>

          {/* XP Progress */}
          <section className="np-card" style={{ marginBottom: '1.5rem', padding: '1.25rem 1.5rem' }} aria-labelledby="xp-heading">
            <h2
              id="xp-heading"
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--secondary)',
                marginBottom: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <Zap size={14} style={{ color: 'var(--primary)' }} aria-hidden="true" />
              XP Progress
            </h2>
            <XPBar xp={userData?.xp ?? 0} />
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" style={{ marginBottom: '1.5rem' }}>
            {/* Roadmap Progress */}
            <section className="np-card" style={{ padding: '1.25rem 1.5rem' }} aria-labelledby="roadmap-heading">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2
                  id="roadmap-heading"
                  style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Target size={14} style={{ color: 'var(--primary)' }} aria-hidden="true" />
                  Roadmap
                </h2>
                <Link href="/roadmap" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--secondary)' }} aria-label="View full roadmap">
                  View all →
                </Link>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--on-surface-variant)' }}>{roadmapProgress}% complete</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--outline)' }}>
                  {profile.roadmap?.filter((c) => c.status === 'mastered').length ?? 0} / {profile.roadmap?.length ?? 0}
                </span>
              </div>

              <div
                style={{ height: 6, borderRadius: 99, overflow: 'hidden', background: 'var(--surface-container-high)', marginBottom: '1rem' }}
                role="progressbar" aria-valuenow={roadmapProgress} aria-valuemin={0} aria-valuemax={100}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${roadmapProgress}%`,
                    borderRadius: 99,
                    background: 'var(--gradient-primary)',
                    transition: 'width 1s ease',
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 180, overflowY: 'auto' }}>
                {profile.roadmap?.map((cluster) => (
                  <div key={cluster.clusterId} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.35rem 0' }}>
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: cluster.status === 'mastered' ? 'var(--pastel-mint)' : cluster.status === 'active' ? 'var(--pastel-lavender)' : 'var(--surface-container-high)',
                      }}
                      aria-hidden="true"
                    >
                      {cluster.status === 'mastered' ? (
                        <CheckCircle2 size={11} style={{ color: '#2d6a4f' }} />
                      ) : cluster.status === 'active' ? (
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)' }} />
                      ) : (
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--outline-variant)' }} />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '0.85rem',
                        color: cluster.status === 'mastered' ? '#2d6a4f' : cluster.status === 'active' ? 'var(--on-surface)' : 'var(--outline)',
                        fontWeight: cluster.status === 'active' ? 600 : 400,
                        flex: 1,
                      }}
                    >
                      {cluster.clusterName}
                    </span>
                    {cluster.status === 'active' && (
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 99,
                          background: 'var(--pastel-lavender)',
                          color: 'var(--primary)',
                          border: '1px solid var(--pastel-lavender-border)',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                        }}
                      >
                        Now
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Knowledge Snapshot */}
            <section className="np-card" style={{ padding: '1.25rem 1.5rem' }} aria-labelledby="knowledge-heading">
              <h2
                id="knowledge-heading"
                style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Brain size={14} style={{ color: 'var(--primary)' }} aria-hidden="true" />
                Knowledge
              </h2>

              {masteredConcepts.length === 0 && inProgressConcepts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }} aria-hidden="true">📊</div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--outline)', marginBottom: '1rem', lineHeight: 1.6 }}>
                    Start a session to build your knowledge graph.
                  </p>
                  <Link href="/learn" className="btn" style={{ fontSize: '0.8rem', padding: '0.55rem 1.1rem' }}>
                    <BookOpen size={13} />
                    Start Learning
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {inProgressConcepts.slice(0, 5).map((node) => (
                    <div key={node.concept}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontWeight: 500, textTransform: 'capitalize', color: 'var(--on-surface)' }}>{node.concept}</span>
                        <span style={{ fontWeight: 600, color: node.confidence > 60 ? '#2d6a4f' : '#b45309' }}>{node.confidence}%</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 99, overflow: 'hidden', background: 'var(--surface-container-high)' }}
                        role="progressbar" aria-valuenow={node.confidence} aria-valuemin={0} aria-valuemax={100}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${node.confidence}%`,
                            borderRadius: 99,
                            background: node.confidence > 60 ? '#2d6a4f' : node.confidence > 30 ? '#b45309' : 'var(--error)',
                            transition: 'width 0.7s ease',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                  {masteredConcepts.slice(0, 3).map((node) => (
                    <div key={node.concept} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <CheckCircle2 size={13} style={{ color: '#2d6a4f' }} aria-hidden="true" />
                      <span style={{ fontSize: '0.82rem', textTransform: 'capitalize', color: 'var(--on-surface-variant)' }}>{node.concept}</span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#2d6a4f', marginLeft: 'auto' }}>Mastered</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Badges */}
          <section className="np-card" style={{ padding: '1.25rem 1.5rem' }} aria-labelledby="badges-heading">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2
                id="badges-heading"
                style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Trophy size={14} style={{ color: '#b45309' }} aria-hidden="true" />
                Badges
              </h2>
              <Link href="/profile" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--secondary)' }} aria-label="View all badges">
                View all →
              </Link>
            </div>
            <BadgeDisplay earnedBadgeIds={userData?.badges ?? []} showAll={true} compact={true} />
          </section>

        </div>
      </main>
    </div>
  );
}
