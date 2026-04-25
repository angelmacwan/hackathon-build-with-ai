'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Brain, Zap, Map, BarChart2, Search, ArrowRight, Shield, Cpu } from 'lucide-react';

const PASTEL_COLORS = [
  '#EDE9FE', '#CCFBF1', '#FEF3C7', '#FCE7F3', '#CCFBF1', '#EDE9FE',
];

const features = [
  { icon: Brain,    title: 'Adaptive Knowledge Graph',  description: 'A live map of everything you know. Tracks concept confidence 0–100 and updates after every message.', bg: '#EDE9FE', border: '#C4B5FD' },
  { icon: Search,   title: 'Live Resource Curation',    description: 'After every concept, the Resource Agent surfaces the best articles, videos, and docs matched to your level.', bg: '#CCFBF1', border: '#5EEAD4' },
  { icon: Zap,      title: '6 Specialized AI Agents',   description: 'Intake → Profile → Curriculum → Resource → Pedagogy → Evaluator. Full LangGraph pipeline per message.', bg: '#FEF3C7', border: '#FCD34D' },
  { icon: Map,      title: 'Personalized Roadmaps',     description: 'Enter any learning goal and get a dependency-ordered roadmap that auto-adjusts as you demonstrate knowledge.', bg: '#FCE7F3', border: '#F9A8D4' },
  { icon: BarChart2,title: 'Spaced Repetition',         description: 'Mastered concepts are scheduled for SM-2 review. Never forget what you learned.', bg: '#CCFBF1', border: '#5EEAD4' },
  { icon: Shield,   title: 'Secure & Private',          description: 'Firebase Auth with Google Sign-In. Firestore security rules lock all data strictly to your account.', bg: '#EDE9FE', border: '#C4B5FD' },
];

const agents = [
  { name: 'Intake',     desc: 'Classifies intent, detects confusion',         color: '#6d28d9', bg: '#EDE9FE', icon: '🎯' },
  { name: 'Profile',    desc: 'Updates knowledge graph & learning style',      color: '#0d9488', bg: '#CCFBF1', icon: '🧠' },
  { name: 'Curriculum', desc: 'ZPD-based next concept selection',              color: '#059669', bg: '#D1FAE5', icon: '🗺️' },
  { name: 'Resource',   desc: 'Google Search · curates live content',          color: '#d97706', bg: '#FEF3C7', icon: '🔍' },
  { name: 'Pedagogy',   desc: 'Chooses mode · generates explanation',          color: '#BE185D', bg: '#FCE7F3', icon: '📖' },
  { name: 'Evaluator',  desc: 'Scores 0–100 · advance or reinforce decision',  color: '#0d9488', bg: '#CCFBF1', icon: '✅' },
];

const badges = [
  { emoji: '🌱', name: 'Seedling',      desc: 'First session' },
  { emoji: '🔥', name: 'On Fire',       desc: '3-day streak' },
  { emoji: '🧠', name: 'Deep Thinker',  desc: '10 concepts' },
  { emoji: '🏆', name: 'Scholar',       desc: 'Full roadmap' },
  { emoji: '⚡', name: 'Speed Learner', desc: 'Single session' },
  { emoji: '💎', name: 'Diamond Mind',  desc: '30-day streak' },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  return (
    <main className="min-h-dvh" style={{ background: 'var(--bg-base)' }}>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative flex flex-col items-center justify-center min-h-dvh px-6 text-center"
        aria-labelledby="hero-heading"
      >
        <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-fade-up">
          {/* Tag */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            style={{ background: '#EDE9FE', color: '#6d28d9', border: '1px solid #C4B5FD' }}
          >
            <Cpu size={14} aria-hidden="true" />
            6-Agent LangGraph · Gemini · Firebase
          </div>

          <h1
            id="hero-heading"
            className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Learning that{' '}
            <span className="gradient-text">adapts to you,</span>
            <br />
            not the other way.
          </h1>

          <p className="text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            NeuralPath is an AI-powered tutor with 6 specialized agents that understand{' '}
            <em className="not-italic font-semibold" style={{ color: 'var(--text-primary)' }}>how</em>{' '}
            you think — adjusting every explanation, exercise, and curated resource to your pace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login" className="btn-primary text-lg px-8 py-4" aria-label="Get started">
              Start Learning Free
              <ArrowRight size={20} />
            </Link>
            <Link href="#features" className="btn-secondary text-lg px-8 py-4">
              See How It Works
            </Link>
          </div>

          {/* Social proof avatars */}
          <div className="flex items-center justify-center gap-3 text-sm" style={{ color: 'var(--text-muted)' }}>
            <div className="flex -space-x-2">
              {['🧑‍💻', '👩‍🎓', '🧑‍🔬', '👨‍🏫'].map((e, i) => (
                <div
                  key={i}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-base border-2 border-white"
                  style={{ background: '#EDE9FE' }}
                  aria-hidden="true"
                >
                  {e}
                </div>
              ))}
            </div>
            <span>Adaptive · Live Resources · Gamified</span>
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto" aria-labelledby="features-heading">
        <div className="text-center mb-16">
          <h2
            id="features-heading"
            className="text-3xl md:text-5xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Built different.{' '}
            <span className="gradient-text">Learns smarter.</span>
          </h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Not another chatbot. A stateful multi-agent system that models your knowledge,
            curates live resources, and adapts its teaching style to you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <article
              key={i}
              className="np-card p-6 space-y-4"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: f.bg, border: `1px solid ${f.border}` }}
                aria-hidden="true"
              >
                <f.icon size={22} style={{ color: f.border.replace('FD', 'd9').replace('EA', 'A8') }} />
              </div>
              <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{f.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Agent Pipeline ─────────────────────────────────────────────── */}
      <section className="py-24 px-6" aria-labelledby="pipeline-heading">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2
            id="pipeline-heading"
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Every message runs through{' '}
            <span className="gradient-text">6 AI agents</span>
          </h2>
        </div>

        <div className="max-w-sm mx-auto">
          <div className="flex flex-col items-center gap-0">
            {agents.map((agent, i) => (
              <div key={i} className="flex flex-col items-center w-full">
                <div
                  className="np-card w-full p-4 flex items-center gap-4"
                  style={{ borderColor: `${agent.color}30`, background: agent.bg }}
                >
                  <span className="text-2xl" aria-hidden="true">{agent.icon}</span>
                  <div>
                    <div className="font-bold text-sm" style={{ color: agent.color }}>
                      {agent.name} Agent
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{agent.desc}</div>
                  </div>
                </div>
                {i < agents.length - 1 && (
                  <div
                    className="w-px h-5 my-1"
                    style={{ background: `${agent.color}60` }}
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gamification ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 max-w-5xl mx-auto" aria-labelledby="badges-heading">
        <div className="text-center mb-12">
          <h2
            id="badges-heading"
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Learn. Master. <span className="gradient-text-gold">Earn.</span>
          </h2>
          <p className="mt-3" style={{ color: 'var(--text-secondary)' }}>
            Badges, XP, and levels reward your consistency and growth.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {badges.map((b, i) => (
            <div
              key={i}
              className="np-card p-4 text-center space-y-2"
              style={{ background: PASTEL_COLORS[i], animationDelay: `${i * 0.05}s` }}
            >
              <div className="text-3xl animate-float" style={{ animationDelay: `${i * 0.4}s` }}>
                {b.emoji}
              </div>
              <div className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{b.name}</div>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" aria-labelledby="cta-heading">
        <div
          className="max-w-2xl mx-auto text-center np-card p-12 space-y-6"
          style={{ background: '#EDE9FE', borderColor: '#C4B5FD' }}
        >
          <div className="text-5xl" aria-hidden="true">🚀</div>
          <h2
            id="cta-heading"
            className="text-3xl md:text-4xl font-bold"
            style={{ color: 'var(--text-primary)' }}
          >
            Ready to learn smarter?
          </h2>
          <p style={{ color: 'var(--text-secondary)' }}>
            Sign in with Google — it takes 10 seconds. Your learning journey starts immediately.
          </p>
          <Link
            href="/login"
            className="btn-primary text-lg px-10 py-4 inline-flex"
            aria-label="Sign in with Google and start learning"
          >
            Sign in with Google
            <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer
        className="py-8 px-6 text-center text-sm border-t"
        style={{ color: 'var(--text-muted)', borderColor: 'var(--border-subtle)' }}
      >
        NeuralPath · Powered by Gemini, LangGraph, Firebase
      </footer>
    </main>
  );
}
