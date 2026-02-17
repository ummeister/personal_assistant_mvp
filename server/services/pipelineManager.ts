import type { PipelineState, PipelineStep, ProjectAnalysis, MonetizationPlan } from '../../shared/types.ts';
import { v4 as uuid } from 'uuid';

export function createPipeline(analysis: ProjectAnalysis, plan: MonetizationPlan): PipelineState {
  const steps: PipelineStep[] = [
    // Analysis phase
    {
      id: uuid(),
      name: 'Scansione progetto',
      description: 'Scansione della struttura del progetto e dei file',
      status: 'completed',
      category: 'analysis',
    },
    {
      id: uuid(),
      name: 'Analisi AI',
      description: `Analisi del progetto "${analysis.name}" completata`,
      status: 'completed',
      category: 'analysis',
    },
    {
      id: uuid(),
      name: 'Piano di monetizzazione',
      description: `Strategia: ${plan.strategy} - ${plan.pricingTiers.length} livelli di prezzo`,
      status: 'completed',
      category: 'analysis',
    },

    // Development phase
    ...analysis.missingForMvp.map(item => ({
      id: uuid(),
      name: `Completare: ${item}`,
      description: `Implementare la feature mancante: ${item}`,
      status: 'pending' as const,
      category: 'development' as const,
    })),

    // Monetization phase
    {
      id: uuid(),
      name: 'Setup Stripe',
      description: `Creare prodotto "${plan.stripeConfig.productName}" e prezzi su Stripe`,
      status: 'pending',
      category: 'monetization',
    },
    {
      id: uuid(),
      name: 'Integrazione pagamenti',
      description: 'Aggiungere Stripe Checkout al progetto',
      status: 'pending',
      category: 'monetization',
    },

    // Marketing phase
    {
      id: uuid(),
      name: 'Creazione landing page',
      description: `Landing page con headline: "${plan.landingPage.headline}"`,
      status: 'pending',
      category: 'marketing',
    },
    {
      id: uuid(),
      name: 'Contenuti marketing',
      description: `${plan.marketingPlan.socialMediaPosts.length} post social + ${plan.marketingPlan.emailSequence.length} email`,
      status: 'pending',
      category: 'marketing',
    },
    {
      id: uuid(),
      name: 'SEO Setup',
      description: `Ottimizzazione per: ${plan.marketingPlan.seoKeywords.slice(0, 5).join(', ')}`,
      status: 'pending',
      category: 'marketing',
    },

    // Deployment phase
    {
      id: uuid(),
      name: 'Preparazione deploy',
      description: 'Build di produzione e configurazione ambiente',
      status: 'pending',
      category: 'deployment',
    },
    {
      id: uuid(),
      name: 'Deploy online',
      description: 'Messa online del progetto',
      status: 'pending',
      category: 'deployment',
    },
    {
      id: uuid(),
      name: 'Lancio!',
      description: 'Pubblicazione su Product Hunt, social media e canali marketing',
      status: 'pending',
      category: 'deployment',
    },
  ];

  return {
    steps,
    currentStep: 3, // First 3 steps (analysis) are complete
    startedAt: new Date().toISOString(),
  };
}

export function advanceStep(pipeline: PipelineState, stepId: string, output?: string): PipelineState {
  const steps = pipeline.steps.map(step => {
    if (step.id === stepId) {
      return {
        ...step,
        status: 'completed' as const,
        output,
        completedAt: new Date().toISOString(),
      };
    }
    return step;
  });

  // Find next pending step
  const nextPendingIdx = steps.findIndex(s => s.status === 'pending');
  if (nextPendingIdx >= 0) {
    steps[nextPendingIdx] = { ...steps[nextPendingIdx], status: 'in_progress', startedAt: new Date().toISOString() };
  }

  const allCompleted = steps.every(s => s.status === 'completed' || s.status === 'skipped');

  return {
    ...pipeline,
    steps,
    currentStep: nextPendingIdx >= 0 ? nextPendingIdx : steps.length,
    completedAt: allCompleted ? new Date().toISOString() : undefined,
  };
}

export function failStep(pipeline: PipelineState, stepId: string, error: string): PipelineState {
  const steps = pipeline.steps.map(step => {
    if (step.id === stepId) {
      return { ...step, status: 'failed' as const, error };
    }
    return step;
  });

  return { ...pipeline, steps };
}
