import type { LLMConfig } from '../../types';

export const llmConfig: LLMConfig = {
  model: 'mixtral-8x7b',
  temperature: 0.7,
  maxTokens: 2048,
  // Add your model endpoint here
  endpoint: process.env.LLM_API_ENDPOINT || '',
  apiKey: process.env.LLM_API_KEY || '',
};