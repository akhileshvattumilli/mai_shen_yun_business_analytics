'use client';

import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';

interface MonthlyData {
  category: string;
  count: number;
  amount: number;
}

interface MonthlyBreakdownProps {
  selectedMonth: string;
  selectedSheet: number;
}

type SortColumn = 'count' | 'amount' | 'percentage' | null;
type SortDirection = 'asc' | 'desc';

export default function MonthlyBreakdown({ selectedMonth, selectedSheet }: MonthlyBreakdownProps) {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [itemData, setItemData] = useState<MonthlyData[]>([]); // Always contains item-level data
  const [loading, setLoading] = useState(true); // Start with true for initial load
  const [initialLoad, setInitialLoad] = useState(true);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>('amount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    if (!selectedMonth) {
      setData([]);
      setLoading(false);
      return;
    }

    async function loadMonthData() {
      setLoading(true);
      try {
        const monthFiles: Record<string, string> = {
          'May': 'May_Data_Matrix (1).xlsx',
          'June': 'June_Data_Matrix.xlsx',
          'July': 'July_Data_Matrix (1).xlsx',
          'August': 'August_Data_Matrix (1).xlsx',
          'September': 'September_Data_Matrix.xlsx',
          'October': 'October_Data_Matrix_20251103_214000.xlsx',
        };

        const file = monthFiles[selectedMonth];
        if (!file) {
          setData([]);
          setTotalEarnings(0);
          setTotalCount(0);
          setLoading(false);
          return;
        }

        const response = await fetch(`/data/${file}`);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Store sheet names
        setSheetNames(workbook.SheetNames);
        
        // Get the selected sheet (default to first sheet if index is out of bounds)
        const sheetIndex = selectedSheet >= 0 && selectedSheet < workbook.SheetNames.length 
          ? selectedSheet 
          : 0;
        const sheetName = workbook.SheetNames[sheetIndex];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const monthlyData: MonthlyData[] = [];
        let total = 0;
        let count = 0;

        jsonData.forEach((row: any) => {
          // Try different column name variations
          const category = row.Category || row.Group || row.Item || row['Item Name'] || row.Name || 'Unknown';
          const countStr = (row.Count || row.Quantity || '0').toString().replace(/,/g, '');
          const amountStr = (row.Amount || row.Price || row['Total Amount'] || '$0')
            .toString()
            .replace(/[$,]/g, '');

          const amount = parseFloat(amountStr) || 0;
          const itemCount = parseInt(countStr) || 0;

          if (category && category !== 'Unknown' && (amount > 0 || itemCount > 0)) {
            monthlyData.push({
              category,
              count: itemCount,
              amount,
            });
            total += amount;
            count += itemCount;
          }
        });

        // Update all state at once to avoid flickering
        setData(monthlyData);
        setTotalEarnings(total);
        setTotalCount(count);
        // Reset sort to default (amount descending) when data changes
        setSortColumn('amount');
        setSortDirection('desc');
        setLoading(false);
        setInitialLoad(false); // Mark initial load as complete
      } catch (error) {
        console.error(`Error loading ${selectedMonth} data:`, error);
        setLoading(false);
        setInitialLoad(false); // Mark initial load as complete even on error
      }
    }

    loadMonthData();
  }, [selectedMonth, selectedSheet]);

  // Always load item data (sheet index 2) for insights, regardless of dropdown selection
  useEffect(() => {
    if (!selectedMonth) {
      setItemData([]);
      return;
    }

    async function loadItemData() {
      try {
        const monthFiles: Record<string, string> = {
          'May': 'May_Data_Matrix (1).xlsx',
          'June': 'June_Data_Matrix.xlsx',
          'July': 'July_Data_Matrix (1).xlsx',
          'August': 'August_Data_Matrix (1).xlsx',
          'September': 'September_Data_Matrix.xlsx',
          'October': 'October_Data_Matrix_20251103_214000.xlsx',
        };

        const file = monthFiles[selectedMonth];
        if (!file) {
          setItemData([]);
          return;
        }

        const response = await fetch(`/data/${file}`);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Always use sheet index 2 (By Item) for insights
        const itemSheetIndex = workbook.SheetNames.length > 2 ? 2 : (workbook.SheetNames.length > 1 ? 1 : 0);
        const itemSheetName = workbook.SheetNames[itemSheetIndex];
        const itemWorksheet = workbook.Sheets[itemSheetName];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(itemWorksheet);
        
        const items: MonthlyData[] = [];

        jsonData.forEach((row: any) => {
          // Try different column name variations
          const category = row.Category || row.Group || row.Item || row['Item Name'] || row.Name || 'Unknown';
          const countStr = (row.Count || row.Quantity || '0').toString().replace(/,/g, '');
          const amountStr = (row.Amount || row.Price || row['Total Amount'] || '$0')
            .toString()
            .replace(/[$,]/g, '');

          const amount = parseFloat(amountStr) || 0;
          const itemCount = parseInt(countStr) || 0;

          if (category && category !== 'Unknown' && (amount > 0 || itemCount > 0)) {
            items.push({
              category,
              count: itemCount,
              amount,
            });
          }
        });

        setItemData(items);
      } catch (error) {
        console.error(`Error loading item data for ${selectedMonth}:`, error);
        setItemData([]);
      }
    }

    loadItemData();
  }, [selectedMonth]);

  // Sort data based on selected column and direction
  const sortedData = useMemo(() => {
    if (!sortColumn) return data;

    const sorted = [...data].sort((a, b) => {
      let aValue: number;
      let bValue: number;

      if (sortColumn === 'count') {
        aValue = a.count;
        bValue = b.count;
      } else if (sortColumn === 'amount') {
        aValue = a.amount;
        bValue = b.amount;
      } else if (sortColumn === 'percentage') {
        aValue = totalEarnings > 0 ? (a.amount / totalEarnings) * 100 : 0;
        bValue = totalEarnings > 0 ? (b.amount / totalEarnings) * 100 : 0;
      } else {
        return 0;
      }

      if (sortDirection === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return sorted;
  }, [data, sortColumn, sortDirection, totalEarnings]);

  // Handle column header click
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  // Get sort arrow icon
  const getSortArrow = (column: SortColumn) => {
    if (sortColumn !== column) {
      // Neutral up/down arrow for unsorted columns
      return (
        <span className="ml-1 text-gray-500 opacity-50">
          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </span>
      );
    }
    if (sortDirection === 'asc') {
      // Up arrow for ascending
      return (
        <span className="ml-1 text-gray-300">
          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </span>
      );
    } else {
      // Down arrow for descending
      return (
        <span className="ml-1 text-gray-300">
          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      );
    }
  };

  // Calculate most popular, most profitable, and least popular items (always from item data)
  const itemInsights = useMemo(() => {
    if (itemData.length === 0) {
      return {
        mostPopular: [],
        mostProfitable: [],
        leastPopular: [],
        itemTotalEarnings: 0,
      };
    }

    // Calculate total earnings from item data for accurate percentages
    const itemTotalEarnings = itemData.reduce((sum, item) => sum + item.amount, 0);

    // Most popular (highest count) - exclude water
    const mostPopular = [...itemData]
      .filter((item) => !item.category.toLowerCase().includes('water'))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Most profitable (highest amount)
    const mostProfitable = [...itemData]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Least popular (lowest count, but only items with count > 0)
    const leastPopular = [...itemData]
      .filter((item) => item.count > 0)
      .sort((a, b) => a.count - b.count)
      .slice(0, 5);

    return {
      mostPopular,
      mostProfitable,
      leastPopular,
      itemTotalEarnings,
    };
  }, [itemData]);

  if (!selectedMonth) {
    return null;
  }

  // Show loading spinner only on initial load when there's no data
  if (initialLoad && loading && data.length === 0) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
          <p className="text-sm text-gray-300">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading overlay - shows on top of content when updating (not initial load) */}
      {loading && !initialLoad && (
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
            <p className="text-sm text-gray-300">Loading data...</p>
          </div>
        </div>
      )}
      
      {/* Content - always visible, just dimmed when loading (only after initial load) */}
      <div className={loading && !initialLoad ? 'opacity-60 pointer-events-none' : ''}>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-lg border border-pink-400/30 p-4 rounded-xl">
              <p className="text-pink-300 text-sm font-medium mb-1">Total Earnings</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                ${totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-lg border border-cyan-400/30 p-4 rounded-xl">
              <p className="text-cyan-300 text-sm font-medium mb-1">Total Transactions</p>
              <p className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {totalCount.toLocaleString()}
              </p>
            </div>
          </div>

          {/* Item Insights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Most Popular Items */}
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-4 rounded-xl">
              <h4 className="text-lg font-semibold text-pink-300 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Most Popular
              </h4>
              <div className="space-y-2">
                {itemInsights.mostPopular.length > 0 ? (
                  itemInsights.mostPopular.map((item, index) => {
                    const percentage = itemInsights.itemTotalEarnings > 0 ? (item.amount / itemInsights.itemTotalEarnings) * 100 : 0;
                    return (
                      <div key={index} className="bg-slate-700/30 p-2 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-200 truncate flex-1">{item.category}</span>
                          <span className="text-xs text-pink-300 ml-2">{item.count}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({percentage.toFixed(1)}%)
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-400">No data available</p>
                )}
              </div>
            </div>

            {/* Most Profitable Items */}
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-4 rounded-xl">
              <h4 className="text-lg font-semibold text-cyan-300 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Most Profitable
              </h4>
              <div className="space-y-2">
                {itemInsights.mostProfitable.length > 0 ? (
                  itemInsights.mostProfitable.map((item, index) => {
                    const percentage = itemInsights.itemTotalEarnings > 0 ? (item.amount / itemInsights.itemTotalEarnings) * 100 : 0;
                    return (
                      <div key={index} className="bg-slate-700/30 p-2 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-200 truncate flex-1">{item.category}</span>
                          <span className="text-xs text-cyan-300 ml-2">
                            ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {item.count} sold ({percentage.toFixed(1)}%)
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-400">No data available</p>
                )}
              </div>
            </div>

            {/* Least Popular Items */}
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-4 rounded-xl">
              <h4 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                </svg>
                Least Popular
              </h4>
              <div className="space-y-2">
                {itemInsights.leastPopular.length > 0 ? (
                  itemInsights.leastPopular.map((item, index) => {
                    const percentage = itemInsights.itemTotalEarnings > 0 ? (item.amount / itemInsights.itemTotalEarnings) * 100 : 0;
                    return (
                      <div key={index} className="bg-slate-700/30 p-2 rounded-lg">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-200 truncate flex-1">{item.category}</span>
                          <span className="text-xs text-yellow-300 ml-2">{item.count}</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({percentage.toFixed(1)}%)
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-400">No data available</p>
                )}
              </div>
            </div>
          </div>

          {/* Data Table - Scrollable with max 10 visible rows */}
          <div className="rounded-xl border border-slate-700/50 overflow-hidden">
            <div className="overflow-x-auto">
              <div className="max-h-[440px] overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-700/50">
                  <thead className="bg-slate-800 sticky top-0 z-10 shadow-lg">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider bg-slate-800">
                        Category
                      </th>
                      <th 
                        className="px-6 py-3 text-right text-xs font-medium text-pink-300 uppercase tracking-wider bg-slate-800 cursor-pointer hover:bg-slate-700 transition-colors select-none"
                        onClick={() => handleSort('count')}
                      >
                        <div className="flex items-center justify-end">
                          Count
                          {getSortArrow('count')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-right text-xs font-medium text-cyan-300 uppercase tracking-wider bg-slate-800 cursor-pointer hover:bg-slate-700 transition-colors select-none"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center justify-end">
                          Amount
                          {getSortArrow('amount')}
                        </div>
                      </th>
                      <th 
                        className="px-6 py-3 text-right text-xs font-medium text-yellow-300 uppercase tracking-wider bg-slate-800 cursor-pointer hover:bg-slate-700 transition-colors select-none"
                        onClick={() => handleSort('percentage')}
                      >
                        <div className="flex items-center justify-end">
                          Percentage
                          {getSortArrow('percentage')}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-800/30 divide-y divide-slate-700/50">
                    {sortedData.map((item, index) => {
                      const percentage = totalEarnings > 0 ? (item.amount / totalEarnings) * 100 : 0;
                      return (
                        <tr key={index} className="hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">
                            {item.category}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-pink-300 text-right">
                            {item.count.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-300 text-right font-medium">
                            ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-300 text-right">
                            {percentage.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}

