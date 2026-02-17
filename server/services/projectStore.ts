import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { DraftProject, DraftStatus, ProjectAnalysis, MonetizationPlan, PipelineState } from '../../shared/types.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_STORE_PATH = path.join(__dirname, '..', '..', 'data', 'projects.json');

type StoreListener = (projects: DraftProject[]) => void;

export class ProjectStore {
  private projects: Map<string, DraftProject> = new Map();
  private listeners: StoreListener[] = [];
  private filePath: string;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(filePath?: string) {
    this.filePath = filePath || DEFAULT_STORE_PATH;
    this.load();
  }

  /** Load projects from JSON file on disk */
  private load(): void {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data: DraftProject[] = JSON.parse(raw);
        for (const project of data) {
          this.projects.set(project.id, project);
        }
        console.log(`[Store] Loaded ${data.length} projects from ${this.filePath}`);
      } else {
        console.log(`[Store] No existing data file, starting fresh`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Store] Failed to load data file: ${msg} — starting fresh`);
    }
  }

  /** Persist projects to JSON file on disk (debounced) */
  private scheduleSave(): void {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.saveToDisk(), 500);
  }

  private saveToDisk(): void {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = Array.from(this.projects.values());
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Store] Failed to save data: ${msg}`);
    }
  }

  /** Force an immediate save (useful before shutdown) */
  flush(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    this.saveToDisk();
  }

  getAll(): DraftProject[] {
    return Array.from(this.projects.values()).sort(
      (a, b) => new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime()
    );
  }

  get(id: string): DraftProject | undefined {
    return this.projects.get(id);
  }

  getByPath(dirPath: string): DraftProject | undefined {
    return Array.from(this.projects.values()).find(p => p.path === dirPath);
  }

  add(project: DraftProject): void {
    this.projects.set(project.id, project);
    this.scheduleSave();
    this.notify();
  }

  update(id: string, updates: Partial<DraftProject>): DraftProject | undefined {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updated = {
      ...project,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.projects.set(id, updated);
    this.scheduleSave();
    this.notify();
    return updated;
  }

  updateStatus(id: string, status: DraftStatus, error?: string): DraftProject | undefined {
    return this.update(id, { status, error });
  }

  setAnalysis(id: string, analysis: ProjectAnalysis): DraftProject | undefined {
    return this.update(id, { analysis, status: 'analyzed' });
  }

  setMonetizationPlan(id: string, plan: MonetizationPlan): DraftProject | undefined {
    return this.update(id, { monetizationPlan: plan, status: 'planned' });
  }

  setPipeline(id: string, pipeline: PipelineState): DraftProject | undefined {
    return this.update(id, { pipeline });
  }

  remove(id: string): boolean {
    const deleted = this.projects.delete(id);
    if (deleted) {
      this.scheduleSave();
      this.notify();
    }
    return deleted;
  }

  onUpdate(listener: StoreListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    const all = this.getAll();
    this.listeners.forEach(l => l(all));
  }
}
