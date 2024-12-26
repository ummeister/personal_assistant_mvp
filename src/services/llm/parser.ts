import type { DailyBriefing, LLMResponse } from '../../types';

export function parseBriefingResponse(response: LLMResponse): DailyBriefing {
  try {
    const parsed = JSON.parse(response.choices[0].text);
    
    return {
      date: new Date().toISOString(),
      goals: parsed.goals || [],
      schedule: parsed.schedule || [],
      insights: parsed.insights || [],
      motivation: parsed.motivation || '',
    };
  } catch (error) {
    throw new Error('Failed to parse LLM response');
  }
}