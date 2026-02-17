import React from 'react';
import {
  Brain, Play, DollarSign, Loader2, Target, Users, Zap,
  TrendingUp, AlertTriangle, CheckCircle2, XCircle, Code,
  CreditCard, Globe, Megaphone, FileText,
} from 'lucide-react';
import type { DraftProject } from '../types';
import { PipelineView } from './PipelineView';
import { PricingPreview } from './PricingPreview';
import { LandingPreview } from './LandingPreview';

interface DraftDetailProps {
  draft: DraftProject;
  actionLoading: boolean;
  onAnalyze: () => void;
  onMonetize: () => void;
  onFullPipeline: () => void;
  onCompleteStep: (stepId: string) => void;
  onSetupStripe: () => void;
}

export function DraftDetail({
  draft,
  actionLoading,
  onAnalyze,
  onMonetize,
  onFullPipeline,
  onCompleteStep,
  onSetupStripe,
}: DraftDetailProps) {
  const { analysis, monetizationPlan, pipeline, scan } = draft;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {!analysis && (
          <button
            onClick={onFullPipeline}
            disabled={actionLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-violet-700 hover:to-indigo-700 disabled:opacity-50 transition-all shadow-md"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
            Pipeline completa (Analisi + Monetizzazione)
          </button>
        )}
        {!analysis && (
          <button
            onClick={onAnalyze}
            disabled={actionLoading}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-3 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition-all"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Brain className="w-5 h-5" />}
            Solo analisi
          </button>
        )}
        {analysis && !monetizationPlan && (
          <button
            onClick={onMonetize}
            disabled={actionLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-lg font-medium hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 transition-all shadow-md"
          >
            {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
            Genera piano di monetizzazione
          </button>
        )}
      </div>

      {/* Project info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scan info */}
          {scan && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Code className="w-5 h-5 text-violet-500" />
                Struttura progetto
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <Stat label="File" value={scan.totalFiles.toString()} />
                <Stat label="Framework" value={scan.framework || 'N/A'} />
                <Stat label="Linguaggio" value={scan.language || 'N/A'} />
                <Stat label="Dipendenze" value={Object.keys(scan.dependencies).length.toString()} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {scan.techStack.map(tech => (
                  <span key={tech} className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-full font-medium">
                    {tech}
                  </span>
                ))}
              </div>
              {scan.structure && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Mostra struttura file
                  </summary>
                  <pre className="mt-2 text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto max-h-60">
                    {scan.structure}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Analysis */}
          {analysis && (
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-500" />
                Analisi AI
              </h3>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Descrizione</h4>
                  <p className="text-gray-700">{analysis.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoCard icon={<Target className="w-4 h-4" />} title="Problema risolto" text={analysis.problemSolved} />
                  <InfoCard icon={<Users className="w-4 h-4" />} title="Target audience" text={analysis.targetAudience} />
                  <InfoCard icon={<Zap className="w-4 h-4" />} title="USP" text={analysis.uniqueSellingPoint} />
                  <InfoCard icon={<TrendingUp className="w-4 h-4" />} title="Competitor" text={analysis.competitorAnalysis} />
                </div>

                {/* Completion bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Completamento</span>
                    <span className="font-medium">{analysis.completionPercentage}% - {analysis.currentState}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                      style={{ width: `${analysis.completionPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Features</h4>
                  <div className="space-y-1.5">
                    {analysis.features.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        {f.implemented
                          ? <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          : <XCircle className="w-4 h-4 text-gray-300 flex-shrink-0" />}
                        <span className={f.implemented ? 'text-gray-700' : 'text-gray-400'}>
                          {f.name}
                        </span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColor(f.priority)}`}>
                          {f.priority}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Missing for MVP */}
                {analysis.missingForMvp.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2 flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      Mancante per MVP
                    </h4>
                    <ul className="space-y-1">
                      {analysis.missingForMvp.map((item, i) => (
                        <li key={i} className="text-sm text-amber-700 bg-amber-50 px-3 py-1.5 rounded">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Pipeline */}
          {pipeline && (
            <PipelineView pipeline={pipeline} onCompleteStep={onCompleteStep} />
          )}

          {/* Landing page preview */}
          {monetizationPlan?.landingPage && (
            <LandingPreview landing={monetizationPlan.landingPage} />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick stats */}
          {analysis && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Overview</h3>
              <div className="space-y-3">
                <SidebarItem label="Categoria" value={analysis.category} />
                <SidebarItem label="Stato" value={analysis.currentState} />
                <SidebarItem label="Completamento" value={`${analysis.completionPercentage}%`} />
              </div>
            </div>
          )}

          {/* Monetization */}
          {monetizationPlan && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                <DollarSign className="w-4 h-4 text-emerald-500" />
                Monetizzazione
              </h3>
              <div className="space-y-3">
                <SidebarItem label="Strategia" value={monetizationPlan.strategy} />
                <SidebarItem
                  label="Revenue target"
                  value={`${monetizationPlan.revenueProjection.monthlyTarget} EUR/mese`}
                />
                <SidebarItem
                  label="Break-even"
                  value={`${monetizationPlan.revenueProjection.breakEvenMonths} mesi`}
                />
                <SidebarItem
                  label="Traffico necessario"
                  value={`${monetizationPlan.revenueProjection.estimatedTrafficNeeded} visite/mese`}
                />
              </div>
            </div>
          )}

          {/* Pricing preview */}
          {monetizationPlan?.pricingTiers && (
            <PricingPreview tiers={monetizationPlan.pricingTiers} />
          )}

          {/* Stripe */}
          {monetizationPlan && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                <CreditCard className="w-4 h-4 text-blue-500" />
                Stripe
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                {monetizationPlan.stripeConfig.productName}
              </p>
              <button
                onClick={onSetupStripe}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <CreditCard className="w-4 h-4" />
                Configura Stripe
              </button>
            </div>
          )}

          {/* Marketing channels */}
          {monetizationPlan?.marketingPlan && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Megaphone className="w-4 h-4 text-orange-500" />
                Marketing
              </h3>
              <div className="space-y-2">
                {monetizationPlan.marketingPlan.channels.map((ch, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{ch.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor(ch.priority)}`}>
                      {ch.priority}
                    </span>
                  </div>
                ))}
              </div>
              {monetizationPlan.marketingPlan.seoKeywords.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-1">SEO Keywords</p>
                  <div className="flex flex-wrap gap-1">
                    {monetizationPlan.marketingPlan.seoKeywords.slice(0, 8).map((kw, i) => (
                      <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Launch strategy */}
          {monetizationPlan?.marketingPlan?.launchStrategy && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                <Globe className="w-4 h-4 text-green-500" />
                Strategia lancio
              </h3>
              <p className="text-sm text-gray-600">{monetizationPlan.marketingPlan.launchStrategy}</p>
            </div>
          )}

          {/* Social posts preview */}
          {monetizationPlan?.marketingPlan?.socialMediaPosts && monetizationPlan.marketingPlan.socialMediaPosts.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
                <FileText className="w-4 h-4 text-sky-500" />
                Post pronti
              </h3>
              <div className="space-y-3">
                {monetizationPlan.marketingPlan.socialMediaPosts.slice(0, 3).map((post, i) => (
                  <div key={i} className="text-sm bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">{post.platform}</p>
                    <p className="text-gray-700 text-xs">{post.content.slice(0, 120)}...</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
        {icon} {title}
      </div>
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}

function SidebarItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function priorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'bg-red-100 text-red-700';
    case 'high': return 'bg-orange-100 text-orange-700';
    case 'medium': return 'bg-yellow-100 text-yellow-700';
    case 'low': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}
