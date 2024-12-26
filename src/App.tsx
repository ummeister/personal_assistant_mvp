import React, { useState } from 'react';
import { Onboarding } from './components/Onboarding';
import { DailyBriefingView } from './components/DailyBriefing';
import { LoadingState } from './components/LoadingState';
import { ErrorState } from './components/ErrorState';
import { useLLMResponse } from './hooks/useLLMResponse';
import type { UserProfile } from './types';

function App() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { briefing, loading, error } = useLLMResponse(userProfile);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
  };

  if (!userProfile) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => setUserProfile(userProfile)} />;
  }

  if (!briefing) {
    return null;
  }

  return <DailyBriefingView briefing={briefing} />;
}

export default App;