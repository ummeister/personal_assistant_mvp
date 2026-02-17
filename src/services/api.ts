import type { DraftProject, DraftListResponse, ApiResponse } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const json: ApiResponse<T> = await res.json();

  if (!json.success) {
    throw new Error(json.error || 'API request failed');
  }

  return json.data as T;
}

export const api = {
  // Drafts
  getDrafts: () => request<DraftListResponse>('/drafts'),
  getDraft: (id: string) => request<DraftProject>(`/drafts/${id}`),

  // Analysis
  scanDraft: (id: string) => request<DraftProject>(`/drafts/${id}/scan`, { method: 'POST' }),
  analyzeDraft: (id: string) => request<DraftProject>(`/drafts/${id}/analyze`, { method: 'POST' }),

  // Monetization
  monetizeDraft: (id: string) => request<DraftProject>(`/drafts/${id}/monetize`, { method: 'POST' }),
  fullPipeline: (id: string) => request<DraftProject>(`/drafts/${id}/full-pipeline`, { method: 'POST' }),

  // Pipeline steps
  completeStep: (draftId: string, stepId: string, output?: string) =>
    request<DraftProject>(`/drafts/${draftId}/pipeline/step/${stepId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ output }),
    }),
  failStep: (draftId: string, stepId: string, error: string) =>
    request<DraftProject>(`/drafts/${draftId}/pipeline/step/${stepId}/fail`, {
      method: 'POST',
      body: JSON.stringify({ error }),
    }),

  // Stripe
  setupStripe: (id: string) => request<{ stripeConfig: unknown }>(`/drafts/${id}/stripe/setup`, { method: 'POST' }),
  createCheckout: (id: string, priceId: string) =>
    request<{ url: string }>(`/drafts/${id}/stripe/checkout`, {
      method: 'POST',
      body: JSON.stringify({ priceId }),
    }),

  // Marketing
  generateMarketing: (id: string, type: 'social' | 'email' | 'landing' | 'ad') =>
    request<unknown>(`/drafts/${id}/marketing/${type}`, { method: 'POST' }),

  // Config
  getConfig: () =>
    request<{
      llmConfigured: boolean;
      authMethod: 'oauth' | 'api_key' | 'none';
      stripeConfigured: boolean;
      draftsDir: string;
      llmModel: string;
    }>('/config'),

  // Auth
  getAuthStatus: () =>
    request<{
      method: 'oauth' | 'api_key' | 'none';
      oauthAuthenticated: boolean;
      oauthExpiresAt: number | null;
      hasApiKey: boolean;
    }>('/auth/status'),
  startLogin: () =>
    request<{ authUrl: string; state: string }>('/auth/login', { method: 'POST' }),
  completeLogin: (code: string, state: string) =>
    request<{ message: string }>('/auth/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    }),
  logout: () =>
    request<{ message: string }>('/auth/logout', { method: 'POST' }),
};
