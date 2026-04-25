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
  { key: 'xp',       label: 'Total XP',           icon: Zap,     bg: '#EDE9FE', border: '#C4B5FD', color: '#6d28d9' },
  { key: 'streak',   label: 'Day Streak',          icon: null,    bg: '#FEF3C7', border: '#FCD34D', color: '#d97706' },
  { key: 'concepts', label: 'Concepts Mastered',   icon: Brain,   bg: '#CCFBF1', border: '#5EEAD4', color: '#0d9488' },
  { key: 'badges',   label: 'Badges Earned',       icon: Trophy,  bg: '#FCE7F3', border: '#F9A8D4', color: '#BE185D' },
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
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-base)' }}>
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--np-purple)' }} />
        </div>
      </div>
    );
  }

  if (!data?.profile?.goal) {
    return null;
  }

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
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <NavBar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-6 pb-24 md:pb-8">
        {/* Welcome Header */}
        <section
          className="np-card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: '#EDE9FE', borderColor: '#C4B5FD' }}
          aria-labelledby="welcome-heading"
        >
          <div className="space-y-1">
            <h1 id="welcome-heading" className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Hi, {userData?.displayName?.split(' ')[0] ?? 'Learner'}! 👋
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Goal: <span className="font-semibold" style={{ color: 'var(--np-purple)' }}>{profile.goal}</span>
            </p>
          </div>
          <Link href="/learn" className="btn-primary flex-shrink-0" aria-label="Continue learning">
            Continue Learning <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>

        {/* Stats Row */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">Learning statistics</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statValues.map((stat, i) => (
              <article
                key={i}
                className="np-card p-5 space-y-2"
                style={{ background: stat.bg, borderColor: stat.border }}
                aria-label={`${stat.label}: ${stat.value}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: stat.color }}>
                    {stat.label}
                  </span>
                  {stat.icon && (
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: `${stat.color}18` }}
                      aria-hidden="true"
                    >
                      <stat.icon size={16} style={{ color: stat.color }} />
                    </div>
                  )}
                </div>
                <div className="text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>{stat.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{stat.sub}</div>
              </article>
            ))}
          </div>
        </section>

        {/* XP Progress */}
        <section className="np-card p-5" aria-labelledby="xp-heading">
          <h2 id="xp-heading" className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Zap size={16} style={{ color: 'var(--np-purple)' }} aria-hidden="true" />
            XP Progress
          </h2>
          <XPBar xp={userData?.xp ?? 0} />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Roadmap Progress */}
          <section className="np-card p-5 space-y-4" aria-labelledby="roadmap-heading">
            <div className="flex items-center justify-between">
              <h2 id="roadmap-heading" className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <Target size={16} style={{ color: 'var(--np-teal)' }} aria-hidden="true" />
                Roadmap Progress
              </h2>
              <Link
                href="/roadmap"
                className="text-xs font-medium transition-colors"
                style={{ color: 'var(--np-purple)' }}
                aria-label="View full roadmap"
              >
                View all →
              </Link>
            </div>

            <div className="flex items-center justify-between text-sm mb-2">
              <span style={{ color: 'var(--text-secondary)' }}>{roadmapProgress}% complete</span>
              <span style={{ color: 'var(--text-muted)' }}>
                {profile.roadmap?.filter((c) => c.status === 'mastered').length ?? 0} /{' '}
                {profile.roadmap?.length ?? 0} clusters
              </span>
            </div>

            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: '#E5E7EB' }}
              role="progressbar"
              aria-valuenow={roadmapProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Roadmap ${roadmapProgress}% complete`}
            >
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${roadmapProgress}%`,
                  background: 'linear-gradient(90deg, var(--np-teal), var(--np-purple))',
                }}
              />
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {profile.roadmap?.map((cluster) => (
                <div key={cluster.clusterId} className="flex items-center gap-3 py-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                    aria-hidden="true"
                    style={{
                      background:
                        cluster.status === 'mastered'
                          ? '#CCFBF1'
                          : cluster.status === 'active'
                          ? '#EDE9FE'
                          : '#F3F4F6',
                    }}
                  >
                    {cluster.status === 'mastered' ? (
                      <CheckCircle2 size={12} style={{ color: 'var(--np-teal)' }} />
                    ) : cluster.status === 'active' ? (
                      <div className="w-2 h-2 rounded-full" style={{ background: 'var(--np-purple)' }} />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-300" />
                    )}
                  </div>
                  <span
                    className="text-sm"
                    style={{
                      color:
                        cluster.status === 'mastered'
                          ? 'var(--np-teal)'
                          : cluster.status === 'active'
                          ? 'var(--text-primary)'
                          : 'var(--text-muted)',
                      fontWeight: cluster.status === 'active' ? 600 : 400,
                    }}
                  >
                    {cluster.clusterName}
                  </span>
                  {cluster.status === 'active' && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full border ml-auto"
                      style={{ background: '#EDE9FE', color: 'var(--np-purple)', borderColor: '#C4B5FD' }}
                    >
                      Current
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Knowledge Snapshot */}
          <section className="np-card p-5 space-y-4" aria-labelledby="knowledge-heading">
            <h2 id="knowledge-heading" className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Brain size={16} style={{ color: 'var(--np-purple)' }} aria-hidden="true" />
              Knowledge Snapshot
            </h2>

            {masteredConcepts.length === 0 && inProgressConcepts.length === 0 ? (
              <div className="text-center py-6 space-y-3">
                <div className="text-4xl" aria-hidden="true">📊</div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Start a learning session to build your knowledge graph.
                </p>
                <Link href="/learn" className="btn-primary inline-flex text-sm px-5 py-2.5">
                  <BookOpen size={14} />
                  Start Learning
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {inProgressConcepts.slice(0, 5).map((node) => (
                  <div key={node.concept} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium capitalize" style={{ color: 'var(--text-primary)' }}>
                        {node.concept}
                      </span>
                      <span
                        className="font-semibold"
                        style={{ color: node.confidence > 60 ? 'var(--np-teal)' : 'var(--np-gold)' }}
                      >
                        {node.confidence}%
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: '#E5E7EB' }}
                      role="progressbar"
                      aria-valuenow={node.confidence}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${node.confidence}%`,
                          background:
                            node.confidence > 60
                              ? 'var(--np-teal)'
                              : node.confidence > 30
                              ? 'var(--np-gold)'
                              : 'var(--np-red)',
                        }}
                      />
                    </div>
                  </div>
                ))}
                {masteredConcepts.slice(0, 3).map((node) => (
                  <div key={node.concept} className="flex items-center gap-2">
                    <CheckCircle2 size={14} style={{ color: 'var(--np-teal)' }} aria-hidden="true" />
                    <span className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>
                      {node.concept}
                    </span>
                    <span className="text-xs ml-auto font-semibold" style={{ color: 'var(--np-teal)' }}>
                      Mastered
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Badges */}
        <section className="np-card p-5" aria-labelledby="badges-heading">
          <div className="flex items-center justify-between mb-4">
            <h2 id="badges-heading" className="font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Trophy size={16} style={{ color: 'var(--np-gold)' }} aria-hidden="true" />
              Badges
            </h2>
            <Link
              href="/profile"
              className="text-xs font-medium"
              style={{ color: 'var(--np-purple)' }}
              aria-label="View all badges"
            >
              View all →
            </Link>
          </div>
          <BadgeDisplay earnedBadgeIds={userData?.badges ?? []} showAll={true} compact={true} />
        </section>
      </main>
    </div>
  );
}
