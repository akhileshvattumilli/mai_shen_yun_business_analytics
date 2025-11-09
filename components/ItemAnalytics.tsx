'use client';

import { useState, useEffect, useMemo } from 'react';
import { MenuItem } from '../lib/data-loader';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const availableMonths = ['May', 'June', 'July', 'August', 'September', 'October'];
const COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#14b8a6', '#f97316', '#84cc16'];

interface ItemSalesData {
  month: string;
  count: number;
  amount: number;
}

export default function ItemAnalytics() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [allMonthlyData, setAllMonthlyData] = useState<Record<string, Record<string, { count: number; amount: number }>>>({});
  const [loading, setLoading] = useState(false);
  const [comparisonItems, setComparisonItems] = useState<string[]>([]);
  const [comparisonDropdownOpen, setComparisonDropdownOpen] = useState(false);

  // Load menu items on mount
  useEffect(() => {
    async function loadMenuItems() {
      try {
        const response = await fetch('/data/MSY Data - Ingredient.csv');
        const text = await response.text();
        Papa.parse(text, {
          header: true,
          complete: (results) => {
            const items: MenuItem[] = results.data
              .filter((row: any) => row['Item name'])
              .map((row: any) => {
                const ingredients: Record<string, number> = {};
                Object.keys(row).forEach((key) => {
                  if (key !== 'Item name' && row[key]) {
                    ingredients[key] = parseFloat(row[key]) || 0;
                  }
                });
                return {
                  itemName: row['Item name'],
                  ingredients,
                };
              });
            setMenuItems(items);
            if (items.length > 0) {
              setSelectedItem(items[0].itemName); // Default to first item
            }
          },
        });
      } catch (error) {
        console.error('Error loading menu items:', error);
      }
    }
    loadMenuItems();
  }, []);

  // Load all monthly item sales data
  useEffect(() => {
    async function loadAllMonthlyData() {
      if (menuItems.length === 0) return;
      
      setLoading(true);
      const monthFiles: Record<string, string> = {
        'May': 'May_Data_Matrix (1).xlsx',
        'June': 'June_Data_Matrix.xlsx',
        'July': 'July_Data_Matrix (1).xlsx',
        'August': 'August_Data_Matrix (1).xlsx',
        'September': 'September_Data_Matrix.xlsx',
        'October': 'October_Data_Matrix_20251103_214000.xlsx',
      };

      const allData: Record<string, Record<string, { count: number; amount: number }>> = {};

      for (const [month, file] of Object.entries(monthFiles)) {
        try {
          const response = await fetch(`/data/${file}`);
          const arrayBuffer = await response.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          
          // Get sheet index 2 (By Item) if available
          const sheetIndex = workbook.SheetNames.length > 2 ? 2 : (workbook.SheetNames.length > 1 ? 1 : 0);
          const sheetName = workbook.SheetNames[sheetIndex];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const itemSales: Record<string, { count: number; amount: number }> = {};
          
          jsonData.forEach((row: any) => {
            const itemName = row.Item || row['Item Name'] || row.Category || row.Name || '';
            const countStr = (row.Count || row.Quantity || '0').toString().replace(/,/g, '');
            const amountStr = (row.Amount || row.Price || row['Total Amount'] || '$0')
              .toString()
              .replace(/[$,]/g, '');
            
            const count = parseInt(countStr) || 0;
            const amount = parseFloat(amountStr) || 0;
            
            if (itemName && itemName !== 'Unknown' && (count > 0 || amount > 0)) {
              itemSales[itemName] = {
                count: (itemSales[itemName]?.count || 0) + count,
                amount: (itemSales[itemName]?.amount || 0) + amount,
              };
            }
          });
          
          allData[month] = itemSales;
        } catch (error) {
          console.error(`Error loading ${month} data:`, error);
        }
      }

      setAllMonthlyData(allData);
      setLoading(false);
    }

    loadAllMonthlyData();
  }, [menuItems]);

  // Initialize comparison items with selected item when it changes
  useEffect(() => {
    if (selectedItem) {
      setComparisonItems((prev) => {
        // If selectedItem is not in the list, add it
        // If the list is empty, make selectedItem the only item
        if (prev.length === 0) {
          return [selectedItem];
        }
        // If selectedItem is not in the list, add it to the beginning
        if (!prev.includes(selectedItem)) {
          return [selectedItem, ...prev];
        }
        // If it's already there, keep the current list
        return prev;
      });
    }
  }, [selectedItem]);

  // Map item names from sales data to menu item names
  const mapItemName = (salesItemName: string): string => {
    const itemMappings: Record<string, string> = {
      "mai's bf chicken cutlet combo": 'Chicken Cutlet',
      "mai's bf chicken cutlet": 'Chicken Cutlet',
      "chicken cutlet combo": 'Chicken Cutlet',
      "chicken cutlet": 'Chicken Cutlet',
    };
    
    const normalized = salesItemName.toLowerCase().trim();
    return itemMappings[normalized] || salesItemName;
  };

  // Prepare comparison data for selected items
  const comparisonData = useMemo(() => {
    if (comparisonItems.length === 0 || Object.keys(allMonthlyData).length === 0) {
      return [];
    }

    // Create data structure: { month: string, [itemName]: number }
    const comparisonChartData: Record<string, any>[] = availableMonths.map(month => {
      const monthData: Record<string, any> = { month };
      
      comparisonItems.forEach(itemName => {
        const monthDataForMonth = allMonthlyData[month] || {};
        let itemCount = 0;

        Object.keys(monthDataForMonth).forEach((salesItemName) => {
          const mappedName = mapItemName(salesItemName);
          if (mappedName === itemName || salesItemName === itemName) {
            itemCount += monthDataForMonth[salesItemName].count;
          }
        });

        monthData[itemName] = itemCount;
      });
      
      return monthData;
    });

    return comparisonChartData;
  }, [comparisonItems, allMonthlyData, availableMonths]);

  // Calculate item analysis data
  const itemAnalysis = useMemo(() => {
    if (!selectedItem || Object.keys(allMonthlyData).length === 0) {
      return null;
    }

    // Get sales data for selected item across all months
    const monthlySales: ItemSalesData[] = availableMonths.map((month) => {
      const monthData = allMonthlyData[month] || {};
      let itemCount = 0;
      let itemAmount = 0;

      // Try to find the item in sales data (check both direct match and mapped names)
      Object.keys(monthData).forEach((salesItemName) => {
        const mappedName = mapItemName(salesItemName);
        if (mappedName === selectedItem || salesItemName === selectedItem) {
          itemCount += monthData[salesItemName].count;
          itemAmount += monthData[salesItemName].amount;
        }
      });

      return {
        month,
        count: itemCount,
        amount: itemAmount,
      };
    });

    // Calculate statistics
    const totalSales = monthlySales.reduce((sum, m) => sum + m.count, 0);
    const totalRevenue = monthlySales.reduce((sum, m) => sum + m.amount, 0);
    const averageMonthlySales = monthlySales.length > 0 ? totalSales / monthlySales.length : 0;
    const averageMonthlyRevenue = monthlySales.length > 0 ? totalRevenue / monthlySales.length : 0;
    const averagePrice = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Get October-specific data
    const octoberData = monthlySales.find(m => m.month === 'October');
    const octoberSales = octoberData?.count || 0;
    const octoberRevenue = octoberData?.amount || 0;
    
    const counts = monthlySales.map(m => m.count);
    const maxCount = Math.max(...counts, 0);
    const minCount = Math.min(...counts.filter(c => c > 0), 0);
    const bestMonth = monthlySales.find(m => m.count === maxCount)?.month || 'N/A';
    const worstMonth = minCount > 0 ? monthlySales.find(m => m.count === minCount)?.month : 'N/A';

    // Calculate growth
    const firstMonth = monthlySales[0]?.count || 0;
    const lastMonth = monthlySales[monthlySales.length - 1]?.count || 0;
    const growthPercentage = firstMonth > 0 ? ((lastMonth - firstMonth) / firstMonth) * 100 : 0;

    // Get menu item details
    const menuItem = menuItems.find(item => item.itemName === selectedItem);
    const ingredientCount = menuItem ? Object.keys(menuItem.ingredients).filter(k => menuItem.ingredients[k] > 0).length : 0;

    // Prepare ingredient breakdown (top ingredients used in this item)
    const ingredientEntries = menuItem
      ? Object.entries(menuItem.ingredients)
          .filter(([_, amount]) => amount > 0)
          .map(([ingredient, amount]) => ({
            name: ingredient.replace(/\([^)]*\)/g, '').trim(),
            value: amount,
          }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 8)
      : [];
    
    // Calculate total for percentage calculation
    const totalIngredientAmount = ingredientEntries.reduce((sum, item) => sum + item.value, 0);
    
    // Add percentage to each ingredient
    const ingredientBreakdown = ingredientEntries.map(item => ({
      ...item,
      percentage: totalIngredientAmount > 0 ? (item.value / totalIngredientAmount) * 100 : 0,
    }));

    // Analyze product performance
    const last3Months = monthlySales.slice(-3);
    const last3MonthsTotal = last3Months.reduce((sum, m) => sum + m.count, 0);
    const previous3Months = monthlySales.slice(-6, -3);
    const previous3MonthsTotal = previous3Months.length > 0 ? previous3Months.reduce((sum, m) => sum + m.count, 0) : 0;
    
    // Calculate recent trend (last month vs second to last month)
    const recentMonths = monthlySales.slice(-2);
    const lastMonthSales = recentMonths[recentMonths.length - 1]?.count || 0;
    const secondLastMonthSales = recentMonths.length >= 2 ? recentMonths[0]?.count || 0 : 0;
    const recentGrowth = secondLastMonthSales > 0 ? ((lastMonthSales - secondLastMonthSales) / secondLastMonthSales) * 100 : 0;
    
    // Determine performance status
    let performanceStatus: {
      status: 'excellent' | 'rapid-growth' | 'declining' | 'low-sales' | 'good';
      message: string;
      color: string;
      bgColor: string;
      borderColor: string;
    };

    if (last3MonthsTotal <= 3) {
      // Extremely low sales
      performanceStatus = {
        status: 'low-sales',
        message: 'Sales are extremely low. Consider replacing or removing from menu.',
        color: 'text-red-300',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-400/30',
      };
    } else if (recentGrowth > 50 && lastMonthSales > 10) {
      // Rapidly increasing sales
      performanceStatus = {
        status: 'rapid-growth',
        message: 'Sales are rapidly increasing! Consider ordering more appropriate ingredients.',
        color: 'text-green-300',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-400/30',
      };
    } else if (recentGrowth < -20 && last3MonthsTotal < previous3MonthsTotal * 0.7) {
      // Declining sales
      performanceStatus = {
        status: 'declining',
        message: 'This item is on the decline. Monitor closely or consider adjustments.',
        color: 'text-yellow-300',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-400/30',
      };
    } else if (last3MonthsTotal > 50 && recentGrowth > 0) {
      // Excellent performance
      performanceStatus = {
        status: 'excellent',
        message: 'This item is going great! Keep up the momentum.',
        color: 'text-emerald-300',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-400/30',
      };
    } else {
      // Good performance (default)
      performanceStatus = {
        status: 'good',
        message: 'This item is performing well. Continue monitoring.',
        color: 'text-blue-300',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-400/30',
      };
    }

    return {
      monthlySales,
      stats: {
        totalSales,
        totalRevenue,
        averageMonthlySales,
        averageMonthlyRevenue,
        averagePrice,
        octoberSales,
        octoberRevenue,
        maxCount,
        minCount,
        bestMonth,
        worstMonth,
        growthPercentage,
        ingredientCount,
      },
      ingredientBreakdown,
      performanceStatus,
    };
  }, [selectedItem, allMonthlyData, menuItems]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-100 mb-2">Item Analytics</h2>
        <p className="text-gray-400 text-sm mb-4">
          Select an item to view detailed sales trends and analytics
        </p>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-300">Select Item:</label>
          <select
            value={selectedItem}
            onChange={(e) => setSelectedItem(e.target.value)}
            className="px-4 py-2 bg-slate-700/50 border border-slate-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none min-w-[250px]"
          >
            <option value="" className="bg-slate-800">-- Select Item --</option>
            {menuItems.map((item) => (
              <option key={item.itemName} value={item.itemName} className="bg-slate-800">
                {item.itemName}
              </option>
            ))}
          </select>
          {loading && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-400"></div>
              Loading data...
            </div>
          )}
        </div>
      </div>

      {itemAnalysis && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-lg border border-pink-400/30 p-4 rounded-xl">
              <p className="text-pink-300 text-xs font-medium mb-1">Total Sales</p>
              <p className="text-2xl font-bold text-pink-200">
                {itemAnalysis.stats.totalSales.toLocaleString()}
              </p>
              <p className="text-pink-400 text-xs mt-1">all time</p>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-lg border border-cyan-400/30 p-4 rounded-xl">
              <p className="text-cyan-300 text-xs font-medium mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-cyan-200">
                ${itemAnalysis.stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-cyan-400 text-xs mt-1">all time</p>
            </div>
            <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg border border-green-400/30 p-4 rounded-xl">
              <p className="text-green-300 text-xs font-medium mb-1">October Sales</p>
              <p className="text-2xl font-bold text-green-200">
                {itemAnalysis.stats.octoberSales.toLocaleString()}
              </p>
              <p className="text-green-400 text-xs mt-1">October 2024</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg border border-yellow-400/30 p-4 rounded-xl">
              <p className="text-yellow-300 text-xs font-medium mb-1">October Revenue</p>
              <p className="text-2xl font-bold text-yellow-200">
                ${itemAnalysis.stats.octoberRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-yellow-400 text-xs mt-1">October 2024</p>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-4 rounded-xl">
              <p className="text-gray-300 text-xs font-medium mb-1">Best Month</p>
              <p className="text-lg font-bold text-gray-100">
                {itemAnalysis.stats.bestMonth}
              </p>
              <p className="text-gray-400 text-xs mt-1">{itemAnalysis.stats.maxCount} sales</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-4 rounded-xl">
              <p className="text-gray-300 text-xs font-medium mb-1">Growth</p>
              <p className={`text-lg font-bold ${itemAnalysis.stats.growthPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {itemAnalysis.stats.growthPercentage >= 0 ? '+' : ''}{itemAnalysis.stats.growthPercentage.toFixed(1)}%
              </p>
              <p className="text-gray-400 text-xs mt-1">since first month</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-4 rounded-xl">
              <p className="text-gray-300 text-xs font-medium mb-1">Ingredients</p>
              <p className="text-lg font-bold text-gray-100">
                {itemAnalysis.stats.ingredientCount}
              </p>
              <p className="text-gray-400 text-xs mt-1">different ingredients</p>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-4 rounded-xl">
              <p className="text-gray-300 text-xs font-medium mb-1">Average Sales</p>
              <p className="text-lg font-bold text-gray-100">
                {itemAnalysis.stats.averageMonthlySales.toFixed(1)}
              </p>
              <p className="text-gray-400 text-xs mt-1">per month</p>
            </div>
          </div>

          {/* Item Sales Comparison */}
          <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold text-gray-100">Item Sales Comparison</h3>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <label className="text-sm font-medium text-gray-300 whitespace-nowrap">Compare Items:</label>
                <div className="flex items-center gap-2 flex-1 min-w-0 relative">
                  <button
                    type="button"
                    onClick={() => setComparisonDropdownOpen(!comparisonDropdownOpen)}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none w-full sm:min-w-[250px] text-left text-sm flex items-center justify-between"
                  >
                    <span className="truncate">
                      {comparisonItems.length === 0
                        ? 'Select items to compare'
                        : comparisonItems.length === 1
                        ? comparisonItems[0]
                        : `${comparisonItems.length} items selected`}
                    </span>
                    <svg
                      className={`w-4 h-4 ml-2 transition-transform ${comparisonDropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {comparisonDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setComparisonDropdownOpen(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto custom-scrollbar">
                        <div className="p-2">
                          {/* Select All Option */}
                          <label
                            className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700/50 rounded cursor-pointer transition-colors border-b border-slate-700 mb-1"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={menuItems.length > 0 && comparisonItems.length === menuItems.length}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) {
                                  setComparisonItems(menuItems.map(item => item.itemName));
                                } else {
                                  setComparisonItems([]);
                                }
                              }}
                              className="w-4 h-4 text-pink-500 bg-slate-700 border-slate-600 rounded focus:ring-pink-500 focus:ring-2"
                            />
                            <span className="text-sm font-medium text-gray-100 flex-1">Select All</span>
                          </label>
                          <div className="space-y-1">
                            {menuItems.map((item) => {
                              const isSelected = comparisonItems.includes(item.itemName);
                              return (
                                <label
                                  key={item.itemName}
                                  className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700/50 rounded cursor-pointer transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      e.stopPropagation();
                                      if (e.target.checked) {
                                        setComparisonItems([...comparisonItems, item.itemName]);
                                      } else {
                                        setComparisonItems(comparisonItems.filter(name => name !== item.itemName));
                                      }
                                    }}
                                    className="w-4 h-4 text-pink-500 bg-slate-700 border-slate-600 rounded focus:ring-pink-500 focus:ring-2"
                                  />
                                  <span className="text-sm text-gray-200 flex-1">{item.itemName}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <div className="border-t border-slate-700 p-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (selectedItem) {
                                setComparisonItems([selectedItem]);
                              } else {
                                setComparisonItems([]);
                              }
                              setComparisonDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 text-sm bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-gray-300 rounded transition-colors"
                          >
                            Reset to Selected Item
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            {comparisonItems.length > 0 && comparisonData.length > 0 ? (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                    label={{ value: 'Sales Count', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#cbd5e1'
                    }}
                    formatter={(value: number) => [value.toLocaleString(), 'Sales']}
                  />
                  <Legend wrapperStyle={{ color: '#cbd5e1' }} />
                  {comparisonItems.map((itemName, index) => (
                    <Line 
                      key={itemName}
                      type="monotone" 
                      dataKey={itemName} 
                      stroke={COLORS[index % COLORS.length]} 
                      strokeWidth={3}
                      dot={{ r: 6, fill: COLORS[index % COLORS.length] }}
                      activeDot={{ r: 8 }}
                      name={itemName}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[350px]">
                <p className="text-gray-400">Select items from the dropdown to compare sales</p>
              </div>
            )}
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Progression - Area Chart */}
            <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Sales Progression (Area Chart)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={itemAnalysis.monthlySales}>
                  <defs>
                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                    label={{ value: 'Sales Count', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#cbd5e1'
                    }}
                    formatter={(value: number) => [value.toLocaleString(), 'Sales']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#ec4899" 
                    fillOpacity={1} 
                    fill="url(#colorSales)" 
                    name="Sales Count"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Monthly Revenue - Bar Chart */}
            <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Monthly Revenue (Bar Chart)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={itemAnalysis.monthlySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis 
                    dataKey="month" 
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                  />
                  <YAxis 
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: 12 }}
                    label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft', fill: '#cbd5e1' }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1e293b', 
                      border: '1px solid #475569',
                      borderRadius: '8px',
                      color: '#cbd5e1'
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Revenue']}
                  />
                  <Bar dataKey="amount" fill="#8b5cf6" radius={[8, 8, 0, 0]} name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Ingredient Breakdown - Pie Chart */}
            <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Ingredient Breakdown (Pie Chart)</h3>
              {itemAnalysis.ingredientBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={itemAnalysis.ingredientBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => {
                        const percentage = entry.percentage ?? 0;
                        return `${percentage.toFixed(1)}%`;
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {itemAnalysis.ingredientBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #475569',
                        borderRadius: '8px',
                        color: '#cbd5e1'
                      }}
                      content={({ active, payload }) => {
                        if (!active || !payload || payload.length === 0) {
                          return null;
                        }
                        const data = payload[0];
                        const sliceColor = data.color || '#cbd5e1';
                        
                        return (
                          <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
                            <p className="font-semibold mb-2" style={{ color: sliceColor }}>
                              {data.payload?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-300">
                              Amount: {data.value?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px]">
                  <p className="text-gray-400">No ingredient data available</p>
                </div>
              )}
            </div>

            {/* Product Performance Status */}
            <div className={`bg-slate-900/50 backdrop-blur-lg border ${itemAnalysis.performanceStatus.borderColor} p-6 rounded-xl`}>
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Product Performance</h3>
              <div className={`${itemAnalysis.performanceStatus.bgColor} border ${itemAnalysis.performanceStatus.borderColor} rounded-lg p-4 space-y-3`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-1.5 w-2 h-2 rounded-full ${itemAnalysis.performanceStatus.color.replace('text-', 'bg-')}`}></div>
                  <div className="flex-1">
                    <p className={`${itemAnalysis.performanceStatus.color} font-medium text-sm leading-relaxed`}>
                      {itemAnalysis.performanceStatus.message}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-700/50">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="text-gray-400">Last 3 Months</p>
                      <p className="text-gray-200 font-semibold">
                        {itemAnalysis.monthlySales.slice(-3).reduce((sum, m) => sum + m.count, 0)} sales
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400">Recent Growth</p>
                      <p className={`font-semibold ${itemAnalysis.monthlySales.length >= 2 ? 
                        (itemAnalysis.monthlySales[itemAnalysis.monthlySales.length - 1].count > itemAnalysis.monthlySales[itemAnalysis.monthlySales.length - 2].count ? 'text-green-400' : 'text-red-400') : 
                        'text-gray-200'}`}>
                        {itemAnalysis.monthlySales.length >= 2 ? 
                          `${((itemAnalysis.monthlySales[itemAnalysis.monthlySales.length - 1].count - itemAnalysis.monthlySales[itemAnalysis.monthlySales.length - 2].count) / (itemAnalysis.monthlySales[itemAnalysis.monthlySales.length - 2].count || 1) * 100).toFixed(1)}%` : 
                          'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedItem && !loading && !itemAnalysis && (
        <div className="text-center py-12">
          <p className="text-gray-400">No sales data found for this item.</p>
        </div>
      )}
    </div>
  );
}

