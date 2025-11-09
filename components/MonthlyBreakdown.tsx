'use client';

import { useState, useEffect } from 'react';
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

export default function MonthlyBreakdown({ selectedMonth, selectedSheet }: MonthlyBreakdownProps) {
  const [data, setData] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [sheetNames, setSheetNames] = useState<string[]>([]);

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

        // Sort by amount descending
        monthlyData.sort((a, b) => b.amount - a.amount);

        setData(monthlyData);
        setTotalEarnings(total);
        setTotalCount(count);
        setLoading(false);
      } catch (error) {
        console.error(`Error loading ${selectedMonth} data:`, error);
        setLoading(false);
      }
    }

    loadMonthData();
  }, [selectedMonth, selectedSheet]);

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

          {/* Data Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-700/50">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-slate-700/30">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-purple-300 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-pink-300 uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-cyan-300 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-yellow-300 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-800/30 divide-y divide-slate-700/50">
                {data.map((item, index) => {
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
        </>
      )}
    </div>
  );
}

