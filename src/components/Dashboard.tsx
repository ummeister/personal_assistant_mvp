import React from 'react';
import { FolderOpen, RefreshCw, Loader2 } from 'lucide-react';
import type { DraftProject } from '../types';
import { DraftCard } from './DraftCard';

interface DashboardProps {
  drafts: DraftProject[];
  watchDir: string;
  loading: boolean;
  error: string | null;
  onSelectDraft: (id: string) => void;
  onRefresh: () => void;
}

export function Dashboard({ drafts, watchDir, loading, error, onSelectDraft, onRefresh }: DashboardProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Status bar */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FolderOpen className="w-4 h-4" />
          <span>Monitorando: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{watchDir}</code></span>
          <span className="text-green-500 ml-2">&#9679; attivo</span>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Aggiorna
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
        </div>
      )}

      {/* Empty state */}
      {!loading && drafts.length === 0 && (
        <div className="text-center py-20">
          <FolderOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Nessuna bozza trovata</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Aggiungi una sottocartella nella directory <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{watchDir}</code> per
            iniziare. Ogni sottocartella verra' trattata come una bozza di micro-SaaS da analizzare e monetizzare.
          </p>
        </div>
      )}

      {/* Draft grid */}
      {!loading && drafts.length > 0 && (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              {drafts.length} {drafts.length === 1 ? 'bozza' : 'bozze'} trovate
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drafts.map(draft => (
              <DraftCard key={draft.id} draft={draft} onClick={() => onSelectDraft(draft.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
