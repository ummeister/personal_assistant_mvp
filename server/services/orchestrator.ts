import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DraftProject } from '../../shared/types.ts';
import type { ProjectStore } from './projectStore.ts';
import { scanDraftProject } from './draftScanner.ts';
import { analyzeProject, generateMonetizationPlan } from './llmService.ts';
import { createPipeline } from './pipelineManager.ts';
import { setupStripeProducts, isStripeConfigured } from './stripeService.ts';
import { isOAuthConfigured } from './oauthService.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Orchestrator - Il direttore d'orchestra.
 *
 * Reagisce automaticamente ai cambiamenti nello store:
 * - Quando un draft viene scoperto → lancia scan automatico
 * - Quando un draft viene scansionato → lancia analisi AI
 * - Quando un draft viene analizzato → genera piano di monetizzazione
 * - Quando un piano e' pronto → setup Stripe (se configurato)
 *
 * Carica skill.md come "DNA" per alimentare tutti i prompt AI.
 */
export class Orchestrator {
  private store: ProjectStore;
  private processing: Set<string> = new Set();
  private skillContent: string = '';
  private autoMode: boolean;

  constructor(store: ProjectStore, autoMode = true) {
    this.store = store;
    this.autoMode = autoMode;
    this.loadSkill();
    this.setupListeners();
  }

  /** Carica il file skill.md - il DNA del cervello */
  private loadSkill(): void {
    const skillPath = path.join(__dirname, '..', 'skill.md');
    try {
      this.skillContent = fs.readFileSync(skillPath, 'utf-8');
      console.log(`[Orchestrator] Skill loaded (${this.skillContent.length} chars)`);
    } catch {
      console.warn('[Orchestrator] skill.md not found - running with default prompts');
      this.skillContent = '';
    }
  }

  /** Restituisce il contenuto skill.md per i prompt */
  getSkillContent(): string {
    return this.skillContent;
  }

  /** Ricarica skill.md a caldo (utile per aggiornamenti senza restart) */
  reloadSkill(): void {
    this.loadSkill();
    console.log('[Orchestrator] Skill reloaded');
  }

  /** Ascolta cambiamenti nello store e reagisce */
  private setupListeners(): void {
    if (!this.autoMode) {
      console.log('[Orchestrator] Auto-mode OFF - waiting for manual triggers');
      return;
    }

    this.store.onUpdate((projects) => {
      for (const project of projects) {
        this.evaluateAndAct(project);
      }
    });

    console.log('[Orchestrator] Auto-mode ON - reacting to new drafts automatically');
  }

  /**
   * Il cuore decisionale: valuta lo stato di un progetto e decide cosa fare.
   * Agisce come un direttore d'orchestra che guarda la partitura e dice
   * a ogni sezione quando suonare.
   */
  private async evaluateAndAct(project: DraftProject): Promise<void> {
    // Evita elaborazioni parallele sullo stesso progetto
    if (this.processing.has(project.id)) return;

    switch (project.status) {
      case 'discovered':
        await this.handleDiscovered(project);
        break;

      // Gli stati intermedi (scanning, analyzing, planning) sono in corso,
      // non serve fare nulla

      case 'analyzed':
        // Se ha l'analisi ma non il piano di monetizzazione, genera il piano
        if (project.analysis && !project.monetizationPlan) {
          await this.handleAnalyzed(project);
        }
        break;

      case 'planned':
        // Se ha il piano e Stripe e' configurato, prova il setup automatico
        if (project.monetizationPlan && isStripeConfigured()) {
          await this.handlePlanned(project);
        }
        break;

      // error: non fare nulla automaticamente, l'utente decidera'
      // gli altri stati sono "finali" o gestiti manualmente
    }
  }

  /** Draft appena scoperto → Scansione + Analisi AI */
  private async handleDiscovered(project: DraftProject): Promise<void> {
    this.processing.add(project.id);
    console.log(`[Orchestrator] New draft detected: "${project.name}" → starting full analysis`);

    try {
      // Step 1: Scan
      this.store.updateStatus(project.id, 'scanning');
      const scan = await scanDraftProject(project.path);
      this.store.update(project.id, { scan });
      console.log(`[Orchestrator] "${project.name}" scanned: ${scan.totalFiles} files, stack: ${scan.techStack.join(', ')}`);

      // Step 2: Analisi AI (solo se LLM configurato)
      if (this.isLLMConfigured()) {
        this.store.updateStatus(project.id, 'analyzing');
        const analysis = await analyzeProject(scan, this.skillContent);
        this.store.setAnalysis(project.id, analysis);
        console.log(`[Orchestrator] "${project.name}" analyzed: ${analysis.category} - ${analysis.currentState} (${analysis.completionPercentage}%)`);
      } else {
        // Senza LLM, salva almeno lo scan
        this.store.updateStatus(project.id, 'analyzed');
        console.log(`[Orchestrator] "${project.name}" scanned (LLM not configured, skipping AI analysis)`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Orchestrator] Error processing "${project.name}": ${msg}`);
      this.store.updateStatus(project.id, 'error', msg);
    } finally {
      this.processing.delete(project.id);
    }
  }

  /** Draft analizzato → Piano di monetizzazione */
  private async handleAnalyzed(project: DraftProject): Promise<void> {
    if (!project.scan || !project.analysis) return;
    if (!this.isLLMConfigured()) return;

    this.processing.add(project.id);
    console.log(`[Orchestrator] "${project.name}" analyzed → generating monetization plan`);

    try {
      this.store.updateStatus(project.id, 'planning');
      const plan = await generateMonetizationPlan(project.scan, project.analysis, this.skillContent);
      this.store.setMonetizationPlan(project.id, plan);

      // Crea la pipeline di step
      const pipeline = createPipeline(project.analysis, plan);
      this.store.setPipeline(project.id, pipeline);
      this.store.updateStatus(project.id, 'planned');

      console.log(`[Orchestrator] "${project.name}" monetization plan ready: strategy=${plan.strategy}, tiers=${plan.pricingTiers.length}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Orchestrator] Monetization plan failed for "${project.name}": ${msg}`);
      this.store.updateStatus(project.id, 'error', msg);
    } finally {
      this.processing.delete(project.id);
    }
  }

  /** Piano pronto + Stripe configurato → Setup prodotti Stripe */
  private async handlePlanned(project: DraftProject): Promise<void> {
    if (!project.monetizationPlan) return;

    this.processing.add(project.id);
    console.log(`[Orchestrator] "${project.name}" planned → setting up Stripe products`);

    try {
      const updatedConfig = await setupStripeProducts(project.monetizationPlan.stripeConfig);
      const updatedPlan = { ...project.monetizationPlan, stripeConfig: updatedConfig };
      this.store.setMonetizationPlan(project.id, updatedPlan);

      console.log(`[Orchestrator] "${project.name}" Stripe products created`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Orchestrator] Stripe setup failed for "${project.name}": ${msg}`);
      // Non marcare come errore - lo Stripe e' opzionale
    } finally {
      this.processing.delete(project.id);
    }
  }

  /** Trigger manuale per rieseguire l'intera pipeline su un draft */
  async runFullPipeline(projectId: string): Promise<void> {
    const project = this.store.get(projectId);
    if (!project) throw new Error('Draft not found');

    // Reset allo stato discovered e ri-processa
    this.store.updateStatus(projectId, 'discovered');
    this.processing.delete(projectId);
    await this.handleDiscovered(project);

    // Se l'analisi e' andata a buon fine, continua con la monetizzazione
    const updated = this.store.get(projectId);
    if (updated?.status === 'analyzed' && updated.analysis) {
      await this.handleAnalyzed(updated);
    }
  }

  private isLLMConfigured(): boolean {
    if (isOAuthConfigured()) return true;
    const key = process.env.ANTHROPIC_API_KEY;
    return !!key && key !== 'sk-ant-your-api-key-here';
  }
}
