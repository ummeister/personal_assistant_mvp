import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <AlertTriangle className="w-8 h-8 text-red-600" />
      <p className="mt-4 text-gray-600">{error.message}</p>
      <button
        onClick={onRetry}
        className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Try Again
      </button>
    </div>
  );
}