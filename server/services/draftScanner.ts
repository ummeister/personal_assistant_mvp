import fs from 'fs';
import path from 'path';
import type { ProjectScan, FilePreview } from '../../shared/types.ts';

const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', '.cache',
  '__pycache__', '.venv', 'venv', '.idea', '.vscode', 'coverage',
  '.turbo', '.vercel', '.output',
]);

const CODE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.py', '.rb', '.go', '.rs',
  '.vue', '.svelte', '.css', '.scss', '.html', '.json', '.yaml',
  '.yml', '.toml', '.md', '.sql', '.prisma', '.graphql',
]);

const IMPORTANT_FILES = [
  'package.json', 'README.md', 'readme.md', 'README',
  'requirements.txt', 'Cargo.toml', 'go.mod', 'Gemfile',
  'docker-compose.yml', 'Dockerfile', '.env.example',
  'prisma/schema.prisma', 'next.config.js', 'next.config.ts',
  'nuxt.config.ts', 'vite.config.ts', 'tsconfig.json',
  'app.py', 'main.py', 'index.ts', 'index.js',
  'src/App.tsx', 'src/App.jsx', 'src/main.ts', 'src/main.tsx',
  'src/index.ts', 'src/index.tsx',
];

export async function scanDraftProject(projectPath: string): Promise<ProjectScan> {
  const files = collectFiles(projectPath, projectPath);
  const techStack = detectTechStack(projectPath, files);
  const framework = detectFramework(projectPath, files);
  const language = detectLanguage(files);
  const dependencies = readDependencies(projectPath);
  const structure = generateStructure(projectPath, projectPath, 0, 3);
  const readmeContent = readFileIfExists(projectPath, ['README.md', 'readme.md', 'README']);
  const packageJsonContent = readJsonIfExists(path.join(projectPath, 'package.json'));
  const mainFiles = getImportantFileContents(projectPath);

  return {
    files,
    totalFiles: files.length,
    hasPackageJson: fs.existsSync(path.join(projectPath, 'package.json')),
    hasReadme: !!readmeContent,
    techStack,
    framework,
    language,
    dependencies,
    structure,
    readmeContent,
    packageJsonContent: packageJsonContent as Record<string, unknown> | undefined,
    mainFiles,
  };
}

function collectFiles(dir: string, rootDir: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(rootDir, fullPath);

    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath, rootDir));
    } else {
      results.push(relativePath);
    }
  }

  return results;
}

function detectTechStack(projectPath: string, files: string[]): string[] {
  const stack: string[] = [];
  const pkg = readJsonIfExists(path.join(projectPath, 'package.json')) as Record<string, Record<string, string>> | null;

  if (pkg) {
    const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    if (allDeps['react']) stack.push('React');
    if (allDeps['next']) stack.push('Next.js');
    if (allDeps['vue']) stack.push('Vue');
    if (allDeps['nuxt']) stack.push('Nuxt');
    if (allDeps['svelte']) stack.push('Svelte');
    if (allDeps['express']) stack.push('Express');
    if (allDeps['fastify']) stack.push('Fastify');
    if (allDeps['prisma'] || allDeps['@prisma/client']) stack.push('Prisma');
    if (allDeps['mongoose']) stack.push('MongoDB/Mongoose');
    if (allDeps['pg'] || allDeps['postgres']) stack.push('PostgreSQL');
    if (allDeps['tailwindcss']) stack.push('Tailwind CSS');
    if (allDeps['stripe']) stack.push('Stripe');
    if (allDeps['firebase'] || allDeps['firebase-admin']) stack.push('Firebase');
    if (allDeps['supabase'] || allDeps['@supabase/supabase-js']) stack.push('Supabase');
    if (allDeps['typescript']) stack.push('TypeScript');
  }

  if (files.some(f => f.endsWith('.py'))) stack.push('Python');
  if (fs.existsSync(path.join(projectPath, 'requirements.txt'))) stack.push('pip');
  if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) stack.push('Rust');
  if (fs.existsSync(path.join(projectPath, 'go.mod'))) stack.push('Go');

  return [...new Set(stack)];
}

function detectFramework(projectPath: string, _files: string[]): string | undefined {
  const pkg = readJsonIfExists(path.join(projectPath, 'package.json')) as Record<string, Record<string, string>> | null;
  if (!pkg) return undefined;

  const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  if (allDeps['next']) return 'Next.js';
  if (allDeps['nuxt']) return 'Nuxt';
  if (allDeps['@sveltejs/kit']) return 'SvelteKit';
  if (allDeps['gatsby']) return 'Gatsby';
  if (allDeps['remix']) return 'Remix';
  if (allDeps['astro']) return 'Astro';
  if (allDeps['vue']) return 'Vue';
  if (allDeps['react']) return 'React';
  if (allDeps['express']) return 'Express';
  if (allDeps['fastify']) return 'Fastify';

  return undefined;
}

function detectLanguage(files: string[]): string | undefined {
  const counts: Record<string, number> = {};
  for (const f of files) {
    const ext = path.extname(f);
    if (['.ts', '.tsx'].includes(ext)) counts['TypeScript'] = (counts['TypeScript'] || 0) + 1;
    else if (['.js', '.jsx'].includes(ext)) counts['JavaScript'] = (counts['JavaScript'] || 0) + 1;
    else if (ext === '.py') counts['Python'] = (counts['Python'] || 0) + 1;
    else if (ext === '.go') counts['Go'] = (counts['Go'] || 0) + 1;
    else if (ext === '.rs') counts['Rust'] = (counts['Rust'] || 0) + 1;
    else if (ext === '.rb') counts['Ruby'] = (counts['Ruby'] || 0) + 1;
  }

  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  return sorted[0]?.[0];
}

function readDependencies(projectPath: string): Record<string, string> {
  const pkg = readJsonIfExists(path.join(projectPath, 'package.json')) as Record<string, Record<string, string>> | null;
  if (pkg) {
    return { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
  }
  return {};
}

function generateStructure(dir: string, rootDir: string, depth: number, maxDepth: number): string {
  if (depth > maxDepth || !fs.existsSync(dir)) return '';

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const lines: string[] = [];
  const indent = '  '.repeat(depth);

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;

    if (entry.isDirectory()) {
      lines.push(`${indent}${entry.name}/`);
      lines.push(generateStructure(path.join(dir, entry.name), rootDir, depth + 1, maxDepth));
    } else {
      const ext = path.extname(entry.name);
      if (CODE_EXTENSIONS.has(ext) || IMPORTANT_FILES.includes(entry.name)) {
        lines.push(`${indent}${entry.name}`);
      }
    }
  }

  return lines.filter(Boolean).join('\n');
}

function readFileIfExists(projectPath: string, filenames: string[]): string | undefined {
  for (const filename of filenames) {
    const filePath = path.join(projectPath, filename);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8').slice(0, 5000);
    }
  }
  return undefined;
}

function readJsonIfExists(filePath: string): unknown | null {
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function getImportantFileContents(projectPath: string): FilePreview[] {
  const previews: FilePreview[] = [];

  for (const relPath of IMPORTANT_FILES) {
    const fullPath = path.join(projectPath, relPath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const lines = content.split('\n').slice(0, 200).join('\n');
        const ext = path.extname(relPath).slice(1) || 'text';
        previews.push({ path: relPath, content: lines, language: ext });

        if (previews.length >= 10) break;
      } catch {
        // skip unreadable files
      }
    }
  }

  return previews;
}
