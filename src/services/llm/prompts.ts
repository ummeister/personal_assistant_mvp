import type { UserProfile } from '../../types';

export function generateDailyBriefingPrompt(userProfile: UserProfile, date: Date): string {
  return `
As an AI assistant, analyze the following user profile and generate a personalized daily briefing:

User Profile:
- Name: ${userProfile.name}
- Occupation: ${userProfile.occupation}
- Goals: ${userProfile.goals.join(', ')}
- Work Hours: ${userProfile.preferences.workHours}
- Communication Style: ${userProfile.preferences.communicationStyle}

Generate a structured daily briefing for ${date.toLocaleDateString()} that includes:

1. 3-5 key goals for the day, aligned with their long-term objectives
2. A detailed schedule that fits within their work hours
3. 2-3 personal insights based on their profile and past patterns
4. A motivational message that resonates with their goals and challenges

The response should be formatted in JSON with the following structure:
{
  "goals": ["goal1", "goal2", ...],
  "schedule": [{"time": "HH:MM", "task": "task description", "priority": "high|medium|low"}],
  "insights": ["insight1", "insight2", ...],
  "motivation": "motivational message"
}
`;