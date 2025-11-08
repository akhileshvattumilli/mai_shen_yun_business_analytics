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
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Top Used Ingredients</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topIngredients}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="ingredient" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalUsage" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Least Used Ingredients</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={leastUsedIngredients}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="ingredient" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              tick={{ fontSize: 12 }}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalUsage" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

