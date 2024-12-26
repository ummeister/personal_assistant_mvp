export interface UserProfile {
  id: string;
  name: string;
  email: string;
  occupation: string;
  goals: string[];
  preferences: {
    wakeUpTime: string;
    workHours: string;
    communicationStyle: string;
  };
  documents: string[];
}

export interface OnboardingQuestion {
  id: string;
  question: string;
  type: 'text' | 'multiline' | 'select' | 'multiselect';
  options?: string[];
  required: boolean;
}

export interface DailyBriefing {
  date: string;
  goals: string[];
  schedule: Array<{
    time: string;
    task: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  insights: string[];
  motivation: string;
}