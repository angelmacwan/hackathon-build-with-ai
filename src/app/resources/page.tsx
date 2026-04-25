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
      <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-base)' }}>
        <NavBar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--np-purple)' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <NavBar />
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-6 pb-24 md:pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
              <Library style={{ color: 'var(--np-purple)' }} aria-hidden="true" />
              Resource Library
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Resources you&apos;ve saved from learning sessions
            </p>
          </div>
          <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
            {resources.length} saved
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Filter resources by type">
          {RESOURCE_TYPES.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={filter === t}
              onClick={() => setFilter(t)}
              className="text-xs px-4 py-1.5 rounded-full border transition-all capitalize font-medium"
              style={
                filter === t
                  ? { background: '#1A1A1A', color: 'white', borderColor: '#1A1A1A' }
                  : { borderColor: 'var(--border-default)', color: 'var(--text-secondary)', background: 'white' }
              }
            >
              {t}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div
            className="np-card p-16 text-center space-y-4"
            style={{ background: '#CCFBF1', borderColor: '#5EEAD4' }}
          >
            <div className="text-5xl" aria-hidden="true">📚</div>
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              No saved resources yet
            </h2>
            <p className="text-sm max-w-sm mx-auto" style={{ color: 'var(--text-secondary)' }}>
              When you&apos;re in a learning session, click the bookmark icon on any resource card to save it here.
            </p>
          </div>
        )}

        {/* Resource grid */}
        {filtered.length > 0 && (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            aria-label="Saved resources"
          >
            {filtered.map((r, i) => (
              <div key={i} className="relative">
                {r.completed && (
                  <div
                    className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--np-teal)', border: '2px solid white' }}
                    aria-label="Completed"
                  >
                    <CheckCircle2 size={14} className="text-white" aria-hidden="true" />
                  </div>
                )}
                <ResourceCard resource={r} saved={true} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
