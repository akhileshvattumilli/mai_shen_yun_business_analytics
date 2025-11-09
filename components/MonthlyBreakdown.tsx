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
  const [loading, setLoading] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [sortColumn, setSortColumn] = useState<SortColumn>('amount');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    if (!selectedMonth) {
      setData([]);
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

        setData(monthlyData);
        setTotalEarnings(total);
        setTotalCount(count);
        // Reset sort to default (amount descending) when data changes
        setSortColumn('amount');
        setSortDirection('desc');
        setLoading(false);
      } catch (error) {
        console.error(`Error loading ${selectedMonth} data:`, error);
        setLoading(false);
      }
    }

    loadMonthData();
  }, [selectedMonth, selectedSheet]);

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

  if (!selectedMonth) {
    return null;
  }

  return (
    <div>
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400"></div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

