import { z } from 'zod';

// === ProjectAnalysis schema ===

const FeatureSchema = z.object({
  name: z.string(),
  description: z.string(),
  implemented: z.boolean(),
  priority: z.enum(['critical', 'high', 'medium', 'low']),
});

export const ProjectAnalysisSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  targetAudience: z.string().min(1),
  problemSolved: z.string().min(1),
  currentState: z.enum(['skeleton', 'prototype', 'mvp', 'beta', 'near-complete']),
  completionPercentage: z.number().min(0).max(100),
  features: z.array(FeatureSchema).min(1),
  missingForMvp: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  competitorAnalysis: z.string(),
  uniqueSellingPoint: z.string().min(1),
});

// === MonetizationPlan schema ===

const PricingTierSchema = z.object({
  name: z.string(),
  price: z.number().min(0),
  currency: z.string().default('eur'),
  interval: z.enum(['month', 'year', 'one-time']),
  features: z.array(z.string()),
  highlighted: z.boolean().default(false),
  stripePriceId: z.string().optional(),
});

const RevenueProjectionSchema = z.object({
  monthlyTarget: z.number(),
  estimatedConversionRate: z.number(),
  estimatedTrafficNeeded: z.number(),
  breakEvenMonths: z.number(),
  reasoning: z.string(),
});

const MarketingChannelSchema = z.object({
  name: z.string(),
  strategy: z.string(),
  estimatedCost: z.number().default(0),
  priority: z.enum(['high', 'medium', 'low']),
});

const SocialPostSchema = z.object({
  platform: z.string(),
  content: z.string(),
  hashtags: z.array(z.string()).default([]),
});

const EmailTemplateSchema = z.object({
  subject: z.string(),
  body: z.string(),
  sendDay: z.number(),
});

const MarketingPlanSchema = z.object({
  channels: z.array(MarketingChannelSchema),
  launchStrategy: z.string(),
  seoKeywords: z.array(z.string()).default([]),
  socialMediaPosts: z.array(SocialPostSchema).default([]),
  emailSequence: z.array(EmailTemplateSchema).default([]),
});

const LandingFeatureSchema = z.object({
  title: z.string(),
  description: z.string(),
  icon: z.string().default('star'),
});

const FaqItemSchema = z.object({
  question: z.string(),
  answer: z.string(),
});

const LandingPageContentSchema = z.object({
  headline: z.string(),
  subheadline: z.string(),
  heroDescription: z.string(),
  features: z.array(LandingFeatureSchema),
  testimonialPrompts: z.array(z.string()).default([]),
  ctaText: z.string(),
  faqItems: z.array(FaqItemSchema).default([]),
});

const MonetizationTaskSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(['code', 'stripe', 'landing', 'marketing', 'deploy']),
  completed: z.boolean().default(false),
  automated: z.boolean().default(false),
  output: z.string().optional(),
});

const StripePriceConfigSchema = z.object({
  tierName: z.string(),
  unitAmount: z.number(),
  currency: z.string().default('eur'),
  interval: z.enum(['month', 'year']).optional(),
  stripeProductId: z.string().optional(),
  stripePriceId: z.string().optional(),
});

const StripeConfigSchema = z.object({
  productName: z.string(),
  productDescription: z.string(),
  prices: z.array(StripePriceConfigSchema),
  checkoutMode: z.enum(['payment', 'subscription']),
  successUrl: z.string().default('/success'),
  cancelUrl: z.string().default('/pricing'),
});

export const MonetizationPlanSchema = z.object({
  strategy: z.enum(['freemium', 'subscription', 'one-time', 'usage-based', 'tiered']),
  pricingTiers: z.array(PricingTierSchema).min(1),
  revenueProjection: RevenueProjectionSchema,
  marketingPlan: MarketingPlanSchema,
  landingPage: LandingPageContentSchema,
  tasksToComplete: z.array(MonetizationTaskSchema).default([]),
  stripeConfig: StripeConfigSchema,
});

// === Helpers ===

/**
 * Parse and validate LLM JSON output.
 * Returns the validated object or throws a descriptive error.
 */
export function parseLLMResponse<T>(raw: string, schema: z.ZodSchema<T>, label: string): T {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`[${label}] LLM returned invalid JSON: ${raw.slice(0, 200)}...`);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .slice(0, 5)
      .map(i => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`[${label}] LLM response failed validation:\n${issues}`);
  }

  return result.data;
}
