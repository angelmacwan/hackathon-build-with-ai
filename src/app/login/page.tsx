'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Brain } from 'lucide-react';

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.push('/dashboard');
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setError(null);
    try {
      await signInWithGoogle();
      // AuthContext handles cookie and its onAuthStateChanged will trigger redirect via the useEffect
      setIsSigningIn(false);
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Sign-in failed. Please try again.');
      }
      setIsSigningIn(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div
          className="w-10 h-10 rounded-full border-3 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--pastel-lavender-border)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <main
      className="min-h-dvh flex items-center justify-center px-6"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-full max-w-sm space-y-8 animate-fade-up">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div
            className="inline-flex p-4 rounded-2xl animate-pulse-glow"
            style={{ background: '#EDE9FE', border: '2px solid #C4B5FD' }}
            aria-hidden="true"
          >
            <Brain size={40} style={{ color: 'var(--np-purple)' }} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight gradient-text">NeuralPath</h1>
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Adaptive Learning Intelligence
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="np-card p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              Welcome back
            </h2>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Sign in to continue your learning journey
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="text-sm rounded-xl px-4 py-3 text-center"
              style={{
                color: '#dc2626',
                background: '#FEE2E2',
                border: '1px solid #FECACA',
              }}
            >
              {error}
            </div>
          )}

          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="btn-google w-full justify-center"
            aria-label="Sign in with Google"
          >
            {isSigningIn ? (
              <>
                <div
                  className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: '#9CA3AF', borderTopColor: 'transparent' }}
                />
                Signing in…
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            By signing in, you agree to our Terms of Service and Privacy Policy.
            <br />
            Your learning data is locked to your account only.
          </p>
        </div>

        {/* Feature hints */}
        <div className="space-y-3 text-sm">
          {[
            { emoji: '🧠', text: 'AI that adapts to how you think' },
            { emoji: '🔍', text: 'Live Google Search for every concept' },
            { emoji: '🏆', text: 'Badges and XP for staying consistent' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 px-2" style={{ color: 'var(--text-secondary)' }}>
              <span aria-hidden="true">{item.emoji}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
