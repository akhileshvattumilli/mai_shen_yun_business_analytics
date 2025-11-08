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

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Monthly Ingredient Usage Trends</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          {topIngredients.map((ingredient, index) => (
            <Line
              key={ingredient}
              type="monotone"
              dataKey={ingredient}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

