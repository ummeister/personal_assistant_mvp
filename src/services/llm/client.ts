import type { LLMResponse } from '../../types';
import { llmConfig } from './config';

export async function queryLLM(prompt: string): Promise<LLMResponse> {
  const response = await fetch(llmConfig.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${llmConfig.apiKey}`,
    },
    body: JSON.stringify({
      model: llmConfig.model,
      prompt,
      temperature: llmConfig.temperature,
      max_tokens: llmConfig.maxTokens,
      response_format: { type: "json_object" }
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.statusText}`);
  }

  return response.json();