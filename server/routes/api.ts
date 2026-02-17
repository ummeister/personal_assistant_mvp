import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ProjectStore } from '../services/projectStore.ts';
import { scanDraftProject } from '../services/draftScanner.ts';
import { analyzeProject, generateMonetizationPlan, generateMarketingCopy } from '../services/llmService.ts';
import { setupStripeProducts, createCheckoutSession, isStripeConfigured } from '../services/stripeService.ts';
import { createPipeline, advanceStep, failStep } from '../services/pipelineManager.ts';

export function apiRouter(store: ProjectStore, draftsDir: string): Router {
  const router = Router();

  // GET /api/drafts - List all draft projects
  router.get('/drafts', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        drafts: store.getAll(),
        watchDir: draftsDir,
      },
    });
  });

  // GET /api/drafts/:id - Get single draft
  router.get('/drafts/:id', (req: Request, res: Response) => {
    const draft = store.get(req.params.id);
    if (!draft) {
      res.status(404).json({ success: false, error: 'Draft not found' });
      return;
    }
    res.json({ success: true, data: draft });
  });

  // POST /api/drafts/:id/scan - Scan a draft project
  router.post('/drafts/:id/scan', async (req: Request, res: Response) => {
    const draft = store.get(req.params.id);
    if (!draft) {
      res.status(404).json({ success: false, error: 'Draft not found' });
      return;
    }

    try {
      store.updateStatus(draft.id, 'scanning');
      const scan = await scanDraftProject(draft.path);
      store.update(draft.id, { scan, status: 'analyzed' });
      res.json({ success: true, data: store.get(draft.id) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed';
      store.updateStatus(draft.id, 'error', message);
      res.status(500).json({ success: false, error: message });
    }
  });

  // POST /api/drafts/:id/analyze - Run AI analysis
  router.post('/drafts/:id/analyze', async (req: Request, res: Response) => {
    const draft = store.get(req.params.id);
    if (!draft) {
      res.status(404).json({ success: false, error: 'Draft not found' });
      return;
    }

    try {
      // Scan first if not already scanned
      store.updateStatus(draft.id, 'scanning');
      const scan = await scanDraftProject(draft.path);
      store.update(draft.id, { scan });

      // Run AI analysis
      store.updateStatus(draft.id, 'analyzing');
      const analysis = await analyzeProject(scan);
      store.setAnalysis(draft.id, analysis);

      res.json({ success: true, data: store.get(draft.id) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      store.updateStatus(draft.id, 'error', message);
      res.status(500).json({ success: false, error: message });
    }
  });

  // POST /api/drafts/:id/monetize - Generate monetization plan
  router.post('/drafts/:id/monetize', async (req: Request, res: Response) => {
    const draft = store.get(req.params.id);
    if (!draft) {
      res.status(404).json({ success: false, error: 'Draft not found' });
      return;
    }
    if (!draft.scan || !draft.analysis) {
      res.status(400).json({ success: false, error: 'Draft must be analyzed first' });
      return;
    }

    try {
      store.updateStatus(draft.id, 'planning');
      const plan = await generateMonetizationPlan(draft.scan, draft.analysis);
      store.setMonetizationPlan(draft.id, plan);

      // Create pipeline
      const pipeline = createPipeline(draft.analysis, plan);
      store.setPipeline(draft.id, pipeline);

      res.json({ success: true, data: store.get(draft.id) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Monetization planning failed';
      store.updateStatus(draft.id, 'error', message);
      res.status(500).json({ success: false, error: message });
    }
  });

  // POST /api/drafts/:id/full-pipeline - Run full pipeline (scan + analyze + monetize)
  router.post('/drafts/:id/full-pipeline', async (req: Request, res: Response) => {
    const draft = store.get(req.params.id);
    if (!draft) {
      res.status(404).json({ success: false, error: 'Draft not found' });
      return;
    }

    try {
      // Step 1: Scan
      store.updateStatus(draft.id, 'scanning');
      const scan = await scanDraftProject(draft.path);
      store.update(draft.id, { scan });

      // Step 2: AI Analysis
      store.updateStatus(draft.id, 'analyzing');
      const analysis = await analyzeProject(scan);
      store.setAnalysis(draft.id, analysis);

      // Step 3: Monetization Plan
      store.updateStatus(draft.id, 'planning');
      const plan = await generateMonetizationPlan(scan, analysis);
      store.setMonetizationPlan(draft.id, plan);

      // Step 4: Create pipeline
      const pipeline = createPipeline(analysis, plan);
      store.setPipeline(draft.id, pipeline);
      store.updateStatus(draft.id, 'planned');

      res.json({ success: true, data: store.get(draft.id) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Pipeline failed';
      store.updateStatus(draft.id, 'error', message);
      res.status(500).json({ success: false, error: message });
    }
  });

  // POST /api/drafts/:id/pipeline/step/:stepId/complete - Complete a pipeline step
  router.post('/drafts/:id/pipeline/step/:stepId/complete', (req: Request, res: Response) => {
    const draft = store.get(req.params.id);
    if (!draft?.pipeline) {
      res.status(404).json({ success: false, error: 'Draft or pipeline not found' });
      return;
    }

    const updatedPipeline = advanceStep(draft.pipeline, req.params.stepId, req.body.output);
    store.setPipeline(draft.id, updatedPipeline);

    // Update status based on pipeline progress
    const allDone = updatedPipeline.steps.every(s => s.status === 'completed' || s.status === 'skipped');
    if (allDone) {
      store.updateStatus(draft.id, 'monetized');
    }

    res.json({ success: true, data: store.get(draft.id) });
  });

  // POST /api/drafts/:id/pipeline/step/:stepId/fail - Mark a step as failed
  router.post('/drafts/:id/pipeline/step/:stepId/fail', (req: Request, res: Response) => {
    const draft = store.get(req.params.id);
    if (!draft?.pipeline) {
      res.status(404).json({ success: false, error: 'Draft or pipeline not found' });
      return;
    }

    const updatedPipeline = failStep(draft.pipeline, req.params.stepId, req.body.error || 'Failed');
    store.setPipeline(draft.id, updatedPipeline);

    res.json({ success: true, data: store.get(draft.id) });
  });

  // POST /api/drafts/:id/stripe/setup - Setup Stripe products
  router.post('/drafts/:id/stripe/setup', async (req: Request, res: Response) => {
    const draft = store.get(req.params.id);
    if (!draft?.monetizationPlan) {
      res.status(400).json({ success: false, error: 'Monetization plan required' });
      return;
    }

    try {
      const updatedConfig = await setupStripeProducts(draft.monetizationPlan.stripeConfig);
      const updatedPlan = { ...draft.monetizationPlan, stripeConfig: updatedConfig };
      store.setMonetizationPlan(draft.id, updatedPlan);

      res.json({ success: true, data: { stripeConfig: updatedConfig } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Stripe setup failed';
      res.status(500).json({ success: false, error: message });
    }
  });

  // POST /api/drafts/:id/stripe/checkout - Create checkout session
  router.post('/drafts/:id/stripe/checkout', async (req: Request, res: Response) => {
    const { priceId, successUrl, cancelUrl } = req.body;
    const draft = store.get(req.params.id);
    if (!draft?.monetizationPlan) {
      res.status(400).json({ success: false, error: 'Monetization plan required' });
      return;
    }

    try {
      const url = await createCheckoutSession(
        priceId,
        successUrl || 'http://localhost:3000/success',
        cancelUrl || 'http://localhost:3000/cancel',
        draft.monetizationPlan.stripeConfig.checkoutMode
      );

      res.json({ success: true, data: { url } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Checkout creation failed';
      res.status(500).json({ success: false, error: message });
    }
  });

  // POST /api/drafts/:id/marketing/:type - Generate marketing copy
  router.post('/drafts/:id/marketing/:type', async (req: Request, res: Response) => {
    const draft = store.get(req.params.id);
    if (!draft?.analysis) {
      res.status(400).json({ success: false, error: 'Analysis required first' });
      return;
    }

    const type = req.params.type as 'social' | 'email' | 'landing' | 'ad';
    if (!['social', 'email', 'landing', 'ad'].includes(type)) {
      res.status(400).json({ success: false, error: 'Invalid marketing type' });
      return;
    }

    try {
      const content = await generateMarketingCopy(draft.analysis, type);
      res.json({ success: true, data: JSON.parse(content) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Marketing copy generation failed';
      res.status(500).json({ success: false, error: message });
    }
  });

  // GET /api/config - Get current configuration status
  router.get('/config', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        llmConfigured: !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-api-key-here',
        stripeConfigured: isStripeConfigured(),
        draftsDir: draftsDir,
        llmModel: process.env.LLM_MODEL || 'gpt-4o-mini',
      },
    });
  });

  return router;
}
