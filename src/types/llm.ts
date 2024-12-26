export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  endpoint: string;
  apiKey: string;
}

export interface LLMResponse {
  choices: Array<{
    text: string;
    finish_reason: string;
  }>;
}