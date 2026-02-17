import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, FolderOpen, Brain, CreditCard, LogIn, LogOut } from 'lucide-react';
import { api } from '../services/api';

interface Config {
  llmConfigured: boolean;
  authMethod: 'oauth' | 'api_key' | 'none';
  stripeConfigured: boolean;
  draftsDir: string;
  llmModel: string;
}

export function SettingsView() {
  const [config, setConfig] = useState<Config | null>(null);
  const [authState, setAuthState] = useState<'idle' | 'waiting' | 'entering'>('idle');
  const [pendingState, setPendingState] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const refreshConfig = () => api.getConfig().then(setConfig).catch(() => {});

  useEffect(() => { refreshConfig(); }, []);

  const handleLogin = async () => {
    try {
      setAuthError('');
      setAuthLoading(true);
      const { authUrl, state } = await api.startLogin();
      setPendingState(state);
      setAuthState('waiting');
      // Open Anthropic OAuth in new tab
      window.open(authUrl, '_blank');
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCodeSubmit = async () => {
    if (!codeInput.trim()) return;
    try {
      setAuthError('');
      setAuthLoading(true);

      // Extract code from URL or raw input
      let code = codeInput.trim();
      // If user pasted full URL, extract the code
      if (code.includes('code=')) {
        const url = new URL(code.replace('#', '?')); // handle fragment as query
        code = url.searchParams.get('code') || code;
      }

      await api.completeLogin(code, pendingState);
      setAuthState('idle');
      setCodeInput('');
      refreshConfig();
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Code exchange failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      refreshConfig();
    } catch {
      // ignore
    }
  };

  if (!config) return null;

  const llmDescription = config.authMethod === 'oauth'
    ? `Claude ${config.llmModel} (OAuth)`
    : config.authMethod === 'api_key'
    ? `Claude ${config.llmModel} (API key)`
    : 'Non autenticato';

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
          description={llmDescription}
          configured={config.llmConfigured}
        />
        <ConfigItem
          icon={<CreditCard className="w-5 h-5 text-blue-500" />}
          title="Stripe"
          description={config.stripeConfigured ? 'Stripe collegato' : 'Configura STRIPE_SECRET_KEY nel file .env'}
          configured={config.stripeConfigured}
        />
      </div>

      {/* OAuth Login Section */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <LogIn className="w-5 h-5 text-orange-500" />
          Autenticazione Claude
        </h3>

        {config.authMethod === 'oauth' ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-green-600">Autenticato via OAuth (abbonamento Claude)</p>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        ) : authState === 'idle' ? (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Accedi con il tuo abbonamento Claude (Pro/Max) per usare l'AI senza API key separata.
            </p>
            <button
              onClick={handleLogin}
              disabled={authLoading}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors text-sm font-medium"
            >
              {authLoading ? 'Avvio...' : 'Login con Claude'}
            </button>
          </div>
        ) : (
          <div>
            <p className="text-sm text-gray-600 mb-2">
              1. Una nuova scheda si e' aperta su claude.ai per l'autorizzazione.<br />
              2. Dopo aver autorizzato, verrai reindirizzato a una pagina con un codice nell'URL.<br />
              3. Copia l'intero URL (o solo il codice) e incollalo qui sotto:
            </p>
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Incolla qui l'URL o il codice..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={handleCodeSubmit}
                disabled={authLoading || !codeInput.trim()}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {authLoading ? '...' : 'Conferma'}
              </button>
              <button
                onClick={() => { setAuthState('idle'); setCodeInput(''); setAuthError(''); }}
                className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                Annulla
              </button>
            </div>
          </div>
        )}

        {authError && (
          <p className="mt-2 text-sm text-red-600">{authError}</p>
        )}
      </div>

      <div className="mt-8 bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-3">Come usare</h3>
        <ol className="space-y-2 text-sm text-gray-600 list-decimal list-inside">
          <li>Clicca <strong>"Login con Claude"</strong> qui sopra per autenticarti, oppure configura <code className="bg-gray-200 px-1 rounded">ANTHROPIC_API_KEY</code> nel file .env</li>
          <li>Aggiungi le tue bozze di micro-SaaS come sottocartelle nella directory <code className="bg-gray-200 px-1 rounded">{config.draftsDir}</code></li>
          <li>La webapp rileva automaticamente le nuove cartelle</li>
          <li>Clicca su una bozza e lancia la "Pipeline completa" per analizzarla e generare un piano di monetizzazione</li>
          <li>Segui i passi della pipeline per completare la monetizzazione</li>
        </ol>
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-6">
        <h3 className="font-semibold text-amber-800 mb-2">Alternativa: API key nel .env</h3>
        <pre className="text-xs text-amber-700 bg-amber-100 p-3 rounded-lg overflow-x-auto">{`# .env
ANTHROPIC_API_KEY=sk-ant-...
LLM_MODEL=claude-opus-4-6

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
