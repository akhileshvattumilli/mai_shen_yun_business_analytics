'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MonthlyEarnings, MonthlyCategoryEarnings } from '../lib/data-loader';
import MonthlyBreakdown from './MonthlyBreakdown';

interface DashboardOverviewProps {
  monthlyEarnings: MonthlyEarnings[];
  monthlyCategoryEarnings: MonthlyCategoryEarnings[];
  monthlyCategoryEarningsSheet2: MonthlyCategoryEarnings[];
}

export default function DashboardOverview({ monthlyEarnings, monthlyCategoryEarnings, monthlyCategoryEarningsSheet2 }: DashboardOverviewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedSheet, setSelectedSheet] = useState<number>(0);
  const [breakdownView, setBreakdownView] = useState<'overall' | 'byCategory'>('overall');
  const latestMonth = monthlyEarnings[monthlyEarnings.length - 1];
  const latestEarnings = latestMonth?.totalEarnings || 0;
  const latestCount = latestMonth?.transactionCount || 0;
  
  // Calculate yearly earnings and monthly average
  const yearlyEarnings = monthlyEarnings.reduce((sum, month) => sum + month.totalEarnings, 0);
  const monthlyAverageEarnings = monthlyEarnings.length > 0 ? yearlyEarnings / monthlyEarnings.length : 0;

  const chartData = monthlyEarnings.map((data) => ({
    month: data.month,
    earnings: data.totalEarnings,
    transactions: data.transactionCount,
  }));

  // Calculate growth percentage
  const previousMonth = monthlyEarnings[monthlyEarnings.length - 2];
  const growthPercentage = previousMonth
    ? ((latestEarnings - previousMonth.totalEarnings) / previousMonth.totalEarnings) * 100
    : 0;

  const availableMonths = monthlyEarnings.map((data) => data.month);

  // Get top 6 categories and combine the rest into "Other"
  // "Other" should always be at the top of the stack (rendered last)
  const { topCategories, otherCategories } = useMemo(() => {
    const dataSource = breakdownView === 'overall' ? monthlyCategoryEarnings : monthlyCategoryEarningsSheet2;
    
    // Calculate total earnings for each category across all months
    const categoryTotals: Record<string, number> = {};
    
    dataSource.forEach((monthData) => {
      Object.keys(monthData.categories).forEach((category) => {
        const amount = monthData.categories[category] || 0;
        if (!categoryTotals[category]) {
          categoryTotals[category] = 0;
        }
        categoryTotals[category] += amount;
      });
    });
    
    // Sort all categories by total earnings in DESCENDING order
    const sortedCategories = Object.keys(categoryTotals).sort((a, b) => {
      return categoryTotals[b] - categoryTotals[a];
    });
    
    // Take top 6 categories (these will be rendered at the bottom, largest first)
    const top6 = sortedCategories.slice(0, 6);
    // Remaining categories go into "Other" (will be rendered at the top)
    const others = sortedCategories.slice(6);
    
    return {
      topCategories: top6,
      otherCategories: others,
    };
  }, [monthlyCategoryEarnings, monthlyCategoryEarningsSheet2, breakdownView]);

  // Prepare stacked bar chart data with top 6 categories + "Other"
  // "Other" is always last so it renders on top of the stack
  const stackedBarData = useMemo(() => {
    const dataSource = breakdownView === 'overall' ? monthlyCategoryEarnings : monthlyCategoryEarningsSheet2;
    
    return dataSource.map((monthData) => {
      const data: any = { month: monthData.month };
      
      // Add top 6 categories (largest at bottom when rendered)
      topCategories.forEach((category) => {
        data[category] = monthData.categories[category] || 0;
      });
      
      // Calculate "Other" by summing all remaining categories
      let otherTotal = 0;
      otherCategories.forEach((category) => {
        otherTotal += monthData.categories[category] || 0;
      });
      data['Other'] = otherTotal;
      
      return data;
    });
  }, [monthlyCategoryEarnings, monthlyCategoryEarningsSheet2, breakdownView, topCategories, otherCategories]);

  // Pastel colors for categories
  const categoryColors = [
    '#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444',
    '#a855f7', '#14b8a6', '#f97316', '#84cc16', '#3b82f6', '#e11d48'
  ];

  return (
    <div className="space-y-6">
      {/* Latest Month Earnings Card and Monthly Earnings Progression Chart - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Latest Month Earnings Card */}
        <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 backdrop-blur-lg border border-pink-400/30 rounded-xl p-6 shadow-2xl">
          <div className="flex flex-col justify-between h-full">
            <div>
              <p className="text-pink-200 text-sm font-medium mb-2">
                {latestMonth?.month} Total Earnings
              </p>
              <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
                ${latestEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-purple-200 text-sm mb-2">
                {latestCount.toLocaleString()} transactions
              </p>
              {growthPercentage !== 0 && (
                <div className="mb-4">
                  <div className={`text-sm font-semibold ${growthPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {growthPercentage >= 0 ? '↑' : '↓'} {Math.abs(growthPercentage).toFixed(1)}% vs previous month
                  </div>
                </div>
              )}
              
              {/* Yearly Earnings */}
              <div className="mt-4 pt-4 border-t border-pink-400/20">
                <p className="text-pink-200 text-xs font-medium mb-1">
                  Yearly Total Earnings
                </p>
                <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  ${yearlyEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              
              {/* Monthly Average Earnings */}
              <div className="mt-3 pt-3 border-t border-pink-400/20">
                <p className="text-pink-200 text-xs font-medium mb-1">
                  Monthly Average Earnings
                </p>
                <p className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  ${monthlyAverageEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Earnings Progression Chart */}
        <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl shadow-xl">
          <h3 className="text-lg font-semibold mb-4 text-gray-100">Monthly Earnings Progression</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis 
                dataKey="month" 
                stroke="#94a3b8"
                tick={{ fill: '#cbd5e1', fontSize: 13 }}
                height={60}
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                stroke="#94a3b8"
                tick={{ fill: '#cbd5e1', fontSize: 13 }}
                width={60}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#cbd5e1'
                }}
                formatter={(value: number) => `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              />
              <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: '13px', paddingTop: '10px' }} />
              <Line 
                type="monotone" 
                dataKey="earnings" 
                stroke="#ec4899" 
                strokeWidth={3}
                name="Earnings"
                dot={{ r: 6, fill: '#ec4899' }}
                activeDot={{ r: 8, fill: '#f472b6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Earnings by Category - Stacked Bar Chart */}
      <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-100">Monthly Earnings Breakdown by Category</h3>
          <select
            value={breakdownView}
            onChange={(e) => setBreakdownView(e.target.value as 'overall' | 'byCategory')}
            className="px-4 py-2 bg-slate-700/50 border border-slate-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none text-sm"
          >
            <option value="overall" className="bg-slate-800">Overall</option>
            <option value="byCategory" className="bg-slate-800">By Category</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={stackedBarData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis 
              dataKey="month" 
              stroke="#94a3b8"
              tick={{ fill: '#cbd5e1' }}
            />
            <YAxis 
              tickFormatter={(value) => `$${value.toLocaleString()}`}
              stroke="#94a3b8"
              tick={{ fill: '#cbd5e1' }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (!active || !payload || payload.length === 0) {
                  return null;
                }

                // Create ordered list: top to bottom (top of stack first)
                const orderedPayload: any[] = [];
                
                // Add "Other" first (it's at the top of the stack)
                if (otherCategories.length > 0) {
                  const otherItem = payload.find((p) => p.dataKey === 'Other');
                  if (otherItem && otherItem.value && (otherItem.value as number) > 0) {
                    orderedPayload.push(otherItem);
                  }
                }
                
                // Add top categories in reverse order (smallest to largest - top to bottom of stack)
                // Reverse the array to go from smallest (near top) to largest (bottom)
                [...topCategories].reverse().forEach((category) => {
                  const item = payload.find((p) => p.dataKey === category);
                  if (item && item.value && (item.value as number) > 0) {
                    orderedPayload.push(item);
                  }
                });

                if (orderedPayload.length === 0) {
                  return null;
                }

                return (
                  <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
                    <p className="font-semibold text-gray-200 mb-2 border-b border-slate-600 pb-1">
                      {payload[0].payload.month}
                    </p>
                    <div className="space-y-1">
                      {orderedPayload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded"
                              style={{ backgroundColor: entry.color }}
                            />
                            <span className="text-sm text-gray-300">{entry.name}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-200">
                            ${(entry.value as number).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
            />
            <Legend wrapperStyle={{ color: '#cbd5e1' }} />
            {/* Render top 6 categories first (largest at bottom) */}
            {topCategories.map((category, index) => (
              <Bar
                key={category}
                dataKey={category}
                stackId="a"
                fill={categoryColors[index % categoryColors.length]}
                name={category}
              />
            ))}
            {/* Render "Other" last so it always appears on top of the stack */}
            {otherCategories.length > 0 && (
              <Bar
                key="Other"
                dataKey="Other"
                stackId="a"
                fill="#64748b"
                name="Other"
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Breakdown Section */}
      <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl shadow-xl">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
          <h3 className="text-xl font-semibold text-gray-100">Monthly Breakdown Analysis</h3>
          <div className="flex gap-4">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setSelectedSheet(0); // Reset to first sheet when month changes
              }}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
            >
              <option value="" className="bg-slate-800">Select a month...</option>
              {availableMonths.map((month) => (
                <option key={month} value={month} className="bg-slate-800">
                  {month}
                </option>
              ))}
            </select>
            {selectedMonth && (
              <select
                value={selectedSheet}
                onChange={(e) => setSelectedSheet(parseInt(e.target.value))}
                className="px-4 py-2 bg-slate-700/50 border border-slate-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
              >
                <option value={0} className="bg-slate-800">Overall</option>
                <option value={1} className="bg-slate-800">By Category</option>
                <option value={2} className="bg-slate-800">By Item</option>
              </select>
            )}
          </div>
        </div>
        {selectedMonth && (
          <MonthlyBreakdown selectedMonth={selectedMonth} selectedSheet={selectedSheet} />
        )}
        {!selectedMonth && (
          <p className="text-gray-400 text-center py-8">
            Select a month from the dropdown above to view detailed breakdown
          </p>
        )}
      </div>
    </div>
  );
}

