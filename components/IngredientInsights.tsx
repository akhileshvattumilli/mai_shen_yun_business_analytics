'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { IngredientUsage } from '../lib/analytics';

interface IngredientInsightsProps {
  topIngredients: IngredientUsage[];
  leastUsedIngredients: IngredientUsage[];
}

export default function IngredientInsights({ topIngredients, leastUsedIngredients }: IngredientInsightsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl shadow-xl">
        <h3 className="text-xl font-semibold mb-4 text-gray-100">Top Used Ingredients</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topIngredients}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis 
              dataKey="ingredient" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              tick={{ fontSize: 12, fill: '#cbd5e1' }}
              stroke="#94a3b8"
            />
            <YAxis stroke="#94a3b8" tick={{ fill: '#cbd5e1' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#cbd5e1'
              }}
            />
            <Legend wrapperStyle={{ color: '#cbd5e1' }} />
            <Bar dataKey="totalUsage" fill="#ec4899" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl shadow-xl">
        <h3 className="text-xl font-semibold mb-4 text-gray-100">Least Used Ingredients</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={leastUsedIngredients}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis 
              dataKey="ingredient" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              tick={{ fontSize: 12, fill: '#cbd5e1' }}
              stroke="#94a3b8"
            />
            <YAxis stroke="#94a3b8" tick={{ fill: '#cbd5e1' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#cbd5e1'
              }}
            />
            <Legend wrapperStyle={{ color: '#cbd5e1' }} />
            <Bar dataKey="totalUsage" fill="#06b6d4" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

