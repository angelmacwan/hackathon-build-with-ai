'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth, getAuthHeaders } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import NavBar from '@/components/NavBar';
import StreamingMessage from '@/components/StreamingMessage';
import ResourceCard from '@/components/ResourceCard';
import PDFUploader from '@/components/PDFUploader';
import { Send, Loader2, Paperclip, AlertCircle, Zap, Trophy } from 'lucide-react';
import type { SessionMessage, CuratedResource } from '@/lib/graph/state';
import type { Badge } from '@/lib/gamification/badges';
import { BADGES } from '@/lib/gamification/badges';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  resources?: CuratedResource[];
  pedagogyMode?: string;
  isStreaming?: boolean;
}

interface BadgeToast {
  badge: Badge;
  xp: number;
}

export default function LearnPage() {
  const { user, loading, getIdToken } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [badgeToast, setBadgeToast] = useState<BadgeToast | null>(null);
  const [xpGained, setXpGained] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/login');
  }, [user, loading, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const showBadgeToast = useCallback((badgeId: string, xp: number) => {
    const badge = BADGES[badgeId];
    if (!badge) return;
    setBadgeToast({ badge, xp });
    setTimeout(() => setBadgeToast(null), 5000);
  }, []);

  const saveResource = async (resource: CuratedResource) => {
    const headers = await getAuthHeaders(getIdToken);
    if (!headers) return;
    await fetch('/api/resources/save', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ resource }),
    });
  };

  const sendMessage = async () => {
    if (!input.trim() || isSending) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setIsSending(true);

    const userMsg: ChatMessage = { role: 'user', content: userMessage };
    const placeholder: ChatMessage = { role: 'assistant', content: '', isStreaming: true };
    setMessages((prev) => [...prev, userMsg, placeholder]);

    try {
      const headers = await getAuthHeaders(getIdToken);
      if (!headers) throw new Error('Not authenticated');

      const sessionHistory: SessionMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
        resources: m.resources,
        timestamp: new Date().toISOString(),
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, sessionId, sessionHistory }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to get response');
      }

      const data = await res.json();
      setSessionId(data.sessionId);

      setMessages((prev) => {
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = {
          role: 'assistant',
          content: data.response,
          resources: data.resources ?? [],
          pedagogyMode: data.pedagogyMode,
          isStreaming: true,
        };
        setTimeout(() => {
          setMessages((p) => {
            const u2 = [...p];
            if (u2[lastIdx]) u2[lastIdx] = { ...u2[lastIdx], isStreaming: false };
            return u2;
          });
        }, 100);
        return updated;
      });

      if (data.xpGained) {
        setXpGained(data.xpGained);
        setTimeout(() => setXpGained(null), 3000);
      }

      if (data.newBadges?.length > 0) {
        for (const badgeId of data.newBadges) {
          setTimeout(() => showBadgeToast(badgeId, BADGES[badgeId]?.xpReward ?? 0), 500);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--np-purple)' }} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: 'var(--bg-base)' }}>
      <NavBar />

      {/* Badge Toast */}
      {badgeToast && (
        <div
          className="fixed top-20 right-4 z-50 np-card p-4 flex items-center gap-3 animate-badge-pop max-w-xs shadow-lg"
          style={{ background: '#FEF3C7', borderColor: '#FCD34D' }}
          role="alert"
          aria-live="polite"
        >
          <span className="text-3xl" aria-hidden="true">{badgeToast.badge.emoji}</span>
          <div>
            <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
              Badge Unlocked! <Trophy size={12} className="inline" />
            </div>
            <div className="text-sm font-medium" style={{ color: 'var(--np-purple)' }}>
              {badgeToast.badge.name}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              +{badgeToast.xp} XP
            </div>
          </div>
        </div>
      )}

      {/* XP Toast */}
      {xpGained && (
        <div
          className="fixed top-20 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full animate-fade-up shadow-md"
          style={{ background: '#EDE9FE', border: '1px solid #C4B5FD' }}
          aria-live="polite"
        >
          <Zap size={14} style={{ color: 'var(--np-purple)' }} aria-hidden="true" />
          <span className="font-bold text-sm" style={{ color: 'var(--np-purple)' }}>+{xpGained} XP</span>
        </div>
      )}

      {/* Chat Area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 pb-36 md:pb-28">
        {/* Welcome state */}
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-20 animate-fade-up">
            <div className="text-5xl" aria-hidden="true">🧠</div>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                Ready to learn?
              </h1>
              <p className="mt-2 max-w-md" style={{ color: 'var(--text-secondary)' }}>
                Ask anything — a concept, a question, or what you want to learn today.
                NeuralPath will adapt to you.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {[
                'Explain recursion to me',
                'What is gradient descent?',
                'How does HTTP work?',
                'Teach me about photosynthesis',
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                  className="text-left p-3 rounded-xl border transition-all text-sm"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--np-purple)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--np-purple)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-default)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                  }}
                  aria-label={`Use starter prompt: ${prompt}`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="space-y-6 pt-6" role="log" aria-label="Conversation" aria-live="polite">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up`}
            >
              {msg.role === 'user' ? (
                <div
                  className="max-w-[80%] px-5 py-3 rounded-2xl rounded-tr-sm text-sm"
                  style={{ background: '#EDE9FE', border: '1px solid #C4B5FD' }}
                >
                  <p style={{ color: 'var(--text-primary)' }}>{msg.content}</p>
                </div>
              ) : (
                <div className="max-w-[90%] space-y-4 w-full">
                  {msg.pedagogyMode && (
                    <span
                      className={`mode-badge mode-${msg.pedagogyMode}`}
                      aria-label={`Teaching mode: ${msg.pedagogyMode}`}
                    >
                      {msg.pedagogyMode}
                    </span>
                  )}

                  {msg.isStreaming && msg.content ? (
                    <StreamingMessage content={msg.content} isStreaming={true} />
                  ) : msg.content ? (
                    <StreamingMessage content={msg.content} isStreaming={false} />
                  ) : (
                    <div className="flex items-center gap-2" aria-label="Thinking">
                      <Loader2 size={16} className="animate-spin" style={{ color: 'var(--np-purple)' }} aria-hidden="true" />
                      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Thinking…</span>
                    </div>
                  )}

                  {msg.resources && msg.resources.length > 0 && (
                    <div className="space-y-2" aria-label="Curated resources">
                      <div className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
                        <span aria-hidden="true">🔍</span> Live resources for this concept
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {msg.resources.map((r, ri) => (
                          <ResourceCard key={ri} resource={r} onSave={saveResource} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t"
        style={{
          background: 'rgba(255,255,255,0.97)',
          backdropFilter: 'blur(20px)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="max-w-4xl mx-auto px-4 py-3 space-y-2">
          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 text-sm rounded-xl px-4 py-2"
              style={{ color: '#dc2626', background: '#FEE2E2', border: '1px solid #FECACA' }}
            >
              <AlertCircle size={14} aria-hidden="true" />
              {error}
            </div>
          )}

          {showUploader && (
            <div className="np-card p-4">
              <PDFUploader
                onUploadComplete={(url, name) => {
                  setShowUploader(false);
                  setInput(`I've uploaded a PDF: "${name}". Please help me learn from it.`);
                }}
              />
            </div>
          )}

          <div className="flex items-end gap-3">
            <button
              onClick={() => setShowUploader((v) => !v)}
              className="p-3 rounded-xl border transition-all flex-shrink-0"
              style={
                showUploader
                  ? { borderColor: '#C4B5FD', background: '#EDE9FE', color: 'var(--np-purple)' }
                  : { borderColor: 'var(--border-default)', color: 'var(--text-muted)' }
              }
              aria-label="Upload PDF document"
              aria-pressed={showUploader}
            >
              <Paperclip size={18} aria-hidden="true" />
            </button>

            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question, share what you're confused about…"
                rows={1}
                className="input-field resize-none pr-12 min-h-[48px]"
                style={{ lineHeight: '1.5', paddingTop: '12px', paddingBottom: '12px' }}
                aria-label="Message input"
                disabled={isSending}
              />
            </div>

            <button
              id="send-message-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isSending}
              className="btn-primary px-4 py-3 flex-shrink-0"
              aria-label="Send message"
            >
              {isSending ? (
                <Loader2 size={18} className="animate-spin" aria-hidden="true" />
              ) : (
                <Send size={18} aria-hidden="true" />
              )}
            </button>
          </div>

          <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
