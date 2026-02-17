import { Router } from 'express';
import type { Request, Response } from 'express';
import type { ProjectStore } from '../services/projectStore.ts';
import type { Orchestrator } from '../services/orchestrator.ts';
import { scanDraftProject } from '../services/draftScanner.ts';
import { analyzeProject, generateMonetizationPlan, generateMarketingCopy } from '../services/llmService.ts';
import { setupStripeProducts, createCheckoutSession, isStripeConfigured } from '../services/stripeService.ts';
import { createPipeline, advanceStep, failStep } from '../services/pipelineManager.ts';
import { startOAuthFlow, exchangeCode, getOAuthStatus, logout as oauthLogout, isOAuthConfigured } from '../services/oauthService.ts';

export function apiRouter(store: ProjectStore, orchestrator: Orchestrator, draftsDir: string): Router {
  const router = Router();

  // === Auth Routes ===

  // GET /api/auth/status - Check authentication status
  router.get('/auth/status', (_req: Request, res: Response) => {
    const oauth = getOAuthStatus();
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const hasApiKey = !!apiKey && apiKey !== 'sk-ant-your-api-key-here';

    res.json({
      success: true,
      data: {
        method: oauth.authenticated ? 'oauth' : hasApiKey ? 'api_key' : 'none',
        oauthAuthenticated: oauth.authenticated,
        oauthExpiresAt: oauth.expiresAt,
        hasApiKey,
      },
    });
  });

  // POST /api/auth/login - Start OAuth flow (returns URL to open in browser)
  router.post('/auth/login', (_req: Request, res: Response) => {
    const { authUrl, state } = startOAuthFlow();
    res.json({
      success: true,
      data: { authUrl, state },
    });
  });

  // POST /api/auth/callback - Exchange authorization code for token
  router.post('/auth/callback', async (req: Request, res: Response) => {
    const { code, state } = req.body;
    if (!code || !state) {
      res.status(400).json({ success: false, error: 'Missing code or state' });
      return;
    }

    try {
      await exchangeCode(code, state);
      res.json({ success: true, data: { message: 'Autenticazione completata!' } });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'OAuth exchange failed';
      res.status(400).json({ success: false, error: message });
    }
  });

  // POST /api/auth/logout - Clear stored OAuth token
  router.post('/auth/logout', (_req: Request, res: Response) => {
    oauthLogout();
    res.json({ success: true, data: { message: 'Logout completato' } });
  });

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

  // POST /api/drafts/:id/analyze - Run AI analysis (with skill.md context)
  router.post('/drafts/:id/analyze', async (req: Request, res: Response) => {
    const draft = store.get(req.params.id);
    if (!draft) {
      res.status(404).json({ success: false, error: 'Draft not found' });
      return;
    }

    const skillContext = orchestrator.getSkillContent();

    try {
      // Scan first if not already scanned
      store.updateStatus(draft.id, 'scanning');
      const scan = await scanDraftProject(draft.path);
      store.update(draft.id, { scan });

      // Run AI analysis with skill context
      store.updateStatus(draft.id, 'analyzing');
      const analysis = await analyzeProject(scan, skillContext);
      store.setAnalysis(draft.id, analysis);

      res.json({ success: true, data: store.get(draft.id) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      store.updateStatus(draft.id, 'error', message);
      res.status(500).json({ success: false, error: message });
    }
  });

  // POST /api/drafts/:id/monetize - Generate monetization plan (with skill.md context)
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

    const skillContext = orchestrator.getSkillContent();

    try {
      store.updateStatus(draft.id, 'planning');
      const plan = await generateMonetizationPlan(draft.scan, draft.analysis, skillContext);
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

  // POST /api/drafts/:id/full-pipeline - Run full pipeline via Orchestrator
  router.post('/drafts/:id/full-pipeline', async (req: Request, res: Response) => {
    const draft = store.get(req.params.id);
    if (!draft) {
      res.status(404).json({ success: false, error: 'Draft not found' });
      return;
    }

    try {
      await orchestrator.runFullPipeline(draft.id);
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

  // POST /api/drafts/:id/marketing/:type - Generate marketing copy (with skill.md context)
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

    const skillContext = orchestrator.getSkillContent();

    try {
      const content = await generateMarketingCopy(draft.analysis, type, skillContext);
      res.json({ success: true, data: JSON.parse(content) });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Marketing copy generation failed';
      res.status(500).json({ success: false, error: message });
    }
  });

  // POST /api/skill/reload - Reload skill.md without restarting
  router.post('/skill/reload', (_req: Request, res: Response) => {
    orchestrator.reloadSkill();
    res.json({
      success: true,
      data: { loaded: !!orchestrator.getSkillContent(), length: orchestrator.getSkillContent().length },
    });
  });

  // GET /api/config - Get current configuration status
  router.get('/config', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        llmConfigured: isOAuthConfigured() || (!!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'sk-ant-your-api-key-here'),
        authMethod: isOAuthConfigured() ? 'oauth' : (!!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'sk-ant-your-api-key-here') ? 'api_key' : 'none',
        stripeConfigured: isStripeConfigured(),
        skillLoaded: !!orchestrator.getSkillContent(),
        autoMode: process.env.AUTO_MODE !== 'false',
        draftsDir: draftsDir,
        llmModel: process.env.LLM_MODEL || 'claude-opus-4-6',
      },
    });
  });

  return router;
}
