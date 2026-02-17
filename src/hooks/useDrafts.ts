import { useState, useEffect, useCallback } from 'react';
import type { DraftProject } from '../types';
import { api } from '../services/api';

export function useDrafts() {
  const [drafts, setDrafts] = useState<DraftProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [watchDir, setWatchDir] = useState('');

  const fetchDrafts = useCallback(async () => {
    try {
      const data = await api.getDrafts();
      setDrafts(data.drafts);
      setWatchDir(data.watchDir);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch drafts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
    const interval = setInterval(fetchDrafts, 3000);
    return () => clearInterval(interval);
  }, [fetchDrafts]);

  return { drafts, loading, error, watchDir, refresh: fetchDrafts };
}

export function useDraft(id: string | null) {
  const [draft, setDraft] = useState<DraftProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDraft = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.getDraft(id);
      setDraft(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch draft');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDraft();
  }, [fetchDraft]);

  const runFullPipeline = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      const data = await api.fullPipeline(id);
      setDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pipeline failed');
    } finally {
      setActionLoading(false);
    }
  };

  const analyze = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      const data = await api.analyzeDraft(id);
      setDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setActionLoading(false);
    }
  };

  const monetize = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      const data = await api.monetizeDraft(id);
      setDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Monetization failed');
    } finally {
      setActionLoading(false);
    }
  };

  const completeStep = async (stepId: string) => {
    if (!id) return;
    try {
      const data = await api.completeStep(id, stepId);
      setDraft(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Step completion failed');
    }
  };

  const setupStripe = async () => {
    if (!id) return;
    try {
      setActionLoading(true);
      await api.setupStripe(id);
      await fetchDraft();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Stripe setup failed');
    } finally {
      setActionLoading(false);
    }
  };

  return {
    draft,
    loading,
    error,
    actionLoading,
    refresh: fetchDraft,
    runFullPipeline,
    analyze,
    monetize,
    completeStep,
    setupStripe,
  };
}
