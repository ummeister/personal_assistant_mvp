import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { apiRouter } from './routes/api.ts';
import { FolderWatcher } from './services/folderWatcher.ts';
import { ProjectStore } from './services/projectStore.ts';
import { Orchestrator } from './services/orchestrator.ts';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.PORT || '3001', 10);
const DRAFTS_DIR = path.resolve(process.env.DRAFTS_DIR || './drafts');
const AUTO_MODE = process.env.AUTO_MODE !== 'false'; // true by default

// Ensure drafts directory exists
if (!fs.existsSync(DRAFTS_DIR)) {
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  console.log(`Created drafts directory: ${DRAFTS_DIR}`);
}

const app = express();
app.use(cors());
app.use(express.json());

// Initialize core systems
const store = new ProjectStore();
const orchestrator = new Orchestrator(store, AUTO_MODE);
const watcher = new FolderWatcher(DRAFTS_DIR, store);

// Pass store, orchestrator, and config to routes
app.use('/api', apiRouter(store, orchestrator, DRAFTS_DIR));

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

const llmStatus = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'sk-your-api-key-here'
  ? `LLM: ${process.env.LLM_MODEL || 'gpt-4o-mini'}`
  : 'LLM: non configurato';
const stripeStatus = process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'sk_test_your-stripe-secret-key'
  ? 'Stripe: collegato'
  : 'Stripe: non configurato';

app.listen(PORT, () => {
  console.log(`\n  SaaS Draft Monetizer Server`);
  console.log(`  ─────────────────────────────`);
  console.log(`  API:        http://localhost:${PORT}/api`);
  console.log(`  Watching:   ${DRAFTS_DIR}`);
  console.log(`  Auto-mode:  ${AUTO_MODE ? 'ON' : 'OFF'}`);
  console.log(`  Skill:      ${orchestrator.getSkillContent() ? 'loaded' : 'not found'}`);
  console.log(`  ${llmStatus}`);
  console.log(`  ${stripeStatus}`);
  console.log(`  Status:     Running\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  store.flush();
  watcher.stop();
  process.exit(0);
});
