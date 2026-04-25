'use client';

import { ExternalLink, Clock, BookOpen, Video, FileText, FlaskConical, GraduationCap, Wrench, Bookmark, BookmarkCheck } from 'lucide-react';
import { useState } from 'react';
import type { CuratedResource, ResourceType, DifficultyLevel } from '@/lib/graph/state';

interface ResourceCardProps {
  resource: CuratedResource;
  onSave?: (resource: CuratedResource) => Promise<void>;
  saved?: boolean;
}

const RESOURCE_ICONS: Record<ResourceType, React.ComponentType<{ size?: number; style?: React.CSSProperties }>> = {
  article: FileText,
  video: Video,
  documentation: BookOpen,
  paper: FlaskConical,
  course: GraduationCap,
  tool: Wrench,
};

const RESOURCE_PASTELS: Record<ResourceType, { bg: string; border: string; color: string }> = {
  article:       { bg: '#EDE9FE', border: '#C4B5FD', color: '#6d28d9' },
  video:         { bg: '#FCE7F3', border: '#F9A8D4', color: '#BE185D' },
  documentation: { bg: '#CCFBF1', border: '#5EEAD4', color: '#0d9488' },
  paper:         { bg: '#EDE9FE', border: '#C4B5FD', color: '#6d28d9' },
  course:        { bg: '#FEF3C7', border: '#FCD34D', color: '#d97706' },
  tool:          { bg: '#CCFBF1', border: '#5EEAD4', color: '#0d9488' },
};

const DIFFICULTY_STYLE: Record<DifficultyLevel, { bg: string; color: string; border: string }> = {
  beginner:     { bg: '#CCFBF1', color: '#0d9488', border: '#5EEAD4' },
  intermediate: { bg: '#FEF3C7', color: '#d97706', border: '#FCD34D' },
  advanced:     { bg: '#FCE7F3', color: '#BE185D', border: '#F9A8D4' },
};

export default function ResourceCard({ resource, onSave, saved = false }: ResourceCardProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(saved);

  const Icon = RESOURCE_ICONS[resource.type] ?? FileText;
  const pastel = RESOURCE_PASTELS[resource.type] ?? RESOURCE_PASTELS.article;
  const diffStyle = DIFFICULTY_STYLE[resource.difficulty] ?? DIFFICULTY_STYLE.intermediate;

  const handleSave = async () => {
    if (!onSave || isSaved) return;
    setIsSaving(true);
    try {
      await onSave(resource);
      setIsSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <article
      className="np-card p-4 space-y-3 group"
      style={{ borderColor: pastel.border }}
      aria-label={`Resource: ${resource.title}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: pastel.bg, border: `1px solid ${pastel.border}` }}
          aria-hidden="true"
        >
          <Icon size={16} style={{ color: pastel.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-sm flex items-center gap-1.5 transition-colors group/link"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = pastel.color)}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            aria-label={`Open ${resource.title} in new tab`}
          >
            <span className="line-clamp-2">{resource.title}</span>
            <ExternalLink size={12} className="opacity-0 group-hover/link:opacity-60 flex-shrink-0 transition-opacity" aria-hidden="true" />
          </a>
          {resource.sourceDomain && (
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{resource.sourceDomain}</div>
          )}
        </div>
      </div>

      {/* Why recommended */}
      <p className="text-xs leading-relaxed pl-12" style={{ color: 'var(--text-secondary)' }}>
        {resource.whyRecommended}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pl-12">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize"
            style={{ background: diffStyle.bg, color: diffStyle.color, border: `1px solid ${diffStyle.border}` }}
            aria-label={`Difficulty: ${resource.difficulty}`}
          >
            {resource.difficulty}
          </span>
          <span
            className="text-[10px] flex items-center gap-1"
            style={{ color: 'var(--text-muted)' }}
            aria-label={`Estimated time: ${resource.estimatedMinutes} minutes`}
          >
            <Clock size={10} aria-hidden="true" />
            {resource.estimatedMinutes} min
          </span>
        </div>

        {onSave && (
          <button
            onClick={handleSave}
            disabled={isSaved || isSaving}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg"
            aria-label={isSaved ? 'Resource saved' : 'Save resource to library'}
          >
            {isSaved ? (
              <BookmarkCheck size={15} style={{ color: 'var(--np-purple)' }} />
            ) : (
              <Bookmark size={15} style={{ color: 'var(--text-muted)' }} />
            )}
          </button>
        )}
      </div>
    </article>
  );
}
