'use client';

import { useEffect, useState } from 'react';
import { useAuth, getAuthHeaders } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import ResourceCard from '@/components/ResourceCard';
import { Library, Loader2, CheckCircle2, Sparkles } from 'lucide-react';
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

  const [discovered, setDiscovered] = useState<CuratedResource[]>([]);
  const [fetchingDiscovered, setFetchingDiscovered] = useState(false);

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

  useEffect(() => {
    if (!user) return;
    setFetchingDiscovered(true);
    const discover = async () => {
      try {
        const headers = await getAuthHeaders(getIdToken);
        if (!headers) return;
        const res = await fetch('/api/resources/discover', { headers });
        if (res.ok) {
          const data = await res.json();
          setDiscovered(data.resources ?? []);
        }
      } catch {
        // fail silently for recommended
      } finally {
        setFetchingDiscovered(false);
      }
    };
    discover();
  }, [user, getIdToken]);

  const saveResource = async (resource: CuratedResource) => {
    const headers = await getAuthHeaders(getIdToken);
    if (!headers) return;
    const res = await fetch('/api/resources/save', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource }),
    });
    if (res.ok) {
      setResources((prev) => [...prev, { ...resource, completed: false } as SavedResource]);
    }
  };

  const isSaved = (url: string) => resources.some((r) => r.url === url);

  const filteredSaved = filter === 'all' ? resources : resources.filter((r) => r.type === filter);
  const filteredDiscovered = filter === 'all' ? discovered : discovered.filter((r) => r.type === filter);

  if (loading || (fetching && resources.length === 0)) {
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
                Discover new resources and manage your saved items
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
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '2.5rem' }} role="tablist" aria-label="Filter resources by type">
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

          {/* Recommended Section */}
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontFamily: 'Manrope, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
              <Sparkles size={18} style={{ color: '#f59e0b' }} /> Recommended For You
            </h2>
            
            {fetchingDiscovered ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2rem', background: 'var(--surface-container-lowest)', borderRadius: 14, border: '1px dashed var(--outline-variant)' }}>
                <Loader2 size={18} className="animate-spin" style={{ color: 'var(--secondary)' }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>Discovering live web resources for your current topic...</span>
              </div>
            ) : filteredDiscovered.length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>No new recommendations available at the moment.</p>
            ) : (
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1rem' }}
                aria-label="Recommended resources"
              >
                {filteredDiscovered.map((r, i) => (
                  <div key={i}>
                    <ResourceCard resource={r} onSave={saveResource} saved={isSaved(r.url)} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Saved Section */}
          <div>
            <h2 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.25rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '1rem' }}>
              Saved Resources
            </h2>
            
            {/* Empty state */}
            {filteredSaved.length === 0 && (
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
                <h3
                  style={{
                    fontFamily: 'Manrope, sans-serif',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    color: 'var(--on-surface)',
                    marginBottom: '0.5rem',
                  }}
                >
                  No saved resources yet
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)', maxWidth: '40ch', margin: '0 auto', lineHeight: 1.65 }}>
                  Bookmark any recommended resource or save from a learning session.
                </p>
              </div>
            )}

            {/* Resource grid */}
            {filteredSaved.length > 0 && (
              <div
                style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px,1fr))', gap: '1rem' }}
                aria-label="Saved resources"
              >
                {filteredSaved.map((r, i) => (
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
        </div>
      </main>
    </div>
  );
}
