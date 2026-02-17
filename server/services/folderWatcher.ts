import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { v4 as uuid } from 'uuid';
import type { DraftProject } from '../../shared/types.ts';
import type { ProjectStore } from './projectStore.ts';

export class FolderWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  private watchDir: string;
  private store: ProjectStore;

  constructor(watchDir: string, store: ProjectStore) {
    this.watchDir = watchDir;
    this.store = store;
  }

  start(): void {
    // Initial scan of existing directories
    this.scanExisting();

    // Watch for new directories
    this.watcher = chokidar.watch(this.watchDir, {
      depth: 0,
      ignoreInitial: true,
      ignored: /(^|[/\\])\../, // ignore dotfiles
    });

    this.watcher.on('addDir', (dirPath: string) => {
      // Only react to direct children of the watch directory
      if (path.dirname(dirPath) !== this.watchDir) return;

      const dirName = path.basename(dirPath);
      console.log(`[Watcher] New draft discovered: ${dirName}`);

      this.registerDraft(dirPath, dirName);
    });

    this.watcher.on('unlinkDir', (dirPath: string) => {
      if (path.dirname(dirPath) !== this.watchDir) return;

      const existing = this.store.getByPath(dirPath);
      if (existing) {
        console.log(`[Watcher] Draft removed: ${existing.name}`);
        this.store.remove(existing.id);
      }
    });

    console.log(`[Watcher] Watching for new drafts in: ${this.watchDir}`);
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('[Watcher] Stopped');
    }
  }

  private scanExisting(): void {
    if (!fs.existsSync(this.watchDir)) return;

    const entries = fs.readdirSync(this.watchDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        const dirPath = path.join(this.watchDir, entry.name);
        if (!this.store.getByPath(dirPath)) {
          this.registerDraft(dirPath, entry.name);
        }
      }
    }
  }

  private registerDraft(dirPath: string, dirName: string): void {
    // Check if already registered
    if (this.store.getByPath(dirPath)) return;

    const project: DraftProject = {
      id: uuid(),
      name: dirName,
      path: dirPath,
      status: 'discovered',
      discoveredAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.store.add(project);
  }
}
