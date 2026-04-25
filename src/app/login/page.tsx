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
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '2.5px solid var(--outline-variant)',
            borderTopColor: 'var(--primary)',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    );
  }

  return (
    <main
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        background:
          'radial-gradient(circle at top left, rgba(255,220,197,0.55), transparent 30%), linear-gradient(180deg, #f7f4ef 0%, #eef1f0 100%)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 400 }} className="animate-fade-up">
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '1rem',
              borderRadius: 18,
              background: 'var(--gradient-primary)',
              marginBottom: '1.25rem',
              boxShadow: '0 14px 32px rgba(18,40,60,0.18)',
            }}
            className="animate-pulse-glow"
            aria-hidden="true"
          >
            <Brain size={36} style={{ color: '#ffffff' }} />
          </div>
          <h1
            style={{
              fontFamily: 'Manrope, sans-serif',
              fontSize: '2rem',
              fontWeight: 800,
              letterSpacing: '-0.06em',
              color: 'var(--primary)',
              marginBottom: '0.35rem',
            }}
          >
            NeuralPath
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--secondary)' }}>Adaptive Learning Intelligence</p>
        </div>

        {/* Card */}
        <div className="np-card" style={{ padding: '2rem', marginBottom: '1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <h2
              style={{
                fontFamily: 'Manrope, sans-serif',
                fontSize: '1.4rem',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                color: 'var(--on-surface)',
                marginBottom: '0.4rem',
              }}
            >
              Welcome back
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
              Sign in to continue your learning journey
            </p>
          </div>

          {error && (
            <div
              role="alert"
              style={{
                fontSize: '0.875rem',
                borderRadius: 10,
                padding: '0.75rem 1rem',
                textAlign: 'center',
                color: 'var(--error)',
                background: 'var(--error-container)',
                border: '1px solid rgba(186,26,26,0.2)',
                marginBottom: '1.25rem',
              }}
            >
              {error}
            </div>
          )}

          <button
            id="google-signin-btn"
            onClick={handleGoogleSignIn}
            disabled={isSigningIn}
            className="btn-google"
            style={{ width: '100%', justifyContent: 'center' }}
            aria-label="Sign in with Google"
          >
            {isSigningIn ? (
              <>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    border: '2px solid var(--outline-variant)',
                    borderTopColor: 'var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
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

          <p style={{ fontSize: '0.75rem', textAlign: 'center', color: 'var(--outline)', marginTop: '1.25rem', lineHeight: 1.6 }}>
            By signing in, you agree to our Terms of Service.
            <br />
            Your learning data is locked to your account only.
          </p>
        </div>

        {/* Feature hints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {[
            { emoji: '🧠', text: 'AI that adapts to how you think' },
            { emoji: '🔍', text: 'Live search for every concept' },
            { emoji: '🏆', text: 'Badges and XP for staying consistent' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.65rem 0.85rem',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.65)',
                border: '1px solid rgba(18,40,60,0.07)',
                fontSize: '0.875rem',
                color: 'var(--on-surface-variant)',
              }}
            >
              <span aria-hidden="true">{item.emoji}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
