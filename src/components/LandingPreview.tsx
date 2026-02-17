import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { LandingPageContent } from '../types';

interface LandingPreviewProps {
  landing: LandingPageContent;
}

export function LandingPreview({ landing }: LandingPreviewProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wide">
          <ExternalLink className="w-4 h-4 text-violet-500" />
          Anteprima Landing Page
        </h3>
      </div>

      {/* Mock landing page */}
      <div className="bg-gradient-to-b from-violet-600 to-indigo-700 text-white p-8 text-center">
        <h1 className="text-2xl font-bold mb-2">{landing.headline}</h1>
        <p className="text-violet-200 mb-4">{landing.subheadline}</p>
        <p className="text-sm text-violet-100 max-w-lg mx-auto mb-6">{landing.heroDescription}</p>
        <button className="bg-white text-violet-700 px-6 py-2.5 rounded-lg font-semibold text-sm shadow-lg">
          {landing.ctaText}
        </button>
      </div>

      {/* Features */}
      <div className="p-6">
        <h4 className="text-center font-semibold text-gray-900 mb-4">Features</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {landing.features.map((f, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg">
              <h5 className="font-medium text-sm text-gray-900 mb-1">{f.title}</h5>
              <p className="text-xs text-gray-500">{f.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      {landing.faqItems.length > 0 && (
        <div className="p-6 border-t">
          <h4 className="text-center font-semibold text-gray-900 mb-4">FAQ</h4>
          <div className="space-y-3 max-w-lg mx-auto">
            {landing.faqItems.map((faq, i) => (
              <details key={i} className="bg-gray-50 rounded-lg">
                <summary className="p-3 text-sm font-medium text-gray-700 cursor-pointer">
                  {faq.question}
                </summary>
                <p className="px-3 pb-3 text-sm text-gray-500">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
