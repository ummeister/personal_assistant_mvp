import OpenAI from 'openai';
import type { ProjectScan, ProjectAnalysis, MonetizationPlan } from '../../shared/types.ts';
import { parseLLMResponse, ProjectAnalysisSchema, MonetizationPlanSchema } from './llmValidation.ts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

const MODEL = process.env.LLM_MODEL || 'gpt-4o-mini';

/**
 * Analizza un progetto usando l'AI.
 * Il parametro `skillContext` e' il contenuto di skill.md caricato dall'Orchestrator.
 * Quando presente, il cervello opera al massimo potenziale.
 */
export async function analyzeProject(scan: ProjectScan, skillContext?: string): Promise<ProjectAnalysis> {
  const systemPrompt = skillContext
    ? `${skillContext}\n\n---\n\nOra applica tutto il framework sopra per analizzare il seguente progetto. Rispondi SEMPRE in JSON valido.`
    : `Sei un esperto analista di prodotti SaaS e micro-SaaS. Analizzi progetti software e ne comprendi il potenziale commerciale. Rispondi SEMPRE in JSON valido.`;

  const prompt = buildAnalysisPrompt(scan);

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty LLM response');

  return parseLLMResponse(content, ProjectAnalysisSchema, 'analyzeProject');
}

/**
 * Genera un piano di monetizzazione completo.
 * Con skill.md, il piano sara' molto piu' dettagliato e azionabile.
 */
export async function generateMonetizationPlan(
  scan: ProjectScan,
  analysis: ProjectAnalysis,
  skillContext?: string
): Promise<MonetizationPlan> {
  const systemPrompt = skillContext
    ? `${skillContext}\n\n---\n\nOra applica il framework di monetizzazione sopra per creare un piano completo. Concentrati su:\n- Strategia di pricing basata sulle regole d'oro\n- Piano marketing con canali prioritari per micro-SaaS\n- Landing page che segue la struttura "Above the fold + Social proof + Features + Pricing + FAQ"\n- Task azionabili che un developer solo puo' completare in 2-4 settimane\n- Proiezioni CONSERVATIVE di revenue\n\nRispondi SEMPRE in JSON valido.`
    : `Sei un esperto di monetizzazione SaaS, growth hacking e marketing digitale. Crei piani dettagliati per portare micro-SaaS dalla bozza alla monetizzazione. Rispondi SEMPRE in JSON valido.`;

  const prompt = buildMonetizationPrompt(scan, analysis);

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 6000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('Empty LLM response');

  return parseLLMResponse(content, MonetizationPlanSchema, 'generateMonetizationPlan');
}

/**
 * Genera copy di marketing (social, email, landing, ad).
 */
export async function generateMarketingCopy(
  analysis: ProjectAnalysis,
  type: 'social' | 'email' | 'landing' | 'ad',
  skillContext?: string
): Promise<string> {
  const prompts: Record<string, string> = {
    social: `Crea 5 post per social media (Twitter/X, LinkedIn, Reddit) per promuovere "${analysis.name}": ${analysis.description}.
Target: ${analysis.targetAudience}.
USP: ${analysis.uniqueSellingPoint}.
Problema risolto: ${analysis.problemSolved}.

Regole:
- Ogni post deve poter essere copiato e incollato direttamente
- Usa hook nei primi 10 caratteri per fermare lo scroll
- Includi una CTA chiara
- Varia il tono: uno informativo, uno emotivo, uno con numeri, uno provocatorio, uno con storia
- Per Reddit: sii utile prima di promuovere
- Per Twitter: max 280 caratteri
- Per LinkedIn: formato lista con emoji per leggibilita'

Formato JSON: { "posts": [{ "platform": "twitter|linkedin|reddit", "content": "...", "hashtags": ["..."] }] }`,

    email: `Crea una sequenza di 3 email di lancio per "${analysis.name}": ${analysis.description}.
Target: ${analysis.targetAudience}.

Sequenza:
- Email 1 (giorno 0): Lancio - annuncia il prodotto, spiega il problema, mostra la soluzione
- Email 2 (giorno 3): Valore - case study o demo, mostra risultati concreti
- Email 3 (giorno 7): Urgenza - offerta limitata o scarsita', ultima CTA

Regole subject line:
- Usa numeri ("3 modi per...", "Il 73% dei...")
- Usa domande ("Stai ancora facendo X manualmente?")
- Max 50 caratteri

Formato JSON: { "emails": [{ "subject": "...", "body": "...", "sendDay": 0 }] }`,

    landing: `Crea il contenuto completo per una landing page ad alta conversione per "${analysis.name}": ${analysis.description}.
USP: ${analysis.uniqueSellingPoint}.
Target: ${analysis.targetAudience}.
Problema: ${analysis.problemSolved}.

Struttura:
1. Hero: Headline benefit-driven + sottotitolo + CTA
2. Pain points: 3 problemi che l'utente ha ORA
3. Soluzione: Come il prodotto li risolve
4. Features: 4-6 con titolo, descrizione, icona
5. Social proof: Placeholder per numeri e testimonial
6. Pricing: Anticipa i tier
7. FAQ: 5 domande che rispondono alle obiezioni
8. Final CTA

Formato JSON: { "headline": "...", "subheadline": "...", "heroDescription": "...", "features": [{ "title": "...", "description": "...", "icon": "..." }], "testimonialPrompts": ["..."], "ctaText": "...", "faqItems": [{ "question": "...", "answer": "..." }] }`,

    ad: `Crea 4 varianti di annunci per "${analysis.name}": ${analysis.description}.
Target: ${analysis.targetAudience}.

Piattaforme:
1. Google Ads (Search): headline max 30 char + description max 90 char
2. Google Ads (Display): headline + description + CTA
3. Facebook/Instagram: copy lungo con emoji + headline breve + CTA
4. LinkedIn Ads: tono professionale, focus ROI e produttivita'

Formato JSON: { "ads": [{ "platform": "...", "headline": "...", "description": "...", "cta": "..." }] }`,
  };

  const systemPrompt = skillContext
    ? `${skillContext}\n\n---\n\nSei in modalita' copywriting. Crea copy persuasivo e pronto per l'uso. Rispondi SEMPRE in JSON valido.`
    : 'Sei un copywriter esperto di marketing digitale per prodotti SaaS. Rispondi SEMPRE in JSON valido.';

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
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
  "name": "Nome del progetto (scegli un nome commerciale accattivante se non ne ha uno)",
  "description": "Descrizione dettagliata di cosa fa e perche' qualcuno dovrebbe pagare per usarlo",
  "category": "Categoria (Productivity, Analytics, Automation, Communication, Education, Finance, Health, Marketing, Developer Tools, AI Tools, Creator Economy)",
  "targetAudience": "Pubblico target specifico (non generico - es. 'freelance designer che gestiscono 5-20 clienti')",
  "problemSolved": "Il problema CONCRETO che risolve (es. 'Perdi 3 ore/settimana a creare fatture manualmente')",
  "currentState": "skeleton|prototype|mvp|beta|near-complete",
  "completionPercentage": 35,
  "features": [
    { "name": "Feature", "description": "Desc", "implemented": true, "priority": "critical|high|medium|low" }
  ],
  "missingForMvp": ["Lista specifica di cosa manca per essere un MVP monetizzabile"],
  "strengths": ["Punti di forza concreti"],
  "weaknesses": ["Punti deboli onesti"],
  "competitorAnalysis": "Analisi specifica dei competitor diretti con nomi e differenze",
  "uniqueSellingPoint": "La SINGOLA ragione per cui qualcuno sceglierebbe questo invece dei competitor"
}`;
}

function buildMonetizationPrompt(scan: ProjectScan, analysis: ProjectAnalysis): string {
  return `Basandoti su questa analisi di un micro-SaaS, crea un piano di monetizzazione completo e AZIONABILE.

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

## Punti di forza:
${analysis.strengths.join('\n')}

## Debolezze:
${analysis.weaknesses.join('\n')}

## Competitor: ${analysis.competitorAnalysis}

IMPORTANTE: Ogni task deve essere completabile da un solo developer. Le proiezioni devono essere conservative. I post social devono essere pronti per copia-incolla.

Rispondi con un JSON con questa struttura ESATTA:
{
  "strategy": "freemium|subscription|one-time|usage-based|tiered",
  "pricingTiers": [
    {
      "name": "Free|Basic|Pro|Enterprise",
      "price": 0,
      "currency": "eur",
      "interval": "month|year|one-time",
      "features": ["Feature inclusa - sii specifico"],
      "highlighted": false
    }
  ],
  "revenueProjection": {
    "monthlyTarget": 1000,
    "estimatedConversionRate": 0.03,
    "estimatedTrafficNeeded": 5000,
    "breakEvenMonths": 6,
    "reasoning": "Spiegazione dettagliata con calcoli"
  },
  "marketingPlan": {
    "channels": [
      { "name": "Canale specifico", "strategy": "Strategia dettagliata con azioni concrete", "estimatedCost": 0, "priority": "high|medium|low" }
    ],
    "launchStrategy": "Piano di lancio giorno per giorno per la prima settimana",
    "seoKeywords": ["keyword1", "keyword2"],
    "socialMediaPosts": [
      { "platform": "twitter|linkedin|reddit", "content": "Post COMPLETO pronto per copia-incolla", "hashtags": ["hashtag"] }
    ],
    "emailSequence": [
      { "subject": "Subject line testata", "body": "Corpo email completo con formattazione", "sendDay": 0 }
    ]
  },
  "landingPage": {
    "headline": "Headline benefit-driven (max 10 parole)",
    "subheadline": "Sottotitolo che spiega il come",
    "heroDescription": "Paragrafo che descrive il valore in 2-3 frasi",
    "features": [
      { "title": "Feature title", "description": "Benefit description", "icon": "lucide-icon-name" }
    ],
    "testimonialPrompts": ["Placeholder testimonial realistici"],
    "ctaText": "CTA action-oriented",
    "faqItems": [
      { "question": "Obiezione comune", "answer": "Risposta convincente" }
    ]
  },
  "tasksToComplete": [
    {
      "id": "task-1",
      "title": "Azione specifica",
      "description": "Descrizione passo-passo di cosa fare",
      "category": "code|stripe|landing|marketing|deploy",
      "completed": false,
      "automated": true
    }
  ],
  "stripeConfig": {
    "productName": "Nome prodotto su Stripe",
    "productDescription": "Descrizione per la dashboard Stripe",
    "prices": [
      { "tierName": "Pro", "unitAmount": 999, "currency": "eur", "interval": "month" }
    ],
    "checkoutMode": "payment|subscription",
    "successUrl": "/success",
    "cancelUrl": "/pricing"
  }
}`;
}
