import React from 'react';
import { Rocket, ArrowLeft, Settings } from 'lucide-react';

interface HeaderProps {
  onBack?: () => void;
  onSettings?: () => void;
  title?: string;
}

export function Header({ onBack, onSettings, title }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Rocket className="w-7 h-7" />
          <div>
            <h1 className="text-xl font-bold">{title || 'SaaS Draft Monetizer'}</h1>
            <p className="text-xs text-violet-200">Da bozza a business automaticamente</p>
          </div>
        </div>
        {onSettings && (
          <button onClick={onSettings} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        )}
      </div>
    </header>
  );
}
