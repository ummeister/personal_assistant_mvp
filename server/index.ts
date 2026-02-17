import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api.ts';
import { FolderWatcher } from './services/folderWatcher.ts';
import { ProjectStore } from './services/projectStore.ts';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3001', 10);
const DRAFTS_DIR = path.resolve(process.env.DRAFTS_DIR || './drafts');

// Ensure drafts directory exists
if (!fs.existsSync(DRAFTS_DIR)) {
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  console.log(`Created drafts directory: ${DRAFTS_DIR}`);
}

const app = express();
app.use(cors());
app.use(express.json());

// Initialize store and watcher
const store = new ProjectStore();
const watcher = new FolderWatcher(DRAFTS_DIR, store);

// Pass store and config to routes
app.use('/api', apiRouter(store, DRAFTS_DIR));

// In production, serve static files
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start watcher
watcher.start();

app.listen(PORT, () => {
  console.log(`\n  SaaS Draft Monetizer Server`);
  console.log(`  ─────────────────────────────`);
  console.log(`  API:        http://localhost:${PORT}/api`);
  console.log(`  Watching:   ${DRAFTS_DIR}`);
  console.log(`  Status:     Running\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  watcher.stop();
  process.exit(0);
});
