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

      {/* Toasts */}
      {badgeToast && (
        <div
          className="np-card animate-badge-pop"
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: '1.5rem',
            zIndex: 50,
            padding: '1rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'var(--pastel-peach)',
            borderColor: 'var(--pastel-peach-border)',
            maxWidth: 300,
            boxShadow: 'var(--shadow-elevated)',
          }}
          role="alert"
          aria-live="polite"
        >
          <span style={{ fontSize: '2rem' }} aria-hidden="true">{badgeToast.badge.emoji}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--on-surface)', marginBottom: '0.15rem' }}>
              Badge Unlocked! <Trophy size={11} className="inline" />
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)' }}>{badgeToast.badge.name}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--on-surface-variant)' }}>+{badgeToast.xp} XP</div>
          </div>
        </div>
      )}

      {xpGained && (
        <div
          className="animate-fade-up"
          style={{
            position: 'fixed',
            top: '1.5rem',
            right: badgeToast ? '340px' : '1.5rem',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.4rem 0.9rem',
            borderRadius: 99,
            background: 'var(--pastel-lavender)',
            border: '1px solid var(--pastel-lavender-border)',
            boxShadow: 'var(--shadow-sm)',
          }}
          aria-live="polite"
        >
          <Zap size={13} style={{ color: 'var(--primary)' }} aria-hidden="true" />
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>+{xpGained} XP</span>
        </div>
      )}

      {/* Main chat area – flex column so input stays at bottom without fixed positioning */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
        {/* Scrollable messages */}
        <main
          style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 2rem 1rem' }}
          role="log"
          aria-label="Conversation"
          aria-live="polite"
        >
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            {/* Welcome state */}
            {messages.length === 0 && (
              <div className="animate-fade-up" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '4rem 1rem', gap: '1.5rem' }}>
                <div style={{ fontSize: '3.5rem' }} aria-hidden="true">🧠</div>
                <div>
                  <h1 style={{ fontFamily: 'Manrope, sans-serif', fontSize: '1.8rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                    Ready to learn?
                  </h1>
                  <p style={{ fontSize: '0.95rem', color: 'var(--on-surface-variant)', maxWidth: 420, lineHeight: 1.65 }}>
                    Ask anything — NeuralPath adapts every explanation to your pace and style.
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: '0.65rem', width: '100%', maxWidth: 480 }}>
                  {[
                    'Explain recursion to me',
                    'What is gradient descent?',
                    'How does HTTP work?',
                    'Teach me about photosynthesis',
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(prompt); textareaRef.current?.focus(); }}
                      style={{
                        textAlign: 'left',
                        padding: '0.8rem 1rem',
                        borderRadius: 10,
                        border: '1px solid var(--outline-variant)',
                        color: 'var(--on-surface-variant)',
                        background: 'var(--surface-container-lowest)',
                        fontSize: '0.875rem',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, color 0.15s',
                        lineHeight: 1.45,
                        fontFamily: 'Inter, sans-serif',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--primary)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.borderColor = 'var(--outline-variant)';
                        (e.currentTarget as HTMLElement).style.color = 'var(--on-surface-variant)';
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingTop: messages.length > 0 ? '0.5rem' : 0 }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className="animate-fade-up"
                  style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                >
                  {msg.role === 'user' ? (
                    <div
                      style={{
                        maxWidth: '80%',
                        padding: '0.75rem 1.1rem',
                        borderRadius: '14px 14px 4px 14px',
                        background: 'var(--gradient-primary)',
                        color: '#ffffff',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {msg.content}
                    </div>
                  ) : (
                    <div style={{ maxWidth: '90%', width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} aria-label="Thinking">
                          <Loader2 size={15} className="animate-spin" style={{ color: 'var(--secondary)' }} aria-hidden="true" />
                          <span style={{ fontSize: '0.875rem', color: 'var(--on-surface-variant)' }}>Thinking…</span>
                        </div>
                      )}

                      {msg.resources && msg.resources.length > 0 && (
                        <div aria-label="Curated resources">
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--outline)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span aria-hidden="true">🔍</span> Resources for this concept
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: '0.5rem' }}>
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
          </div>
        </main>

        {/* Input bar – sticks to bottom of flex container, no fixed positioning needed */}
        <div
          style={{
            borderTop: '1px solid var(--outline-variant)',
            background: 'var(--surface-container-lowest)',
            padding: '0.85rem 2rem 1rem',
            flexShrink: 0,
          }}
        >
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            {error && (
              <div
                role="alert"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.85rem',
                  borderRadius: 8,
                  padding: '0.6rem 0.85rem',
                  color: 'var(--error)',
                  background: 'var(--error-container)',
                  border: '1px solid rgba(186,26,26,0.2)',
                  marginBottom: '0.65rem',
                }}
              >
                <AlertCircle size={13} aria-hidden="true" />
                {error}
              </div>
            )}

            {showUploader && (
              <div className="np-card" style={{ marginBottom: '0.65rem', padding: '1rem' }}>
                <PDFUploader
                  onUploadComplete={(url, name) => {
                    setShowUploader(false);
                    setInput(`I've uploaded a PDF: "${name}". Please help me learn from it.`);
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.65rem' }}>
              <button
                onClick={() => setShowUploader((v) => !v)}
                style={{
                  padding: '0.65rem',
                  borderRadius: 8,
                  border: `1px solid ${showUploader ? 'var(--primary)' : 'var(--outline-variant)'}`,
                  background: showUploader ? 'var(--pastel-lavender)' : 'var(--surface-container-lowest)',
                  color: showUploader ? 'var(--primary)' : 'var(--outline)',
                  flexShrink: 0,
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                aria-label="Upload PDF document"
                aria-pressed={showUploader}
              >
                <Paperclip size={17} aria-hidden="true" />
              </button>

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask a question, share what you're confused about…"
                rows={1}
                className="input-field"
                style={{ resize: 'none', minHeight: 46, lineHeight: 1.5, paddingTop: '0.7rem', paddingBottom: '0.7rem', flex: 1 }}
                aria-label="Message input"
                disabled={isSending}
              />

              <button
                id="send-message-btn"
                onClick={sendMessage}
                disabled={!input.trim() || isSending}
                className="btn-primary"
                style={{ padding: '0.7rem 1rem', flexShrink: 0 }}
                aria-label="Send message"
              >
                {isSending ? (
                  <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Send size={17} aria-hidden="true" />
                )}
              </button>
            </div>

            <p style={{ fontSize: '0.7rem', textAlign: 'center', color: 'var(--outline)', marginTop: '0.5rem' }}>
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
