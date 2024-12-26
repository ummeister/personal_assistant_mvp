import React, { useState } from 'react';
import { ChevronRight, UserCircle } from 'lucide-react';
import type { OnboardingQuestion, UserProfile } from '../types';

const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: 'name',
    question: 'What is your name?',
    type: 'text',
    required: true,
  },
  {
    id: 'occupation',
    question: 'What is your current occupation?',
    type: 'text',
    required: true,
  },
  {
    id: 'goals',
    question: 'What are your primary goals for using this assistant?',
    type: 'multiselect',
    options: [
      'Career Development',
      'Personal Growth',
      'Time Management',
      'Financial Planning',
      'Relationship Guidance',
      'Emotional Well-being',
      'Learning & Education'
    ],
    required: true,
  },
  {
    id: 'schedule',
    question: 'What are your typical working hours?',
    type: 'text',
    required: true,
  },
  {
    id: 'challenges',
    question: 'What are your biggest daily challenges?',
    type: 'multiline',
    required: true,
  },
];

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

const initialAnswers: Record<string, any> = {
  name: '',
  occupation: '',
  goals: [],
  schedule: '',
  challenges: '',
};

export function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(initialAnswers);

  const handleAnswer = (id: string, value: any) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const handleNext = () => {
    const currentQuestion = onboardingQuestions[currentStep];
    
    // Validate current answer
    if (currentQuestion.required) {
      const currentAnswer = answers[currentQuestion.id];
      if (!currentAnswer || (Array.isArray(currentAnswer) && currentAnswer.length === 0)) {
        return; // Don't proceed if required field is empty
      }
    }

    if (currentStep < onboardingQuestions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Create user profile from answers
      const profile: UserProfile = {
        id: crypto.randomUUID(),
        name: answers.name,
        email: '', // This would be set during authentication
        occupation: answers.occupation,
        goals: Array.isArray(answers.goals) ? answers.goals : [],
        preferences: {
          workHours: answers.schedule,
          wakeUpTime: '', // This could be asked in additional questions
          communicationStyle: 'direct', // This could be determined through additional questions
        },
        documents: [], // This would be populated as the user uploads documents
      };
      
      onComplete(profile);
    }
  };

  const currentQuestion = onboardingQuestions[currentStep];
  const currentAnswer = answers[currentQuestion.id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-8">
          <UserCircle className="w-8 h-8 text-indigo-600" />
          <h1 className="text-2xl font-semibold text-gray-800">Let's get to know you</h1>
        </div>

        <div className="space-y-6">
          <div className="text-sm text-gray-500">
            Step {currentStep + 1} of {onboardingQuestions.length}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-medium text-gray-700">
              {currentQuestion.question}
            </h2>

            {currentQuestion.type === 'text' && (
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={currentAnswer || ''}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              />
            )}

            {currentQuestion.type === 'multiline' && (
              <textarea
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-32"
                value={currentAnswer || ''}
                onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)}
              />
            )}

            {currentQuestion.type === 'multiselect' && (
              <div className="space-y-2">
                {currentQuestion.options?.map((option) => (
                  <label key={option} className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="form-checkbox h-5 w-5 text-indigo-600"
                      checked={Array.isArray(currentAnswer) && currentAnswer.includes(option)}
                      onChange={(e) => {
                        const current = Array.isArray(currentAnswer) ? currentAnswer : [];
                        if (e.target.checked) {
                          handleAnswer(currentQuestion.id, [...current, option]);
                        } else {
                          handleAnswer(
                            currentQuestion.id,
                            current.filter((item: string) => item !== option)
                          );
                        }
                      }}
                    />
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleNext}
            disabled={currentQuestion.required && !currentAnswer}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 text-white py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{currentStep === onboardingQuestions.length - 1 ? 'Complete' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}