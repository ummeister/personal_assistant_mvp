import React from 'react';
import { Calendar, Clock, Target, Lightbulb, Trophy } from 'lucide-react';
import type { DailyBriefing } from '../types';

interface DailyBriefingProps {
  briefing: DailyBriefing;
}

export function DailyBriefingView({ briefing }: DailyBriefingProps) {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
          <Calendar className="w-6 h-6 text-indigo-600" />
          Daily Briefing
        </h1>
        <div className="text-gray-500">{new Date(briefing.date).toLocaleDateString()}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-indigo-600" />
            Today's Goals
          </h2>
          <ul className="space-y-3">
            {briefing.goals.map((goal, index) => (
              <li key={index} className="flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div>
                <span className="text-gray-700">{goal}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-600" />
            Schedule
          </h2>
          <div className="space-y-4">
            {briefing.schedule.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <div className="text-sm font-medium text-gray-500 w-20">{item.time}</div>
                <div className="flex-1">
                  <div className="text-gray-700">{item.task}</div>
                  <div className={`text-sm ${
                    item.priority === 'high' ? 'text-red-500' :
                    item.priority === 'medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`}>
                    {item.priority} priority
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2 mb-4">
            <Lightbulb className="w-5 h-5 text-indigo-600" />
            Insights
          </h2>
          <ul className="space-y-3">
            {briefing.insights.map((insight, index) => (
              <li key={index} className="text-gray-700">{insight}</li>
            ))}
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-indigo-600" />
            Daily Motivation
          </h2>
          <p className="text-gray-700 italic">{briefing.motivation}</p>
        </div>
      </div>
    </div>
  );
}