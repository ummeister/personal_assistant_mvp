import { useState, useEffect } from 'react';
import type { DailyBriefing, UserProfile } from '../types';
import { generateDailyBriefing } from '../services/llm';

export function useLLMResponse(userProfile: UserProfile | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [briefing, setBriefing] = useState<DailyBriefing | null>(null);

  useEffect(() => {
    async function fetchBriefing() {
      if (!userProfile) return;

      setLoading(true);
      setError(null);

      try {
        const result = await generateDailyBriefing(userProfile, new Date());
        setBriefing(result);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to generate briefing'));
      } finally {
        setLoading(false);
      }
    }

    fetchBriefing();
  }, [userProfile]);

  return { briefing, loading, error };
}