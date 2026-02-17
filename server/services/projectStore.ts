import type { DraftProject, DraftStatus, ProjectAnalysis, MonetizationPlan, PipelineState } from '../../shared/types.ts';

type StoreListener = (projects: DraftProject[]) => void;

export class ProjectStore {
  private projects: Map<string, DraftProject> = new Map();
  private listeners: StoreListener[] = [];

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
    if (deleted) this.notify();
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
