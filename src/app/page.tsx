'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Brain, Zap, Map, BarChart2, Search, ArrowRight, Shield, Cpu, BookOpen, Trophy } from 'lucide-react';

const features = [
  { icon: Brain,    title: 'Adaptive Knowledge Graph',  description: 'A live map of everything you know. Tracks concept confidence 0–100 and updates after every message.', bg: 'var(--pastel-lavender)', border: 'var(--pastel-lavender-border)' },
  { icon: Search,   title: 'Live Resource Curation',    description: 'After every concept, the Resource Agent surfaces the best articles, videos, and docs matched to your level.', bg: 'var(--pastel-mint)', border: 'var(--pastel-mint-border)' },
  { icon: Zap,      title: '6 Specialized AI Agents',   description: 'Intake → Profile → Curriculum → Resource → Pedagogy → Evaluator. Full LangGraph pipeline per message.', bg: 'var(--pastel-peach)', border: 'var(--pastel-peach-border)' },
  { icon: Map,      title: 'Personalized Roadmaps',     description: 'Enter any learning goal and get a dependency-ordered roadmap that auto-adjusts as you demonstrate knowledge.', bg: 'var(--pastel-pink)', border: 'var(--pastel-pink-border)' },
  { icon: BarChart2,title: 'Spaced Repetition',         description: 'Mastered concepts are scheduled for SM-2 review. Never forget what you learned.', bg: 'var(--pastel-mint)', border: 'var(--pastel-mint-border)' },
  { icon: Shield,   title: 'Secure & Private',          description: 'Firebase Auth with Google Sign-In. Firestore security rules lock all data strictly to your account.', bg: 'var(--pastel-lavender)', border: 'var(--pastel-lavender-border)' },
];

const agents = [
  { name: 'Intake',     desc: 'Classifies intent, detects confusion',         color: 'var(--primary)', bg: 'var(--pastel-lavender)', icon: '🎯' },
  { name: 'Profile',    desc: 'Updates knowledge graph & learning style',      color: 'var(--success-color)', bg: 'var(--pastel-mint)', icon: '🧠' },
  { name: 'Curriculum', desc: 'ZPD-based next concept selection',              color: 'var(--success-color)', bg: 'var(--surface-container-high)', icon: '🗺️' },
  { name: 'Resource',   desc: 'Google Search · curates live content',          color: 'var(--np-gold)', bg: 'var(--pastel-peach)', icon: '🔍' },
  { name: 'Pedagogy',   desc: 'Chooses mode · generates explanation',          color: 'var(--error)', bg: 'var(--pastel-pink)', icon: '📖' },
  { name: 'Evaluator',  desc: 'Scores 0–100 · advance or reinforce decision',  color: 'var(--success-color)', bg: 'var(--pastel-mint)', icon: '✅' },
];

const badges = [
  { emoji: '🌱', name: 'Seedling',      desc: 'First session', bg: 'var(--pastel-mint)' },
  { emoji: '🔥', name: 'On Fire',       desc: '3-day streak', bg: 'var(--pastel-peach)' },
  { emoji: '🧠', name: 'Deep Thinker',  desc: '10 concepts', bg: 'var(--pastel-lavender)' },
  { emoji: '🏆', name: 'Scholar',       desc: 'Full roadmap', bg: 'var(--pastel-pink)' },
  { emoji: '⚡', name: 'Speed Learner', desc: 'Single session', bg: 'var(--pastel-mint)' },
  { emoji: '💎', name: 'Diamond Mind',  desc: '30-day streak', bg: 'var(--pastel-peach)' },
];

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  return (
    <main className="min-h-dvh" style={{ background: 'var(--surface)' }}>
      {/* ── Navigation ── */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="sidebar-logo-icon w-9 h-9">
            <Brain size={18} aria-hidden="true" />
          </div>
          <div className="flex flex-col">
            <div className="sidebar-brand-name">NeuralPath</div>
            <div className="sidebar-brand-sub">Adaptive AI</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <Link href="/dashboard" className="btn-primary py-2 px-5">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="font-semibold text-sm hover:underline" style={{ color: 'var(--secondary)' }}>
                Sign In
              </Link>
              <Link href="/login" className="btn-primary py-2 px-5">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative flex flex-col items-center justify-center min-h-[85vh] px-6 text-center"
        aria-labelledby="hero-heading"
      >
        <div className="relative z-10 max-w-4xl mx-auto space-y-8 animate-fade-up">
          {/* Tag */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{ background: 'var(--pastel-lavender)', color: 'var(--primary)', border: '1px solid var(--pastel-lavender-border)' }}
          >
            <Cpu size={14} aria-hidden="true" />
            6-Agent LangGraph · Gemini · Firebase
          </div>

          <h1
            id="hero-heading"
            className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight font-headline"
            style={{ color: 'var(--primary)' }}
          >
            Learning that{' '}
            <span className="gradient-text">adapts to you.</span>
          </h1>

          <p className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--secondary)' }}>
            NeuralPath is an AI tutor that models your knowledge in real-time. 
            It adjusts every explanation, exercise, and curated resource to your unique pace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/login" className="btn-primary text-base px-8 py-3.5" aria-label="Get started">
              Start Learning Free
              <ArrowRight size={18} />
            </Link>
            <Link href="#features" className="btn-secondary text-base px-8 py-3.5">
              How it works
            </Link>
          </div>

          {/* Social proof avatars */}
          <div className="flex items-center justify-center gap-3 text-xs font-semibold uppercase tracking-wide pt-4" style={{ color: 'var(--outline)' }}>
            <div className="flex -space-x-2">
              {['🧑‍💻', '👩‍🎓', '🧑‍🔬', '👨‍🏫'].map((e, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-white shadow-sm"
                  style={{ background: 'var(--pastel-lavender)' }}
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
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto" aria-labelledby="features-heading">
        <div className="text-center mb-16">
          <h2
            id="features-heading"
            className="text-3xl md:text-5xl font-extrabold tracking-tight font-headline"
            style={{ color: 'var(--primary)' }}
          >
            Built different.{' '}
            <span className="gradient-text">Learns smarter.</span>
          </h2>
          <p className="mt-4 text-lg max-w-2xl mx-auto" style={{ color: 'var(--secondary)' }}>
            Not another chatbot. A stateful multi-agent system that models your knowledge,
            curates live resources, and adapts its teaching style to you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <article
              key={i}
              className="np-card p-7 space-y-4"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: f.bg, border: `1px solid ${f.border}` }}
                aria-hidden="true"
              >
                <f.icon size={22} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 className="font-bold text-xl font-headline" style={{ color: 'var(--primary)' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--on-surface-variant)' }}>{f.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Agent Pipeline ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white border-y border-default" aria-labelledby="pipeline-heading">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
             <Zap size={20} className="text-amber-600 fill-amber-600" />
             <span className="text-xs font-bold uppercase tracking-widest text-amber-600">The Brain</span>
          </div>
          <h2
            id="pipeline-heading"
            className="text-3xl md:text-4xl font-extrabold tracking-tight font-headline"
            style={{ color: 'var(--primary)' }}
          >
            Every message runs through<br />
            <span className="gradient-text">6 specialized AI agents</span>
          </h2>
        </div>

        <div className="max-w-xl mx-auto">
          <div className="flex flex-col items-center gap-0">
            {agents.map((agent, i) => (
              <div key={i} className="flex flex-col items-center w-full">
                <div
                  className="np-card w-full p-5 flex items-center gap-5"
                  style={{ borderLeft: `4px solid ${agent.color}`, background: agent.bg }}
                >
                  <span className="text-2xl" aria-hidden="true">{agent.icon}</span>
                  <div>
                    <div className="font-extrabold text-sm tracking-tight" style={{ color: 'var(--primary)' }}>
                      {agent.name} Agent
                    </div>
                    <div className="text-xs font-medium opacity-80" style={{ color: 'var(--secondary)' }}>{agent.desc}</div>
                  </div>
                </div>
                {i < agents.length - 1 && (
                  <div
                    className="w-px h-6 my-0"
                    style={{ background: 'var(--outline-variant)' }}
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Gamification ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 max-w-7xl mx-auto" aria-labelledby="badges-heading">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
             <Trophy size={20} className="text-amber-500" />
             <span className="text-xs font-bold uppercase tracking-widest text-amber-600">Gamified</span>
          </div>
          <h2
            id="badges-heading"
            className="text-3xl md:text-4xl font-extrabold tracking-tight font-headline"
            style={{ color: 'var(--primary)' }}
          >
            Learn. Master. <span style={{ color: 'var(--np-gold)' }}>Earn.</span>
          </h2>
          <p className="mt-3 text-lg" style={{ color: 'var(--secondary)' }}>
            Badges, XP, and levels reward your consistency and growth.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {badges.map((b, i) => (
            <div
              key={i}
              className="np-card p-5 text-center space-y-3"
              style={{ background: b.bg, animationDelay: `${i * 0.05}s` }}
            >
              <div className="text-4xl animate-float" style={{ animationDelay: `${i * 0.4}s` }}>
                {b.emoji}
              </div>
              <div className="font-bold text-sm" style={{ color: 'var(--primary)' }}>{b.name}</div>
              <div className="text-xs font-medium" style={{ color: 'var(--secondary)' }}>{b.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6" aria-labelledby="cta-heading">
        <div
          className="max-w-3xl mx-auto text-center np-card p-14 space-y-8"
          style={{ background: 'var(--gradient-primary)', border: 'none', boxShadow: 'var(--shadow-elevated)' }}
        >
          <div className="text-6xl" aria-hidden="true">🚀</div>
          <div className="space-y-3">
            <h2
              id="cta-heading"
              className="text-3xl md:text-5xl font-extrabold font-headline text-white tracking-tight"
            >
              Ready to learn smarter?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)' }} className="text-lg">
              Sign in with Google — it takes 10 seconds. 
              Your personalized learning journey starts immediately.
            </p>
          </div>
          <Link
            href="/login"
            className="btn py-4 px-10 text-lg"
            style={{ background: 'white', color: 'var(--primary)', boxShadow: 'none' }}
            aria-label="Sign in with Google and start learning"
          >
            Start Your Journey
            <ArrowRight size={22} />
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer
        className="py-12 px-6 text-center border-t"
        style={{ background: 'var(--surface-container-low)', borderColor: 'var(--outline-variant)' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="sidebar-logo-icon w-8 h-8 opacity-80">
              <Brain size={16} aria-hidden="true" />
            </div>
            <div className="sidebar-brand-name opacity-80" style={{ fontSize: '0.9rem' }}>NeuralPath</div>
          </div>
          <div className="text-xs font-medium" style={{ color: 'var(--outline)' }}>
             © 2026 NeuralPath · Powered by Gemini, LangGraph & Firebase
          </div>
          <div className="flex gap-6 text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--secondary)' }}>
             <Link href="#" className="hover:underline">Terms</Link>
             <Link href="#" className="hover:underline">Privacy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
