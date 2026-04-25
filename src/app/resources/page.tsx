'use client';

import { useEffect, useState } from 'react';
import { useAuth, getAuthHeaders } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import ResourceCard from '@/components/ResourceCard';
import { Library, Loader2, CheckCircle2 } from 'lucide-react';
import type { CuratedResource } from '@/lib/graph/state';

interface SavedResource extends CuratedResource {
  id?: string;
  savedAt?: string;
  completed: boolean;
  conceptTag?: string;
}

const RESOURCE_TYPES = ['all', 'article', 'video', 'documentation', 'paper', 'course', 'tool'];

export default function ResourcesPage() {
  const { user, loading, getIdToken } = useAuth();
  const router = useRouter();
  const [resources, setResources] = useState<SavedResource[]>([]);
  const [fetching, setFetching] = useState(false);
  const [filter, setFilter] = useState<string>('all');

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
        const res = await fetch('/api/resources/save', { headers });
        if (res.ok) {
          const data = await res.json();
          setResources(data.resources ?? []);
        }
      } catch {
        // empty state is fine
      } finally {
        setFetching(false);
      }
    };
    load();
  }, [user, getIdToken]);

  const filtered = filter === 'all' ? resources : resources.filter((r) => r.type === filter);

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

  return (
    <div className="app-container">
      <NavBar />
      <main className="main-content">
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.35rem' }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'var(--gradient-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  aria-hidden="true"
                >
                  <Library size={17} style={{ color: '#ffffff' }} />
                </div>
                <h1
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: 'clamp(1.4rem, 2.5vw, 1.75rem)',
                    fontWeight: 800,
                    letterSpacing: '-0.05em',
                    color: 'var(--primary)',
                  }}
                >
                  Resource Library
                </h1>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>
                Resources you&apos;ve saved from learning sessions
              </p>
            </div>
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 700,
                padding: '0.4rem 0.85rem',
                borderRadius: 99,
                background: 'var(--surface-container-high)',
                color: 'var(--secondary)',
                alignSelf: 'flex-start',
              }}
            >
              {resources.length} saved
            </div>
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }} role="tablist" aria-label="Filter resources by type">
            {RESOURCE_TYPES.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={filter === t}
                onClick={() => setFilter(t)}
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  padding: '0.35rem 0.9rem',
                  borderRadius: 99,
                  border: `1px solid ${filter === t ? 'var(--primary)' : 'var(--outline-variant)'}`,
                  background: filter === t ? 'var(--primary)' : 'var(--surface-container-lowest)',
                  color: filter === t ? '#ffffff' : 'var(--on-surface-variant)',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  transition: 'all 0.15s',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div
              className="np-card"
              style={{
                padding: '3.5rem 2rem',
                textAlign: 'center',
                background: 'var(--pastel-mint)',
                borderColor: 'var(--pastel-mint-border)',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }} aria-hidden="true">📚</div>
              <h2
                style={{
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: '1.2rem',
                  fontWeight: 700,
                  color: 'var(--on-surface)',
                  marginBottom: '0.5rem',
                }}
              >
                No saved resources yet
              </h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', maxWidth: '40ch', margin: '0 auto', lineHeight: 1.65 }}>
                Bookmark any resource card during a learning session to save it here.
              </p>
            </div>
          )}

          {/* Resource grid */}
          {filtered.length > 0 && (
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1rem' }}
              aria-label="Saved resources"
            >
              {filtered.map((r, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  {r.completed && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -8,
                        right: -8,
                        zIndex: 1,
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#2d6a4f',
                        border: '2px solid white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label="Completed"
                    >
                      <CheckCircle2 size={13} style={{ color: 'white' }} aria-hidden="true" />
                    </div>
                  )}
                  <ResourceCard resource={r} saved={true} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
