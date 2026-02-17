import React from 'react';
import { Check, Star } from 'lucide-react';
import type { PricingTier } from '../types';

interface PricingPreviewProps {
  tiers: PricingTier[];
}

export function PricingPreview({ tiers }: PricingPreviewProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Pricing</h3>
      <div className="space-y-3">
        {tiers.map((tier, i) => (
          <div
            key={i}
            className={`rounded-lg p-3 border ${
              tier.highlighted
                ? 'border-violet-300 bg-violet-50'
                : 'border-gray-100 bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm text-gray-900 flex items-center gap-1">
                {tier.highlighted && <Star className="w-3 h-3 text-violet-500" />}
                {tier.name}
              </span>
              <span className="font-bold text-gray-900">
                {tier.price === 0 ? 'Gratis' : `${(tier.price / 100).toFixed(0)} EUR`}
                {tier.price > 0 && tier.interval !== 'one-time' && (
                  <span className="text-xs font-normal text-gray-500">/{tier.interval === 'month' ? 'mese' : 'anno'}</span>
                )}
              </span>
            </div>
            <div className="space-y-0.5">
              {tier.features.slice(0, 4).map((f, j) => (
                <div key={j} className="flex items-center gap-1.5 text-xs text-gray-600">
                  <Check className="w-3 h-3 text-green-500" />
                  {f}
                </div>
              ))}
              {tier.features.length > 4 && (
                <p className="text-xs text-gray-400 ml-4">+{tier.features.length - 4} altre features</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
