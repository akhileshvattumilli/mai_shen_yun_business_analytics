'use client';

import { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { MonthlyEarnings, MonthlyCategoryEarnings } from '../lib/data-loader';
import MonthlyBreakdown from './MonthlyBreakdown';
import * as XLSX from 'xlsx';

interface DashboardOverviewProps {
  monthlyEarnings: MonthlyEarnings[];
  monthlyCategoryEarnings: MonthlyCategoryEarnings[];
  monthlyCategoryEarningsSheet2: MonthlyCategoryEarnings[];
}

interface ItemSalesData {
  itemName: string;
  count: number;
  amount: number;
  month: string;
}

export default function DashboardOverview({ monthlyEarnings, monthlyCategoryEarnings, monthlyCategoryEarningsSheet2 }: DashboardOverviewProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('October');
  const [selectedSheet, setSelectedSheet] = useState<number>(0);
  const [breakdownView, setBreakdownView] = useState<'overall' | 'byCategory'>('overall');
  const [itemSalesData, setItemSalesData] = useState<ItemSalesData[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
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

  const availableMonths = useMemo(() => monthlyEarnings.map((data) => data.month), [monthlyEarnings]);

  // Load item-level sales data for current month and last 3 months
  useEffect(() => {
    async function loadItemSalesData() {
      if (availableMonths.length === 0) return;
      
      setLoadingItems(true);
      const monthFiles: Record<string, string> = {
        'May': 'May_Data_Matrix (1).xlsx',
        'June': 'June_Data_Matrix.xlsx',
        'July': 'July_Data_Matrix (1).xlsx',
        'August': 'August_Data_Matrix (1).xlsx',
        'September': 'September_Data_Matrix.xlsx',
        'October': 'October_Data_Matrix_20251103_214000.xlsx',
      };

      const allItemData: ItemSalesData[] = [];
      const monthsToLoad = availableMonths.slice(-3); // Last 3 months

      for (const month of monthsToLoad) {
        try {
          const file = monthFiles[month];
          if (!file) continue;

          const response = await fetch(`/data/${file}`);
          const arrayBuffer = await response.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          
          // Get sheet index 2 (By Item) if available
          const sheetIndex = workbook.SheetNames.length > 2 ? 2 : (workbook.SheetNames.length > 1 ? 1 : 0);
          const sheetName = workbook.SheetNames[sheetIndex];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          jsonData.forEach((row: any) => {
            const itemName = row.Item || row['Item Name'] || row.Category || row.Name || '';
            const countStr = (row.Count || row.Quantity || '0').toString().replace(/,/g, '');
            const amountStr = (row.Amount || row.Price || row['Total Amount'] || '$0')
              .toString()
              .replace(/[$,]/g, '');
            
            const count = parseInt(countStr) || 0;
            const amount = parseFloat(amountStr) || 0;
            
            if (itemName && itemName !== 'Unknown' && (count > 0 || amount > 0)) {
              allItemData.push({
                itemName,
                count,
                amount,
                month,
              });
            }
          });
        } catch (error) {
          console.error(`Error loading ${month} item data:`, error);
        }
      }

      setItemSalesData(allItemData);
      setLoadingItems(false);
    }

    try {
      loadItemSalesData();
    } catch (error) {
      console.error('Error in loadItemSalesData:', error);
      setLoadingItems(false);
    }
  }, [availableMonths]);

  // Calculate quick insights
  const quickInsights = useMemo(() => {
    if (itemSalesData.length === 0 || availableMonths.length === 0) {
      return {
        bestSellers: [],
        considerReplacing: [],
      };
    }

    try {
      // Get current month (latest month)
      const currentMonth = availableMonths[availableMonths.length - 1];
      if (!currentMonth) {
        return {
          bestSellers: [],
          considerReplacing: [],
        };
      }

      const currentMonthItems = itemSalesData.filter(item => 
        item.month === currentMonth && !item.itemName.toLowerCase().includes('water')
      );
      
      // Best sellers: top 3 by count in current month (excluding water)
      const bestSellers = [...currentMonthItems]
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
        .map(item => item.itemName);

      // Items to consider replacing: aggregate last 3 months, filter out water, sort by lowest count
      const last3Months = availableMonths.slice(-3);
      const last3MonthsItems = itemSalesData.filter(item => 
        last3Months.includes(item.month)
      );
      
      const itemTotals: Record<string, number> = {};
      last3MonthsItems.forEach(item => {
        if (item.itemName && !item.itemName.toLowerCase().includes('water')) {
          itemTotals[item.itemName] = (itemTotals[item.itemName] || 0) + item.count;
        }
      });

      // Get items with 1 order or less, but exclude items that appear in best sellers
      const considerReplacing = Object.entries(itemTotals)
        .filter(([itemName, count]) => !bestSellers.includes(itemName) && count <= 1)
        .sort((a, b) => a[1] - b[1]) // Sort by count ascending (lowest first)
        .map(([itemName, count]) => ({ itemName, count }));

      return {
        bestSellers,
        considerReplacing,
      };
    } catch (error) {
      console.error('Error calculating quick insights:', error);
      return {
        bestSellers: [],
        considerReplacing: [],
      };
    }
  }, [itemSalesData, availableMonths]);

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
        <div className="bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-cyan-500/20 backdrop-blur-lg border border-pink-400/30 rounded-xl p-4 shadow-2xl">
          <div className="flex flex-col justify-between h-full">
            <div>
              <p className="text-pink-200 text-xs font-medium mb-1">
                {latestMonth?.month} Total Earnings
              </p>
              <h2 className="text-2xl font-bold mb-1 bg-gradient-to-r from-pink-400 to-cyan-400 bg-clip-text text-transparent">
                ${latestEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
              <p className="text-purple-200 text-xs mb-1">
                {latestCount.toLocaleString()} transactions
              </p>
              {growthPercentage !== 0 && (
                <div className="mb-2">
                  <div className={`text-xs font-semibold ${growthPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {growthPercentage >= 0 ? '↑' : '↓'} {Math.abs(growthPercentage).toFixed(1)}% vs previous month
                  </div>
                </div>
              )}
              
              {/* Yearly Earnings */}
              <div className="mt-2 pt-2 border-t border-pink-400/20">
                <p className="text-pink-200 text-xs font-medium mb-0.5">
                  Yearly Total Earnings
                </p>
                <p className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  ${yearlyEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
              
              {/* Monthly Average Earnings */}
              <div className="mt-2 pt-2 border-t border-pink-400/20">
                <p className="text-pink-200 text-xs font-medium mb-0.5">
                  Monthly Average Earnings
                </p>
                <p className="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  ${monthlyAverageEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Earnings Progression Chart */}
        <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-4 rounded-xl shadow-xl">
          <h3 className="text-base font-semibold mb-3 text-gray-100">Monthly Earnings Progression</h3>
          <ResponsiveContainer width="100%" height={250}>
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

      {/* Quick Insights Section */}
      <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl shadow-xl">
        <h3 className="text-xl font-semibold text-gray-100 mb-4">Quick Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* This Month's Best Sellers */}
          <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 p-4 rounded-xl">
            <h4 className="text-lg font-semibold text-pink-300 mb-3">This Month's Best Sellers</h4>
            {loadingItems ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-pink-400"></div>
              </div>
            ) : quickInsights.bestSellers.length > 0 ? (
              <div className="space-y-2">
                {quickInsights.bestSellers.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-slate-700/30 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-200 flex-1">{item}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No data available</p>
            )}
          </div>

          {/* Consider Replacing */}
          <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 p-4 rounded-xl">
            <h4 className="text-lg font-semibold text-yellow-300 mb-1">Consider Replacing</h4>
            <p className="text-xs text-gray-400 mb-3">Based on last 3 months of sales</p>
            {loadingItems ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400"></div>
              </div>
            ) : quickInsights.considerReplacing.length > 0 ? (
              <div className="max-h-[140px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {quickInsights.considerReplacing.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-lg min-h-[40px]">
                    <span className="text-sm font-medium text-gray-200 flex-1 truncate">{item.itemName}</span>
                    <span className="text-xs text-yellow-300 ml-2 whitespace-nowrap">{item.count} orders</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No items to suggest</p>
            )}
          </div>
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

