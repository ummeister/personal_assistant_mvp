import React, { useState } from 'react';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { DraftDetail } from './components/DraftDetail';
import { SettingsView } from './components/SettingsView';
import { useDrafts, useDraft } from './hooks/useDrafts';

type View = 'dashboard' | 'detail' | 'settings';

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);

  const { drafts, loading, error, watchDir, refresh } = useDrafts();
  const {
    draft,
    actionLoading,
    analyze,
    monetize,
    runFullPipeline,
    completeStep,
    setupStripe,
    refresh: refreshDraft,
  } = useDraft(selectedDraftId);

  const handleSelectDraft = (id: string) => {
    setSelectedDraftId(id);
    setView('detail');
  };

  const handleBack = () => {
    setSelectedDraftId(null);
    setView('dashboard');
    refresh();
  };

  const handleSettings = () => setView('settings');

  const title =
    view === 'detail' && draft
      ? draft.analysis?.name || draft.name
      : view === 'settings'
      ? 'Configurazione'
      : undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={title}
        onBack={view !== 'dashboard' ? handleBack : undefined}
        onSettings={view === 'dashboard' ? handleSettings : undefined}
      />

      {view === 'dashboard' && (
        <Dashboard
          drafts={drafts}
          watchDir={watchDir}
          loading={loading}
          error={error}
          onSelectDraft={handleSelectDraft}
          onRefresh={refresh}
        />
      )}

      {view === 'detail' && draft && (
        <DraftDetail
          draft={draft}
          actionLoading={actionLoading}
          onAnalyze={async () => { await analyze(); refreshDraft(); }}
          onMonetize={async () => { await monetize(); refreshDraft(); }}
          onFullPipeline={async () => { await runFullPipeline(); refreshDraft(); }}
          onCompleteStep={completeStep}
          onSetupStripe={setupStripe}
        />
      )}

      {view === 'settings' && <SettingsView />}
    </div>
  );
}

export default App;
