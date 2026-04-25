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

const STYLE_COLORS = ['var(--primary)', 'var(--np-teal)', 'var(--np-gold)', 'var(--secondary)', 'var(--np-teal)'];

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
      <div className="app-container">
        <NavBar />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 className="animate-spin" size={28} style={{ color: 'var(--secondary)' }} />
        </div>
      </div>
    );
  }

  const userData = data?.userData;
  const profile = data?.profile;
  const levelInfo = calculateLevel(userData?.xp ?? 0);

  return (
    <div className="app-container">
      <NavBar />
      <main className="main-content">
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Profile hero card */}
          <section
            className="np-card"
            style={{
              background: 'var(--gradient-primary)',
              border: 'none',
              padding: '1.75rem 2rem',
            }}
            aria-labelledby="profile-heading"
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
              {/* Avatar */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                {userData?.photoURL ? (
                  <Image
                    src={userData.photoURL}
                    alt={userData.displayName ?? 'User avatar'}
                    width={80}
                    height={80}
                    style={{ borderRadius: '50%', border: '3px solid rgba(255,255,255,0.3)' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      border: '3px solid rgba(255,255,255,0.3)',
                      background: 'rgba(255,255,255,0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.75rem',
                      fontWeight: 700,
                      color: '#ffffff',
                    }}
                  >
                    {userData?.displayName?.[0] ?? 'U'}
                  </div>
                )}
                <div
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: 'var(--tertiary-fixed)',
                    color: 'var(--on-tertiary-fixed)',
                    border: '2px solid rgba(255,255,255,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                  }}
                  aria-label={`Level ${levelInfo.level}`}
                >
                  {levelInfo.level}
                </div>
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h1
                  id="profile-heading"
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    letterSpacing: '-0.04em',
                    color: '#ffffff',
                    marginBottom: '0.2rem',
                  }}
                >
                  {userData?.displayName ?? 'Learner'}
                </h1>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', marginBottom: '0.25rem' }}>{userData?.email}</p>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--tertiary-fixed)' }}>
                  {levelInfo.levelName} · Level {levelInfo.level}
                </p>
              </div>

              {/* Quick stats */}
              <div style={{ display: 'flex', gap: '1.5rem', flexShrink: 0 }}>
                {[
                  { value: userData?.totalConceptsMastered ?? 0, label: 'Mastered' },
                  { value: `${userData?.streakDays ?? 0}🔥`, label: 'Streak' },
                  { value: (userData?.xp ?? 0).toLocaleString(), label: 'Total XP' },
                ].map((s, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontFamily: 'Manrope, sans-serif',
                        fontSize: '1.4rem',
                        fontWeight: 800,
                        letterSpacing: '-0.04em',
                        color: '#ffffff',
                        lineHeight: 1,
                        marginBottom: '0.25rem',
                      }}
                    >
                      {s.value}
                    </div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.6)' }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* XP Progress */}
          <section className="np-card" style={{ padding: '1.25rem 1.5rem' }} aria-labelledby="xp-progress-heading">
            <h2
              id="xp-progress-heading"
              style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}
            >
              <Star size={13} style={{ color: '#b45309' }} aria-hidden="true" />
              XP Progress
            </h2>
            <XPBar xp={userData?.xp ?? 0} />
          </section>

          {/* Learning Goal */}
          {profile?.goal && (
            <section
              className="np-card"
              style={{ background: 'var(--pastel-mint)', borderColor: 'var(--pastel-mint-border)', padding: '1.25rem 1.5rem' }}
              aria-labelledby="goal-heading"
            >
              <h2
                id="goal-heading"
                style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#2d6a4f', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}
              >
                <BookOpen size={13} aria-hidden="true" />
                Current Goal
              </h2>
              <p style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--on-surface)', marginBottom: '0.3rem' }}>{profile.goal}</p>
              <div style={{ fontSize: '0.78rem', textTransform: 'capitalize', color: 'var(--on-surface-variant)' }}>
                Difficulty: {profile.difficultyPreference ?? 'balanced'}
              </div>
            </section>
          )}

          {/* Learning Style */}
          {profile?.learningStyle && (
            <section className="np-card" style={{ padding: '1.25rem 1.5rem' }} aria-labelledby="style-heading">
              <h2
                id="style-heading"
                style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}
              >
                <Brain size={13} style={{ color: 'var(--primary)' }} aria-hidden="true" />
                Detected Learning Style
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {Object.entries(STYLE_LABELS).map(([key, label], idx) => {
                  const value = profile.learningStyle[key];
                  if (typeof value !== 'number') return null;
                  const pct = Math.round(value * 100);
                  return (
                    <div key={key}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 500, color: 'var(--on-surface)' }}>{label}</span>
                        <span style={{ color: 'var(--outline)' }}>{pct}%</span>
                      </div>
                      <div
                        style={{ height: 5, borderRadius: 99, overflow: 'hidden', background: 'var(--surface-container-high)' }}
                        role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}
                        aria-label={`${label}: ${pct}%`}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${pct}%`,
                            borderRadius: 99,
                            background: STYLE_COLORS[idx % STYLE_COLORS.length],
                            transition: 'width 0.7s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: '0.75rem', marginTop: '0.85rem', color: 'var(--outline)', lineHeight: 1.55 }}>
                Automatically inferred from your learning conversations. Updates over time.
              </p>
            </section>
          )}

          {/* Badges */}
          <section className="np-card" style={{ padding: '1.25rem 1.5rem' }} aria-labelledby="profile-badges-heading">
            <h2
              id="profile-badges-heading"
              style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}
            >
              <Trophy size={13} style={{ color: '#b45309' }} aria-hidden="true" />
              Badge Collection
              <span style={{ fontSize: '0.78rem', fontWeight: 500, color: 'var(--outline)', marginLeft: '0.25rem', textTransform: 'none', letterSpacing: 'normal' }}>
                ({userData?.badges?.length ?? 0}/8 earned)
              </span>
            </h2>
            <BadgeDisplay earnedBadgeIds={userData?.badges ?? []} showAll={true} compact={false} />
          </section>

        </div>
      </main>
    </div>
  );
}
