'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MonthlyIngredientUsage } from '../lib/analytics';

interface MonthlyTrendsProps {
  monthlyUsage: MonthlyIngredientUsage[];
}

export default function MonthlyTrends({ monthlyUsage }: MonthlyTrendsProps) {
  const topIngredients = ['Rice(g)', 'Ramen (count)', 'braised beef used (g)', 'Egg(count)', 'Green Onion'];
  
  const chartData = monthlyUsage.map((monthData) => {
    const data: any = { month: monthData.month };
    topIngredients.forEach((ingredient) => {
      data[ingredient] = monthData.usage[ingredient] || 0;
    });
    return data;
  });

  const colors = ['#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981'];

  return (
    <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl shadow-xl">
      <h3 className="text-xl font-semibold mb-4 text-gray-100">Monthly Ingredient Usage Trends</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
          <XAxis 
            dataKey="month" 
            stroke="#94a3b8"
            tick={{ fill: '#cbd5e1' }}
          />
          <YAxis 
            stroke="#94a3b8"
            tick={{ fill: '#cbd5e1' }}
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
          {topIngredients.map((ingredient, index) => (
            <Line
              key={ingredient}
              type="monotone"
              dataKey={ingredient}
              stroke={colors[index % colors.length]}
              strokeWidth={3}
              dot={{ r: 4, fill: colors[index % colors.length] }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

