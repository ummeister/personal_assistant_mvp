import React from 'react';
import {
  FolderSearch, Brain, Lightbulb, Rocket, Globe, DollarSign,
  AlertCircle, Loader2, ChevronRight,
} from 'lucide-react';
import type { DraftProject, DraftStatus } from '../types';

interface DraftCardProps {
  draft: DraftProject;
  onClick: () => void;
}

const STATUS_CONFIG: Record<DraftStatus, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
  discovered: { label: 'Scoperta', color: 'text-blue-600', icon: <FolderSearch className="w-4 h-4" />, bg: 'bg-blue-50' },
  scanning: { label: 'Scansione...', color: 'text-yellow-600', icon: <Loader2 className="w-4 h-4 animate-spin" />, bg: 'bg-yellow-50' },
  analyzing: { label: 'Analisi AI...', color: 'text-purple-600', icon: <Loader2 className="w-4 h-4 animate-spin" />, bg: 'bg-purple-50' },
  analyzed: { label: 'Analizzata', color: 'text-purple-600', icon: <Brain className="w-4 h-4" />, bg: 'bg-purple-50' },
  planning: { label: 'Pianificazione...', color: 'text-orange-600', icon: <Loader2 className="w-4 h-4 animate-spin" />, bg: 'bg-orange-50' },
  planned: { label: 'Piano pronto', color: 'text-orange-600', icon: <Lightbulb className="w-4 h-4" />, bg: 'bg-orange-50' },
  implementing: { label: 'In sviluppo', color: 'text-indigo-600', icon: <Loader2 className="w-4 h-4 animate-spin" />, bg: 'bg-indigo-50' },
  ready: { label: 'Pronta', color: 'text-green-600', icon: <Rocket className="w-4 h-4" />, bg: 'bg-green-50' },
  deployed: { label: 'Online', color: 'text-green-700', icon: <Globe className="w-4 h-4" />, bg: 'bg-green-50' },
  monetized: { label: 'Monetizzata', color: 'text-emerald-700', icon: <DollarSign className="w-4 h-4" />, bg: 'bg-emerald-50' },
  error: { label: 'Errore', color: 'text-red-600', icon: <AlertCircle className="w-4 h-4" />, bg: 'bg-red-50' },
};

export function DraftCard({ draft, onClick }: DraftCardProps) {
  const config = STATUS_CONFIG[draft.status];
  const pipelineProgress = draft.pipeline
    ? Math.round((draft.pipeline.steps.filter(s => s.status === 'completed').length / draft.pipeline.steps.length) * 100)
    : 0;

  return (
    <button
      onClick={onClick}
      className="bg-white rounded-xl border border-gray-200 p-5 text-left hover:shadow-lg hover:border-violet-300 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-900 text-lg group-hover:text-violet-700 transition-colors">
          {draft.analysis?.name || draft.name}
        </h3>
        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-violet-500 transition-colors" />
      </div>

      {draft.analysis && (
        <p className="text-sm text-gray-500 mb-3 line-clamp-2">{draft.analysis.description}</p>
      )}

      {/* Tech stack tags */}
      {draft.scan?.techStack && draft.scan.techStack.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {draft.scan.techStack.slice(0, 4).map(tech => (
            <span key={tech} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {tech}
            </span>
          ))}
          {draft.scan.techStack.length > 4 && (
            <span className="text-xs text-gray-400">+{draft.scan.techStack.length - 4}</span>
          )}
        </div>
      )}

      {/* Pipeline progress */}
      {draft.pipeline && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
            <span>Pipeline</span>
            <span>{pipelineProgress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all"
              style={{ width: `${pipelineProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Status badge */}
      <div className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${config.bg} ${config.color}`}>
        {config.icon}
        {config.label}
      </div>

      {/* Error message */}
      {draft.error && (
        <p className="mt-2 text-xs text-red-500 truncate">{draft.error}</p>
      )}

      {/* Timestamp */}
      <p className="mt-3 text-xs text-gray-400">
        {new Date(draft.updatedAt).toLocaleString('it-IT')}
      </p>
    </button>
  );
}
