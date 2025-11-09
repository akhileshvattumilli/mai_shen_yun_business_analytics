'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PredictiveAnalyticsProps {
  predictions: Record<string, number>;
}

export default function PredictiveAnalytics({ predictions }: PredictiveAnalyticsProps) {
  const predictionData = Object.entries(predictions)
    .map(([ingredient, predictedUsage]) => ({
      ingredient: ingredient.replace(/\([^)]*\)/g, '').trim(),
      predictedUsage: Math.round(predictedUsage),
    }))
    .sort((a, b) => b.predictedUsage - a.predictedUsage)
    .slice(0, 15);

  return (
    <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl shadow-xl">
      <h3 className="text-xl font-semibold mb-4 text-gray-100">Predicted Ingredient Usage for Next Month</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={predictionData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis 
            type="number" 
            stroke="#94a3b8"
            tick={{ fill: '#cbd5e1' }}
          />
          <YAxis 
            dataKey="ingredient" 
            type="category" 
            width={150}
            tick={{ fontSize: 12, fill: '#cbd5e1' }}
            stroke="#94a3b8"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#1e293b', 
              border: '1px solid #475569',
              borderRadius: '8px',
              color: '#cbd5e1'
            }}
          />
          <Legend wrapperStyle={{ color: '#cbd5e1' }} />
          <Bar dataKey="predictedUsage" fill="#f59e0b" />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-4 text-sm text-gray-400">
        * Predictions based on historical trend analysis and average usage patterns
      </p>
    </div>
  );
}

