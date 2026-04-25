'use client';

import { useEffect, useState } from 'react';
import { useAuth, getAuthHeaders } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import BadgeDisplay from '@/components/BadgeDisplay';
import XPBar from '@/components/XPBar';
import { Loader2, Brain, BookOpen, Trophy, Star } from 'lucide-react';
import Image from 'next/image';
import { calculateLevel } from '@/lib/gamification/xp';

interface ProfileData {
  userData: {
    displayName: string;
    email: string;
    photoURL: string;
    xp: number;
    level: number;
    streakDays: number;
    totalConceptsMastered: number;
    badges: string[];
    createdAt?: any;
  };
  profile: {
    goal: string;
    difficultyPreference: string;
    learningStyle: Record<string, number | string>;
  };
}

const STYLE_LABELS: Record<string, string> = {
  prefersAnalogy:   'Analogy',
  prefersSocratic:  'Socratic',
  prefersNarrative: 'Narrative',
  prefersDrill:     'Practice',
  prefersVisual:    'Visual',
};

const STYLE_COLORS = ['#EDE9FE', '#CCFBF1', '#FEF3C7', '#FCE7F3', '#CCFBF1'];

export default function ProfilePage() {
  const { user, loading, getIdToken } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ProfileData | null>(null);
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

  const userData = data?.userData;
  const profile = data?.profile;
  const levelInfo = calculateLevel(userData?.xp ?? 0);

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <NavBar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 space-y-6 pb-24 md:pb-8">

        {/* Profile Card */}
        <section
          className="np-card p-6 flex flex-col sm:flex-row items-center gap-6"
          style={{ background: '#EDE9FE', borderColor: '#C4B5FD' }}
          aria-labelledby="profile-heading"
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {userData?.photoURL ? (
              <Image
                src={userData.photoURL}
                alt={userData.displayName ?? 'User avatar'}
                width={96}
                height={96}
                className="rounded-full border-4 border-white shadow-md"
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full border-4 border-white shadow-md flex items-center justify-center text-3xl font-bold text-white"
                style={{ background: 'var(--np-purple)' }}
              >
                {userData?.displayName?.[0] ?? 'U'}
              </div>
            )}
            <div
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white border-2 border-white shadow-sm"
              style={{ background: 'var(--np-purple)' }}
              aria-label={`Level ${levelInfo.level}`}
            >
              {levelInfo.level}
            </div>
          </div>

          {/* Info */}
          <div className="text-center sm:text-left space-y-1 flex-1">
            <h1 id="profile-heading" className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {userData?.displayName ?? 'Learner'}
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{userData?.email}</p>
            <p className="text-sm font-semibold" style={{ color: 'var(--np-purple)' }}>
              {levelInfo.levelName} · Level {levelInfo.level}
            </p>
          </div>

          {/* Quick stats */}
          <div className="flex gap-6 text-center">
            {[
              { value: userData?.totalConceptsMastered ?? 0, label: 'Mastered', color: 'var(--np-teal)' },
              { value: `${userData?.streakDays ?? 0}🔥`, label: 'Streak', color: 'var(--np-gold)' },
              { value: (userData?.xp ?? 0).toLocaleString(), label: 'Total XP', color: 'var(--np-purple)' },
            ].map((s, i) => (
              <div key={i}>
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* XP Progress */}
        <section className="np-card p-5" aria-labelledby="xp-progress-heading">
          <h2 id="xp-progress-heading" className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Star size={16} style={{ color: 'var(--np-gold)' }} aria-hidden="true" />
            XP Progress
          </h2>
          <XPBar xp={userData?.xp ?? 0} />
        </section>

        {/* Learning Goal */}
        {profile?.goal && (
          <section
            className="np-card p-5"
            style={{ background: '#CCFBF1', borderColor: '#5EEAD4' }}
            aria-labelledby="goal-heading"
          >
            <h2 id="goal-heading" className="font-semibold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <BookOpen size={16} style={{ color: 'var(--np-teal)' }} aria-hidden="true" />
              Current Goal
            </h2>
            <p className="font-medium" style={{ color: 'var(--np-teal)' }}>{profile.goal}</p>
            <div className="mt-2 text-xs capitalize" style={{ color: 'var(--text-muted)' }}>
              Difficulty: {profile.difficultyPreference ?? 'balanced'}
            </div>
          </section>
        )}

        {/* Learning Style */}
        {profile?.learningStyle && (
          <section className="np-card p-5" aria-labelledby="style-heading">
            <h2 id="style-heading" className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Brain size={16} style={{ color: 'var(--np-purple)' }} aria-hidden="true" />
              Detected Learning Style
            </h2>
            <div className="space-y-3">
              {Object.entries(STYLE_LABELS).map(([key, label], idx) => {
                const value = profile.learningStyle[key];
                if (typeof value !== 'number') return null;
                const pct = Math.round(value * 100);
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{pct}%</span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: '#E5E7EB' }}
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${label}: ${pct}%`}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          background: STYLE_COLORS[idx % STYLE_COLORS.length].replace('#', '').startsWith('EDE')
                            ? 'var(--np-purple)'
                            : STYLE_COLORS[idx % STYLE_COLORS.length].replace('#', '').startsWith('CCF')
                            ? 'var(--np-teal)'
                            : STYLE_COLORS[idx % STYLE_COLORS.length].replace('#', '').startsWith('FEF')
                            ? 'var(--np-gold)'
                            : 'var(--np-purple)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
              Automatically inferred from your learning conversations. Updates over time.
            </p>
          </section>
        )}

        {/* Badges */}
        <section className="np-card p-5" aria-labelledby="profile-badges-heading">
          <h2
            id="profile-badges-heading"
            className="font-semibold mb-4 flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            <Trophy size={16} style={{ color: 'var(--np-gold)' }} aria-hidden="true" />
            Badge Collection
            <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
              ({userData?.badges?.length ?? 0}/8 earned)
            </span>
          </h2>
          <BadgeDisplay earnedBadgeIds={userData?.badges ?? []} showAll={true} compact={false} />
        </section>
      </main>
    </div>
  );
}
