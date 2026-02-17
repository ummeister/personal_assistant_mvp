// === Draft Project Types ===

export type DraftStatus =
  | 'discovered'    // Appena trovata nella cartella
  | 'scanning'      // Scansione file in corso
  | 'analyzing'     // Analisi LLM in corso
  | 'analyzed'      // Analisi completata
  | 'planning'      // Creazione piano di monetizzazione
  | 'planned'       // Piano pronto
  | 'implementing'  // Implementazione in corso
  | 'ready'         // Pronta per il deploy
  | 'deployed'      // Online
  | 'monetized'     // Stripe collegato, in produzione
  | 'error';        // Errore

export interface DraftProject {
  id: string;
  name: string;
  path: string;
  status: DraftStatus;
  discoveredAt: string;
  updatedAt: string;
  scan?: ProjectScan;
  analysis?: ProjectAnalysis;
  monetizationPlan?: MonetizationPlan;
  pipeline?: PipelineState;
  error?: string;
}

// === Scan Types ===

export interface ProjectScan {
  files: string[];
  totalFiles: number;
  hasPackageJson: boolean;
  hasReadme: boolean;
  techStack: string[];
  framework?: string;
  language?: string;
  dependencies: Record<string, string>;
  structure: string; // Tree-like representation
  readmeContent?: string;
  packageJsonContent?: Record<string, unknown>;
  mainFiles: FilePreview[];
}

export interface FilePreview {
  path: string;
  content: string; // First 200 lines
  language: string;
}

// === Analysis Types (LLM Output) ===

export interface ProjectAnalysis {
  name: string;
  description: string;
  category: string; // e.g. "Productivity", "Analytics", "Automation"
  targetAudience: string;
  problemSolved: string;
  currentState: 'skeleton' | 'prototype' | 'mvp' | 'beta' | 'near-complete';
  completionPercentage: number;
  features: Feature[];
  missingForMvp: string[];
  strengths: string[];
  weaknesses: string[];
  competitorAnalysis: string;
  uniqueSellingPoint: string;
}

export interface Feature {
  name: string;
  description: string;
  implemented: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

// === Monetization Types ===

export interface MonetizationPlan {
  strategy: MonetizationStrategy;
  pricingTiers: PricingTier[];
  revenueProjection: RevenueProjection;
  marketingPlan: MarketingPlan;
  landingPage: LandingPageContent;
  tasksToComplete: MonetizationTask[];
  stripeConfig: StripeConfig;
}

export type MonetizationStrategy =
  | 'freemium'
  | 'subscription'
  | 'one-time'
  | 'usage-based'
  | 'tiered';

export interface PricingTier {
  name: string;
  price: number; // Monthly in cents
  currency: string;
  interval: 'month' | 'year' | 'one-time';
  features: string[];
  highlighted: boolean;
  stripePriceId?: string;
}

export interface RevenueProjection {
  monthlyTarget: number;
  estimatedConversionRate: number;
  estimatedTrafficNeeded: number;
  breakEvenMonths: number;
  reasoning: string;
}

export interface MarketingPlan {
  channels: MarketingChannel[];
  launchStrategy: string;
  seoKeywords: string[];
  socialMediaPosts: SocialPost[];
  emailSequence: EmailTemplate[];
}

export interface MarketingChannel {
  name: string;
  strategy: string;
  estimatedCost: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SocialPost {
  platform: string;
  content: string;
  hashtags: string[];
}

export interface EmailTemplate {
  subject: string;
  body: string;
  sendDay: number; // Day in sequence
}

export interface LandingPageContent {
  headline: string;
  subheadline: string;
  heroDescription: string;
  features: LandingFeature[];
  testimonialPrompts: string[];
  ctaText: string;
  faqItems: FaqItem[];
}

export interface LandingFeature {
  title: string;
  description: string;
  icon: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface StripeConfig {
  productName: string;
  productDescription: string;
  prices: StripePriceConfig[];
  checkoutMode: 'payment' | 'subscription';
  successUrl: string;
  cancelUrl: string;
}

export interface StripePriceConfig {
  tierName: string;
  unitAmount: number;
  currency: string;
  interval?: 'month' | 'year';
  stripeProductId?: string;
  stripePriceId?: string;
}

// === Pipeline Types ===

export interface PipelineState {
  steps: PipelineStep[];
  currentStep: number;
  startedAt: string;
  completedAt?: string;
}

export type PipelineStepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

export interface PipelineStep {
  id: string;
  name: string;
  description: string;
  status: PipelineStepStatus;
  category: 'analysis' | 'development' | 'monetization' | 'marketing' | 'deployment';
  output?: string;
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface MonetizationTask {
  id: string;
  title: string;
  description: string;
  category: 'code' | 'stripe' | 'landing' | 'marketing' | 'deploy';
  completed: boolean;
  automated: boolean;
  output?: string;
}

// === API Types ===

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DraftListResponse {
  drafts: DraftProject[];
  watchDir: string;
}

export interface AnalyzeRequest {
  draftId: string;
}

export interface MonetizeRequest {
  draftId: string;
}

export interface ExecuteStepRequest {
  draftId: string;
  stepId: string;
}

export interface StripeSetupRequest {
  draftId: string;
}

export interface GenerateLandingRequest {
  draftId: string;
}
