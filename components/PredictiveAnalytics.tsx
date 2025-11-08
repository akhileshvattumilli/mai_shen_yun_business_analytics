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
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Predicted Ingredient Usage for Next Month</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={predictionData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis 
            dataKey="ingredient" 
            type="category" 
            width={150}
            tick={{ fontSize: 12 }}
          />
          <Tooltip />
          <Legend />
          <Bar dataKey="predictedUsage" fill="#ff7300" />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-4 text-sm text-gray-600">
        * Predictions based on historical trend analysis and average usage patterns
      </p>
    </div>
  );
}

