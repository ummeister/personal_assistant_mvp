import type { DailyBriefing, UserProfile } from '../types';
import { queryLLM } from './llm/client';
import { generateDailyBriefingPrompt } from './llm/prompts';
import { parseBriefingResponse } from './llm/parser';

export async function generateDailyBriefing(
  userProfile: UserProfile,
  date: Date
): Promise<DailyBriefing> {
  const prompt = generateDailyBriefingPrompt(userProfile, date);
  const response = await queryLLM(prompt);
  return parseBriefingResponse(response);
}