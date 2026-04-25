'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Brain, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: 'var(--surface)' }}>
      <div className="max-w-2xl w-full space-y-12 animate-fade-up">
        {/* Brand */}
        <div className="flex flex-col items-center gap-4">
          <div className="sidebar-logo-icon w-16 h-16 shadow-lg">
            <Brain size={32} aria-hidden="true" />
          </div>
          <div className="space-y-1 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight font-headline" style={{ color: 'var(--primary)' }}>
              NeuralPath
            </h1>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--outline)' }}>
              Adaptive AI Learning
            </p>
          </div>
        </div>

        {/* Hero Content */}
        <div className="space-y-6">
          <h2 className="text-5xl md:text-6xl font-extrabold tracking-tight leading-tight font-headline text-center">
            Learning that <span className="gradient-text">adapts to you.</span>
          </h2>
          <p className="text-lg md:text-xl leading-relaxed max-w-lg mx-auto text-center" style={{ color: 'var(--secondary)' }}>
            An AI tutor that models your knowledge in real-time, adjusting every explanation to your unique pace.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-6 pt-4">
          {user ? (
            <Link href="/dashboard" className="btn-primary text-lg px-10 py-4 w-full sm:w-auto">
              Go to Dashboard
              <ArrowRight size={20} />
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn-primary text-lg px-10 py-4 w-full sm:w-auto">
                Start Learning Free
                <ArrowRight size={20} />
              </Link>
              <div className="flex items-center gap-6">
                <Link href="/login" className="text-sm font-semibold hover:underline" style={{ color: 'var(--secondary)' }}>
                  Sign In
                </Link>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="text-xs font-medium" style={{ color: 'var(--outline)' }}>
                  Secure with Google Auth
                </span>
              </div>
            </>
          )}
        </div>

        {/* Minimal Footer */}
        <footer className="pt-12 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'var(--outline)' }}>
            Powered by Gemini · LangGraph · Firebase
          </p>
        </footer>
      </div>
    </main>
  );
}
