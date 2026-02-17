import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, FolderOpen, Brain, CreditCard } from 'lucide-react';
import { api } from '../services/api';

interface Config {
  llmConfigured: boolean;
  stripeConfigured: boolean;
  draftsDir: string;
  llmModel: string;
}

export function SettingsView() {
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    api.getConfig().then(setConfig).catch(() => {});
  }, []);

  if (!config) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Configurazione</h2>

      <div className="space-y-4">
        <ConfigItem
          icon={<FolderOpen className="w-5 h-5 text-violet-500" />}
          title="Cartella drafts"
          description={config.draftsDir}
          configured={true}
        />
        <ConfigItem
          icon={<Brain className="w-5 h-5 text-purple-500" />}
          title="LLM (AI)"
          description={config.llmConfigured ? `Modello: ${config.llmModel}` : 'Configura OPENAI_API_KEY nel file .env'}
          configured={config.llmConfigured}
        />
        <ConfigItem
          icon={<CreditCard className="w-5 h-5 text-blue-500" />}
          title="Stripe"
          description={config.stripeConfigured ? 'Stripe collegato' : 'Configura STRIPE_SECRET_KEY nel file .env'}
          configured={config.stripeConfigured}
        />
      </div>

      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Come usare</h3>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Copia <code className="bg-gray-200 px-1 rounded">.env.example</code> in <code className="bg-gray-200 px-1 rounded">.env</code> e configura le API key</li>
          <li>Aggiungi le tue bozze di micro-SaaS come sottocartelle nella directory <code className="bg-gray-200 px-1 rounded">{config.draftsDir}</code></li>
          <li>La webapp rileva automaticamente le nuove cartelle</li>
          <li>Clicca su una bozza e lancia la "Pipeline completa" per analizzarla e generare un piano di monetizzazione</li>
          <li>Segui i passi della pipeline per completare la monetizzazione</li>
        </ol>
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="font-semibold text-amber-800 mb-2">Variabili d'ambiente necessarie</h3>
        <pre className="text-xs text-amber-700 bg-amber-100 p-3 rounded-lg overflow-x-auto">{`# .env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

PORT=3001
DRAFTS_DIR=./drafts`}</pre>
      </div>
    </div>
  );
}

function ConfigItem({
  icon,
  title,
  description,
  configured,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  configured: boolean;
}) {
  return (
    <div className="flex items-center gap-4 bg-white rounded-xl border border-gray-200 p-4">
      {icon}
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      {configured ? (
        <CheckCircle2 className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-red-400" />
      )}
    </div>
  );
}
