'use client';

import ReactMarkdown from 'react-markdown';
import { useState, useEffect } from 'react';

interface StreamingMessageProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

export default function StreamingMessage({
  content,
  isStreaming = false,
  className = '',
}: StreamingMessageProps) {
  const [displayedContent, setDisplayedContent] = useState('');
  const [charIndex, setCharIndex] = useState(0);

  useEffect(() => {
    // Reset when content changes significantly (new message)
    if (content.length === 0) {
      setDisplayedContent('');
      setCharIndex(0);
      return;
    }

    // If not streaming, show all at once
    if (!isStreaming) {
      setDisplayedContent(content);
      setCharIndex(content.length);
      return;
    }

    // Incremental reveal animation
    if (charIndex < content.length) {
      const batchSize = Math.max(3, Math.floor(content.length / 80));
      const timer = setTimeout(() => {
        const next = Math.min(charIndex + batchSize, content.length);
        setDisplayedContent(content.slice(0, next));
        setCharIndex(next);
      }, 12);
      return () => clearTimeout(timer);
    }
  }, [content, charIndex, isStreaming]);

  const isComplete = !isStreaming || charIndex >= content.length;

  return (
    <div className={`prose-neural ${className}`} aria-live={isStreaming ? 'polite' : 'off'}>
      <ReactMarkdown>{displayedContent}</ReactMarkdown>
      {!isComplete && (
        <span
          className="inline-flex gap-1 ml-1 align-middle"
          aria-label="Loading response"
          role="status"
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-purple-400"
              style={{
                animation: 'typing 1.2s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }}
              aria-hidden="true"
            />
          ))}
        </span>
      )}
    </div>
  );
}
