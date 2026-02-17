import OpenAI from 'openai';
import type { ProjectScan, ProjectAnalysis, MonetizationPlan } from '../../shared/types.ts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

export async function analyzeProject(scan: ProjectScan): Promise<ProjectAnalysis> {
  const prompt = buildAnalysisPrompt(scan);

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `Sei un esperto analista di prodotti SaaS e micro-SaaS. Analizzi progetti software e ne comprendi il potenziale commerciale. Rispondi SEMPRE in JSON valido.`,
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty LLM response');

  return JSON.parse(content) as ProjectAnalysis;
}

export async function generateMonetizationPlan(
  scan: ProjectScan,
  analysis: ProjectAnalysis
): Promise<MonetizationPlan> {
  const prompt = buildMonetizationPrompt(scan, analysis);

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `Sei un esperto di monetizzazione SaaS, growth hacking e marketing digitale. Crei piani dettagliati per portare micro-SaaS dalla bozza alla monetizzazione. Rispondi SEMPRE in JSON valido.`,
      },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 6000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty LLM response');

  return JSON.parse(content) as MonetizationPlan;
}

export async function generateMarketingCopy(
  analysis: ProjectAnalysis,
  type: 'social' | 'email' | 'landing' | 'ad'
): Promise<string> {
  const prompts: Record<string, string> = {
    social: `Crea 5 post per social media (Twitter/X, LinkedIn) per promuovere "${analysis.name}": ${analysis.description}. Target: ${analysis.targetAudience}. USP: ${analysis.uniqueSellingPoint}. Formato JSON: { "posts": [{ "platform": "...", "content": "...", "hashtags": ["..."] }] }`,
    email: `Crea una sequenza di 3 email di lancio per "${analysis.name}": ${analysis.description}. Target: ${analysis.targetAudience}. Formato JSON: { "emails": [{ "subject": "...", "body": "...", "sendDay": 1 }] }`,
    landing: `Crea il contenuto per una landing page per "${analysis.name}": ${analysis.description}. USP: ${analysis.uniqueSellingPoint}. Formato JSON: { "headline": "...", "subheadline": "...", "heroDescription": "...", "features": [{ "title": "...", "description": "...", "icon": "..." }], "testimonialPrompts": ["..."], "ctaText": "...", "faqItems": [{ "question": "...", "answer": "..." }] }`,
    ad: `Crea 3 varianti di annunci pubblicitari (Google Ads + Facebook Ads) per "${analysis.name}": ${analysis.description}. Target: ${analysis.targetAudience}. Formato JSON: { "ads": [{ "platform": "...", "headline": "...", "description": "...", "cta": "..." }] }`,
  };

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: 'Sei un copywriter esperto di marketing digitale per prodotti SaaS. Rispondi SEMPRE in JSON valido.',
      },
      { role: 'user', content: prompts[type] || prompts.social },
    ],
    temperature: 0.8,
    max_tokens: 3000,
    response_format: { type: 'json_object' },
  });

  return response.choices[0]?.message?.content || '{}';
}

function buildAnalysisPrompt(scan: ProjectScan): string {
  const fileList = scan.files.slice(0, 50).join('\n');
  const mainFilesContent = scan.mainFiles
    .map(f => `--- ${f.path} ---\n${f.content}`)
    .join('\n\n');

  return `Analizza questo progetto software (bozza di micro-SaaS) e fornisci un'analisi dettagliata.

## Struttura del progetto
${scan.structure}

## File (${scan.totalFiles} totali)
${fileList}

## Tech Stack rilevato
${scan.techStack.join(', ')}
Framework: ${scan.framework || 'Non rilevato'}
Linguaggio principale: ${scan.language || 'Non rilevato'}

## README
${scan.readmeContent || 'Nessun README trovato'}

## File principali
${mainFilesContent}

## Dipendenze
${JSON.stringify(scan.dependencies, null, 2)}

Rispondi con un JSON con questa struttura ESATTA:
{
  "name": "Nome del progetto",
  "description": "Descrizione dettagliata di cosa fa",
  "category": "Categoria (es. Productivity, Analytics, Automation, Communication, Education, Finance, Health, Marketing, Developer Tools)",
  "targetAudience": "Pubblico target",
  "problemSolved": "Problema che risolve",
  "currentState": "skeleton|prototype|mvp|beta|near-complete",
  "completionPercentage": 35,
  "features": [
    { "name": "Feature", "description": "Desc", "implemented": true, "priority": "critical|high|medium|low" }
  ],
  "missingForMvp": ["Cosa manca per essere un MVP funzionante"],
  "strengths": ["Punti di forza"],
  "weaknesses": ["Punti deboli"],
  "competitorAnalysis": "Analisi dei competitor",
  "uniqueSellingPoint": "Proposta di valore unica"
}`;
}

function buildMonetizationPrompt(scan: ProjectScan, analysis: ProjectAnalysis): string {
  return `Basandoti su questa analisi di un micro-SaaS, crea un piano di monetizzazione completo.

## Progetto: ${analysis.name}
${analysis.description}

## Categoria: ${analysis.category}
## Target: ${analysis.targetAudience}
## Problema risolto: ${analysis.problemSolved}
## USP: ${analysis.uniqueSellingPoint}
## Stato attuale: ${analysis.currentState} (${analysis.completionPercentage}% completo)
## Tech Stack: ${scan.techStack.join(', ')}

## Feature implementate:
${analysis.features.filter(f => f.implemented).map(f => `- ${f.name}: ${f.description}`).join('\n')}

## Feature mancanti per MVP:
${analysis.missingForMvp.map(m => `- ${m}`).join('\n')}

Rispondi con un JSON con questa struttura ESATTA:
{
  "strategy": "freemium|subscription|one-time|usage-based|tiered",
  "pricingTiers": [
    {
      "name": "Free|Basic|Pro|Enterprise",
      "price": 0,
      "currency": "eur",
      "interval": "month|year|one-time",
      "features": ["Feature inclusa"],
      "highlighted": false
    }
  ],
  "revenueProjection": {
    "monthlyTarget": 1000,
    "estimatedConversionRate": 0.03,
    "estimatedTrafficNeeded": 5000,
    "breakEvenMonths": 6,
    "reasoning": "Spiegazione della proiezione"
  },
  "marketingPlan": {
    "channels": [
      { "name": "Canale", "strategy": "Strategia", "estimatedCost": 0, "priority": "high|medium|low" }
    ],
    "launchStrategy": "Piano di lancio dettagliato",
    "seoKeywords": ["keyword1", "keyword2"],
    "socialMediaPosts": [
      { "platform": "twitter|linkedin|reddit", "content": "Post content", "hashtags": ["hashtag"] }
    ],
    "emailSequence": [
      { "subject": "Oggetto", "body": "Corpo email", "sendDay": 1 }
    ]
  },
  "landingPage": {
    "headline": "Titolo principale",
    "subheadline": "Sottotitolo",
    "heroDescription": "Descrizione hero",
    "features": [
      { "title": "Feature", "description": "Desc", "icon": "icon-name" }
    ],
    "testimonialPrompts": ["Prompt per testimonial"],
    "ctaText": "Call to action",
    "faqItems": [
      { "question": "Domanda", "answer": "Risposta" }
    ]
  },
  "tasksToComplete": [
    {
      "id": "task-1",
      "title": "Titolo task",
      "description": "Descrizione dettagliata",
      "category": "code|stripe|landing|marketing|deploy",
      "completed": false,
      "automated": true
    }
  ],
  "stripeConfig": {
    "productName": "Nome prodotto su Stripe",
    "productDescription": "Descrizione prodotto",
    "prices": [
      { "tierName": "Pro", "unitAmount": 999, "currency": "eur", "interval": "month" }
    ],
    "checkoutMode": "payment|subscription",
    "successUrl": "/success",
    "cancelUrl": "/pricing"
  }
}`;
}
