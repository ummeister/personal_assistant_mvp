import React from 'react';
import {
  CheckCircle2, Circle, Loader2, XCircle, SkipForward,
  Brain, Code, DollarSign, Megaphone, Rocket,
} from 'lucide-react';
import type { PipelineState, PipelineStep } from '../types';

interface PipelineViewProps {
  pipeline: PipelineState;
  onCompleteStep: (stepId: string) => void;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  analysis: <Brain className="w-4 h-4" />,
  development: <Code className="w-4 h-4" />,
  monetization: <DollarSign className="w-4 h-4" />,
  marketing: <Megaphone className="w-4 h-4" />,
  deployment: <Rocket className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  analysis: 'border-purple-200 bg-purple-50',
  development: 'border-blue-200 bg-blue-50',
  monetization: 'border-emerald-200 bg-emerald-50',
  marketing: 'border-orange-200 bg-orange-50',
  deployment: 'border-green-200 bg-green-50',
};

const CATEGORY_LABELS: Record<string, string> = {
  analysis: 'Analisi',
  development: 'Sviluppo',
  monetization: 'Monetizzazione',
  marketing: 'Marketing',
  deployment: 'Deployment',
};

export function PipelineView({ pipeline, onCompleteStep }: PipelineViewProps) {
  const completed = pipeline.steps.filter(s => s.status === 'completed').length;
  const total = pipeline.steps.length;
  const progress = Math.round((completed / total) * 100);

  // Group steps by category
  const grouped = pipeline.steps.reduce<Record<string, PipelineStep[]>>((acc, step) => {
    if (!acc[step.category]) acc[step.category] = [];
    acc[step.category].push(step);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Rocket className="w-5 h-5 text-indigo-500" />
          Pipeline di monetizzazione
        </h3>
        <span className="text-sm text-gray-500">{completed}/{total} completati ({progress}%)</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-6">
        <div
          className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Grouped steps */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([category, steps]) => (
          <div key={category}>
            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-3 ${CATEGORY_COLORS[category]}`}>
              {CATEGORY_ICONS[category]}
              {CATEGORY_LABELS[category] || category}
            </div>
            <div className="space-y-2 ml-2">
              {steps.map(step => (
                <StepRow key={step.id} step={step} onComplete={() => onCompleteStep(step.id)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepRow({ step, onComplete }: { step: PipelineStep; onComplete: () => void }) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="mt-0.5">
        <StepIcon status={step.status} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${step.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
            {step.name}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-0.5">{step.description}</p>
        {step.error && <p className="text-xs text-red-500 mt-1">{step.error}</p>}
        {step.output && <p className="text-xs text-green-600 mt-1">{step.output}</p>}
      </div>
      {step.status === 'pending' || step.status === 'in_progress' ? (
        <button
          onClick={onComplete}
          className="opacity-0 group-hover:opacity-100 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full hover:bg-green-200 transition-all"
        >
          Completa
        </button>
      ) : null}
    </div>
  );
}

function StepIcon({ status }: { status: string }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    case 'in_progress':
      return <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-500" />;
    case 'skipped':
      return <SkipForward className="w-5 h-5 text-gray-400" />;
    default:
      return <Circle className="w-5 h-5 text-gray-300" />;
  }
}
