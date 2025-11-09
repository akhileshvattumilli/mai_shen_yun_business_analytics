'use client';

import { useMemo, useState, useEffect } from 'react';
import { Ingredient, MenuItem } from '../lib/data-loader';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  AreaChart, 
  Area,
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

interface ShipmentStatisticsProps {
  shipments: Ingredient[];
}

interface ShipmentStatistic {
  ingredient: string;
  quantityPerShipment: number;
  unit: string;
  numberOfShipments: number;
  frequency: string;
  monthlyQuantity: number;
  usagePercentage: number | null;
  usedQuantity: number | null;
}

type SortColumn = 'ingredient' | 'quantityPerShipment' | 'numberOfShipments' | 'frequency' | 'monthlyQuantity' | 'usagePercentage' | null;
type SortDirection = 'asc' | 'desc';

const availableMonths = ['May', 'June', 'July', 'August', 'September', 'October'];

export default function ShipmentStatistics({ shipments }: ShipmentStatisticsProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('October');
  const [sortColumn, setSortColumn] = useState<SortColumn>('monthlyQuantity');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [monthlyItemSales, setMonthlyItemSales] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<string>('Beef');
  const [allMonthlyData, setAllMonthlyData] = useState<Record<string, Record<string, number>>>({});
  const [analyzingIngredient, setAnalyzingIngredient] = useState(false);

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
          },
        });
      } catch (error) {
        console.error('Error loading menu items:', error);
      }
    }
    loadMenuItems();
  }, []);

  // Load monthly item sales when month is selected
  useEffect(() => {
    if (!selectedMonth) {
      setMonthlyItemSales({});
      return;
    }

    async function loadMonthlyData() {
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
          setMonthlyItemSales({});
          setLoading(false);
          return;
        }

        const response = await fetch(`/data/${file}`);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        // Get sheet index 2 (By Item) if available, otherwise fallback
        const sheetIndex = workbook.SheetNames.length > 2 ? 2 : (workbook.SheetNames.length > 1 ? 1 : 0);
        const sheetName = workbook.SheetNames[sheetIndex];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        const itemSales: Record<string, number> = {};
        
        jsonData.forEach((row: any) => {
          const itemName = row.Item || row['Item Name'] || row.Category || row.Name || '';
          const countStr = (row.Count || row.Quantity || '0').toString().replace(/,/g, '');
          const count = parseInt(countStr) || 0;
          
          if (itemName && count > 0) {
            itemSales[itemName] = (itemSales[itemName] || 0) + count;
          }
        });

        setMonthlyItemSales(itemSales);
        setLoading(false);
      } catch (error) {
        console.error(`Error loading ${selectedMonth} data:`, error);
        setLoading(false);
      }
    }

    loadMonthlyData();
  }, [selectedMonth]);

  // Load all monthly data when ingredient is selected for analysis
  useEffect(() => {
    if (!selectedIngredient) {
      setAllMonthlyData({});
      return;
    }

    async function loadAllMonthlyData() {
      setAnalyzingIngredient(true);
      const monthFiles: Record<string, string> = {
        'May': 'May_Data_Matrix (1).xlsx',
        'June': 'June_Data_Matrix.xlsx',
        'July': 'July_Data_Matrix (1).xlsx',
        'August': 'August_Data_Matrix (1).xlsx',
        'September': 'September_Data_Matrix.xlsx',
        'October': 'October_Data_Matrix_20251103_214000.xlsx',
      };

      const allData: Record<string, Record<string, number>> = {};

      for (const [month, file] of Object.entries(monthFiles)) {
        try {
          const response = await fetch(`/data/${file}`);
          const arrayBuffer = await response.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          
          const sheetIndex = workbook.SheetNames.length > 2 ? 2 : (workbook.SheetNames.length > 1 ? 1 : 0);
          const sheetName = workbook.SheetNames[sheetIndex];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const itemSales: Record<string, number> = {};
          jsonData.forEach((row: any) => {
            const itemName = row.Item || row['Item Name'] || row.Category || row.Name || '';
            const countStr = (row.Count || row.Quantity || '0').toString().replace(/,/g, '');
            const count = parseInt(countStr) || 0;
            if (itemName && count > 0) {
              itemSales[itemName] = (itemSales[itemName] || 0) + count;
            }
          });
          allData[month] = itemSales;
        } catch (error) {
          console.error(`Error loading ${month} data:`, error);
        }
      }

      setAllMonthlyData(allData);
      setAnalyzingIngredient(false);
    }

    loadAllMonthlyData();
  }, [selectedIngredient]);

  // Map item names from sales data to ingredients CSV item names
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

  // Map ingredient names from CSV to shipment names
  const mapIngredientName = (csvIngredientName: string, shipmentName: string): boolean => {
    const csvLower = csvIngredientName.toLowerCase().replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
    const shipmentLower = shipmentName.toLowerCase().trim();
    
    // Special mappings - shipment name to CSV column name patterns
    const mappings: Record<string, string[]> = {
      'beef': ['braised beef', 'beef'],
      'chicken': ['braised chicken', 'chicken'],
      'chicken wings': ['chicken wings'],
      'ramen': ['ramen'],
      'rice noodles': ['rice noodles'],
      'rice': ['rice'],
      'egg': ['egg'],
      'flour': ['flour'],
      'green onion': ['green onion'],
      'cilantro': ['cilantro'],
      'white onion': ['white onion'],
      'peas + carrot': ['peas', 'carrot'],
      'bokchoy': ['boychoy', 'bokchoy'],
      'tapioca starch': ['tapioca starch'],
    };
    
    // Check if shipment has a specific mapping
    if (mappings[shipmentLower]) {
      return mappings[shipmentLower].some(variant => csvLower.includes(variant));
    }
    
    // Direct matches (remove common suffixes and check)
    const csvClean = csvLower.replace(/\s*(used|g|count|pcs)\s*/g, '').trim();
    const shipmentClean = shipmentLower.replace(/\s*\+\s*/g, ' ').trim();
    
    // Check if cleaned names match
    if (csvClean === shipmentClean || csvClean.includes(shipmentClean) || shipmentClean.includes(csvClean.split(' ')[0])) {
      return true;
    }
    
    // Check for partial matches (first word)
    const csvFirstWord = csvClean.split(' ')[0];
    const shipmentFirstWord = shipmentClean.split(' ')[0];
    if (csvFirstWord === shipmentFirstWord && csvFirstWord.length > 2) {
      return true;
    }
    
    return false;
  };

  // Calculate monthly quantity and usage for each ingredient
  const statistics = useMemo(() => {
    const stats: ShipmentStatistic[] = shipments.map((shipment) => {
      // Calculate frequency multiplier
      const frequencyLower = shipment.frequency.toLowerCase().trim();
      let frequencyMultiplier = 1;
      
      if (frequencyLower === 'weekly') {
        frequencyMultiplier = 4; // 4 weeks per month
      } else if (frequencyLower === 'biweekly') {
        frequencyMultiplier = 2; // 2 times per month
      } else if (frequencyLower === 'monthly') {
        frequencyMultiplier = 1; // 1 time per month
      }

      // Calculate: Quantity per shipment × Number of shipments × Frequency multiplier
      const monthlyQuantity = shipment.quantity * shipment.shipments * frequencyMultiplier;

      // Calculate usage from menu items and sales
      let usedQuantity: number | null = null;
      let usagePercentage: number | null = null;
      let foundInCSV = false;

      if (selectedMonth && menuItems.length > 0 && Object.keys(monthlyItemSales).length > 0) {
        let totalUsed = 0;
        
        // Find matching ingredient columns in menu items
        menuItems.forEach((menuItem) => {
          // Calculate total sales count for this menu item
          // Check both direct match and mapped item names from sales data
          let itemSalesCount = 0;
          
          Object.keys(monthlyItemSales).forEach((salesItemName) => {
            const mappedName = mapItemName(salesItemName);
            // Match if sales item name maps to menu item name, or if they match directly
            if (mappedName === menuItem.itemName || salesItemName === menuItem.itemName) {
              itemSalesCount += monthlyItemSales[salesItemName] || 0;
            }
          });
          
          if (itemSalesCount > 0) {
            Object.entries(menuItem.ingredients).forEach(([ingredientColumn, quantity]) => {
              // Special handling for "Peas + Carrot" - match both Peas and Carrot columns
              if (shipment.name.toLowerCase().includes('peas') && shipment.name.toLowerCase().includes('carrot')) {
                const csvLower = ingredientColumn.toLowerCase();
                if (csvLower.includes('peas') || csvLower.includes('carrot')) {
                  foundInCSV = true;
                  // Determine unit conversion needed
                  const shipmentUnit = shipment.unit.toLowerCase();
                  const csvUnit = ingredientColumn.toLowerCase();
                  
                  let quantityInShipmentUnit = quantity;
                  
                  // Convert grams to lbs if shipment unit is lbs and CSV has grams
                  // Peas and Carrot in CSV are marked with (g), so they need conversion
                  if ((shipmentUnit.includes('lbs') || shipmentUnit.includes('lb')) && 
                      (csvUnit.includes('(g)') || csvUnit.includes(' g)'))) {
                    quantityInShipmentUnit = quantity * 0.00220462;
                  }
                  
                  totalUsed += quantityInShipmentUnit * itemSalesCount;
                }
              } else if (mapIngredientName(ingredientColumn, shipment.name)) {
                foundInCSV = true;
                // Determine unit conversion needed
                const shipmentUnit = shipment.unit.toLowerCase();
                const csvUnit = ingredientColumn.toLowerCase();
                const csvColumnLower = ingredientColumn.toLowerCase();
                
                let quantityInShipmentUnit = quantity;
                
                // Special handling for White Onion: CSV has grams, shipment has whole onions
                // Each whole onion = 130 grams
                if (shipment.name.toLowerCase().includes('white onion') && 
                    shipmentUnit.includes('whole')) {
                  // Convert grams to whole onions (divide by 130)
                  quantityInShipmentUnit = quantity / 130;
                }
                // Ingredients that are in grams but don't have explicit (g) indicator in CSV
                // These ingredients are measured in grams in the CSV but don't have the (g) suffix
                else {
                  const gramsIngredientsWithoutIndicator = ['tapioca starch', 'pickle cabbage', 'green onion', 'cilantro', 'white onion'];
                  const isGramsIngredient = gramsIngredientsWithoutIndicator.some(ing => csvColumnLower.includes(ing));
                  
                  // Check if shipment unit is count-based (should not convert to lbs)
                  const isShipmentCountBased = shipmentUnit.includes('count') || shipmentUnit.includes('pcs') || 
                                             shipmentUnit.includes('pieces') || shipmentUnit.includes('eggs') ||
                                             shipmentUnit.includes('rolls');
                  
                  // Check if CSV column indicates count-based (should not convert)
                  const isCSVCountBased = csvUnit.includes('count') || csvUnit.includes('pcs') || 
                                         csvUnit.includes('pieces') || csvUnit.includes('eggs') ||
                                         csvUnit.includes('rolls');
                  
                  // Convert grams to lbs if:
                  // 1. Shipment unit is lbs (not count-based, not whole onion)
                  // 2. CSV has explicit (g) indicator OR it's a known grams ingredient without indicator
                  // 3. CSV column is not count-based
                  // 4. Not White Onion (handled separately above)
                  if ((shipmentUnit.includes('lbs') || shipmentUnit.includes('lb')) && 
                      !isShipmentCountBased &&
                      !isCSVCountBased &&
                      !csvColumnLower.includes('white onion') &&
                      (csvUnit.includes('(g)') || csvUnit.includes(' g)') || isGramsIngredient)) {
                    // Convert grams to lbs (1 gram = 0.00220462 lbs)
                    quantityInShipmentUnit = quantity * 0.00220462;
                  }
                  // For count-based items (eggs, ramen, pieces), use quantity as-is
                  // No conversion needed for counts
                }
                
                totalUsed += quantityInShipmentUnit * itemSalesCount;
              }
            });
          }
        });

        // Log warning if ingredient not found in CSV
        if (!foundInCSV && selectedMonth) {
          console.warn(`Ingredient "${shipment.name}" not found in ingredients CSV file`);
        }

        if (totalUsed > 0) {
          usedQuantity = totalUsed;
          usagePercentage = (totalUsed / monthlyQuantity) * 100;
        }
      }

      // Special handling for Chicken Wings - always show 0% used
      const isChickenWings = shipment.name.toLowerCase().includes('chicken wing');
      const finalUsedQuantity = isChickenWings ? 0 : usedQuantity;
      const finalUsagePercentage = isChickenWings ? 0 : usagePercentage;

      return {
        ingredient: shipment.name,
        quantityPerShipment: shipment.quantity,
        unit: shipment.unit,
        numberOfShipments: shipment.shipments,
        frequency: shipment.frequency,
        monthlyQuantity,
        usedQuantity: finalUsedQuantity,
        usagePercentage: finalUsagePercentage,
      };
    });

    // Filter out flour from the display (but keep it in data processing)
    return stats.filter(stat => stat.ingredient.toLowerCase() !== 'flour');
  }, [shipments, selectedMonth, menuItems, monthlyItemSales]);

  // Sort data based on selected column and direction
  const sortedData = useMemo(() => {
    if (!sortColumn) return statistics;

    const sorted = [...statistics].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortColumn === 'ingredient') {
        aValue = a.ingredient.toLowerCase();
        bValue = b.ingredient.toLowerCase();
      } else if (sortColumn === 'quantityPerShipment') {
        aValue = a.quantityPerShipment;
        bValue = b.quantityPerShipment;
      } else if (sortColumn === 'numberOfShipments') {
        aValue = a.numberOfShipments;
        bValue = b.numberOfShipments;
      } else if (sortColumn === 'frequency') {
        aValue = a.frequency.toLowerCase();
        bValue = b.frequency.toLowerCase();
      } else if (sortColumn === 'monthlyQuantity') {
        aValue = a.monthlyQuantity;
        bValue = b.monthlyQuantity;
      } else if (sortColumn === 'usagePercentage') {
        aValue = a.usagePercentage ?? -1;
        bValue = b.usagePercentage ?? -1;
      } else {
        return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      } else {
        if (sortDirection === 'asc') {
          return (aValue as number) - (bValue as number);
        } else {
          return (bValue as number) - (aValue as number);
        }
      }
    });

    return sorted;
  }, [statistics, sortColumn, sortDirection]);

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

  // Calculate ingredient analysis data
  const ingredientAnalysis = useMemo(() => {
    if (!selectedIngredient || menuItems.length === 0 || Object.keys(allMonthlyData).length === 0) {
      return null;
    }

    // Find the CSV ingredient column name that matches the selected ingredient
    const findIngredientColumn = (): string | null => {
      for (const menuItem of menuItems) {
        for (const [ingredientColumn] of Object.entries(menuItem.ingredients)) {
          if (mapIngredientName(ingredientColumn, selectedIngredient)) {
            return ingredientColumn;
          }
        }
      }
      return null;
    };

    const ingredientColumn = findIngredientColumn();
    if (!ingredientColumn) return null;

    // Get shipment info for unit conversion
    const shipment = shipments.find(s => s.name.toLowerCase() === selectedIngredient.toLowerCase());
    const shipmentUnit = shipment?.unit.toLowerCase() || '';

    // Calculate dish usage breakdown (across all months)
    const dishUsage: Record<string, number> = {};
    let totalUsage = 0;

    availableMonths.forEach((month) => {
      const monthSales = allMonthlyData[month] || {};
      
      menuItems.forEach((menuItem) => {
        if (!menuItem.ingredients[ingredientColumn] || menuItem.ingredients[ingredientColumn] === 0) {
          return;
        }

        let itemSalesCount = 0;
        Object.keys(monthSales).forEach((salesItemName) => {
          const mappedName = mapItemName(salesItemName);
          if (mappedName === menuItem.itemName || salesItemName === menuItem.itemName) {
            itemSalesCount += monthSales[salesItemName] || 0;
          }
        });

        if (itemSalesCount > 0) {
          let quantity = menuItem.ingredients[ingredientColumn];
          
          // Apply unit conversions similar to statistics calculation
          if (selectedIngredient.toLowerCase().includes('peas') && selectedIngredient.toLowerCase().includes('carrot')) {
            const csvUnit = ingredientColumn.toLowerCase();
            if ((shipmentUnit.includes('lbs') || shipmentUnit.includes('lb')) && 
                (csvUnit.includes('(g)') || csvUnit.includes(' g)'))) {
              quantity = quantity * 0.00220462;
            }
          } else if (selectedIngredient.toLowerCase().includes('white onion') && shipmentUnit.includes('whole')) {
            quantity = quantity / 130;
          } else {
            const csvColumnLower = ingredientColumn.toLowerCase();
            const gramsIngredientsWithoutIndicator = ['tapioca starch', 'pickle cabbage', 'green onion', 'cilantro', 'white onion'];
            const isGramsIngredient = gramsIngredientsWithoutIndicator.some(ing => csvColumnLower.includes(ing));
            const isShipmentCountBased = shipmentUnit.includes('count') || shipmentUnit.includes('pcs') || 
                                       shipmentUnit.includes('pieces') || shipmentUnit.includes('eggs') || shipmentUnit.includes('rolls');
            const isCSVCountBased = ingredientColumn.toLowerCase().includes('count') || 
                                  ingredientColumn.toLowerCase().includes('pcs') || 
                                  ingredientColumn.toLowerCase().includes('pieces') || 
                                  ingredientColumn.toLowerCase().includes('eggs') ||
                                  ingredientColumn.toLowerCase().includes('rolls');
            
            if ((shipmentUnit.includes('lbs') || shipmentUnit.includes('lb')) && 
                !isShipmentCountBased && !isCSVCountBased &&
                !csvColumnLower.includes('white onion') &&
                (ingredientColumn.toLowerCase().includes('(g)') || ingredientColumn.toLowerCase().includes(' g)') || isGramsIngredient)) {
              quantity = quantity * 0.00220462;
            }
          }

          const usage = quantity * itemSalesCount;
          dishUsage[menuItem.itemName] = (dishUsage[menuItem.itemName] || 0) + usage;
          totalUsage += usage;
        }
      });
    });

    // Prepare pie chart data (top dishes)
    const pieData = Object.entries(dishUsage)
      .map(([dish, usage]) => ({
        name: dish,
        value: usage,
        percentage: totalUsage > 0 ? (usage / totalUsage) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 dishes

    // Calculate monthly usage by dish and total
    const monthlyUsageByDish: Record<string, Record<string, number>> = {};
    const monthlyUsageData = availableMonths.map((month) => {
      const monthSales = allMonthlyData[month] || {};
      let monthTotal = 0;
      monthlyUsageByDish[month] = {};

      menuItems.forEach((menuItem) => {
        if (!menuItem.ingredients[ingredientColumn] || menuItem.ingredients[ingredientColumn] === 0) {
          return;
        }

        let itemSalesCount = 0;
        Object.keys(monthSales).forEach((salesItemName) => {
          const mappedName = mapItemName(salesItemName);
          if (mappedName === menuItem.itemName || salesItemName === menuItem.itemName) {
            itemSalesCount += monthSales[salesItemName] || 0;
          }
        });

        if (itemSalesCount > 0) {
          let quantity = menuItem.ingredients[ingredientColumn];
          
          // Apply same conversions
          if (selectedIngredient.toLowerCase().includes('peas') && selectedIngredient.toLowerCase().includes('carrot')) {
            const csvUnit = ingredientColumn.toLowerCase();
            if ((shipmentUnit.includes('lbs') || shipmentUnit.includes('lb')) && 
                (csvUnit.includes('(g)') || csvUnit.includes(' g)'))) {
              quantity = quantity * 0.00220462;
            }
          } else if (selectedIngredient.toLowerCase().includes('white onion') && shipmentUnit.includes('whole')) {
            quantity = quantity / 130;
          } else {
            const csvColumnLower = ingredientColumn.toLowerCase();
            const gramsIngredientsWithoutIndicator = ['tapioca starch', 'pickle cabbage', 'green onion', 'cilantro', 'white onion'];
            const isGramsIngredient = gramsIngredientsWithoutIndicator.some(ing => csvColumnLower.includes(ing));
            const isShipmentCountBased = shipmentUnit.includes('count') || shipmentUnit.includes('pcs') || 
                                       shipmentUnit.includes('pieces') || shipmentUnit.includes('eggs') || shipmentUnit.includes('rolls');
            const isCSVCountBased = ingredientColumn.toLowerCase().includes('count') || 
                                  ingredientColumn.toLowerCase().includes('pcs') || 
                                  ingredientColumn.toLowerCase().includes('pieces') || 
                                  ingredientColumn.toLowerCase().includes('eggs') ||
                                  ingredientColumn.toLowerCase().includes('rolls');
            
            if ((shipmentUnit.includes('lbs') || shipmentUnit.includes('lb')) && 
                !isShipmentCountBased && !isCSVCountBased &&
                !csvColumnLower.includes('white onion') &&
                (ingredientColumn.toLowerCase().includes('(g)') || ingredientColumn.toLowerCase().includes(' g)') || isGramsIngredient)) {
              quantity = quantity * 0.00220462;
            }
          }

          const dishUsage = quantity * itemSalesCount;
          monthlyUsageByDish[month][menuItem.itemName] = (monthlyUsageByDish[month][menuItem.itemName] || 0) + dishUsage;
          monthTotal += dishUsage;
        }
      });

      return {
        month,
        usage: monthTotal
      };
    });

    // Prepare stacked area chart data - get top dishes and create monthly breakdown
    const topDishesForChart = pieData.slice(0, 10).map(d => d.name); // Top 10 dishes for the chart
    const stackedAreaData = availableMonths.map((month) => {
      const data: any = { month };
      topDishesForChart.forEach((dishName) => {
        data[dishName] = monthlyUsageByDish[month]?.[dishName] || 0;
      });
      return data;
    });

    // Calculate statistics
    const monthlyValues = monthlyUsageData.map(d => d.usage);
    const totalUsageAllMonths = monthlyValues.reduce((sum, val) => sum + val, 0);
    const averageMonthlyUsage = monthlyValues.length > 0 ? totalUsageAllMonths / monthlyValues.length : 0;
    const maxUsage = monthlyValues.length > 0 ? Math.max(...monthlyValues, 0) : 0;
    const positiveValues = monthlyValues.filter(v => v > 0);
    const minUsage = positiveValues.length > 0 ? Math.min(...positiveValues) : 0;
    const topDish = pieData.length > 0 ? pieData[0].name : 'N/A';
    const topDishPercentage = pieData.length > 0 ? pieData[0].percentage : 0;

    // Calculate estimated need based on previous month + 10%
    const previousMonthUsage = monthlyUsageData.length > 0 ? monthlyUsageData[monthlyUsageData.length - 1].usage : 0;
    const estimatedMonthlyNeed = previousMonthUsage > 0 ? previousMonthUsage * 1.1 : 0; // 10% higher than previous month

    // Calculate scheduled shipment amount
    let scheduledShipmentAmount = 0;
    if (shipment) {
      const frequencyLower = shipment.frequency.toLowerCase().trim();
      let frequencyMultiplier = 1;
      
      if (frequencyLower === 'weekly') {
        frequencyMultiplier = 4; // 4 weeks per month
      } else if (frequencyLower === 'biweekly') {
        frequencyMultiplier = 2; // 2 times per month
      } else if (frequencyLower === 'monthly') {
        frequencyMultiplier = 1; // 1 time per month
      }
      
      scheduledShipmentAmount = shipment.quantity * shipment.shipments * frequencyMultiplier;
    }

    // Determine if need is met, over-met, or not met
    const difference = scheduledShipmentAmount - estimatedMonthlyNeed;
    const percentageDifference = estimatedMonthlyNeed > 0 ? (difference / estimatedMonthlyNeed) * 100 : 0;
    
    let needStatus: 'met' | 'over-met' | 'not-met' = 'met';
    // Use percentage-based thresholds: not met if more than 5% under, over-met if more than 10% over
    if (estimatedMonthlyNeed > 0) {
      if (percentageDifference < -5) {
        needStatus = 'not-met';
      } else if (percentageDifference > 10) {
        needStatus = 'over-met';
      }
    } else if (scheduledShipmentAmount > 0) {
      // If estimated need is 0 but we have shipments scheduled, consider it over-met
      needStatus = 'over-met';
    }

    // Generate recommendation
    let recommendation = '';
    let recommendationType: 'reduce' | 'increase' | 'none' = 'none';
    
    if (needStatus === 'over-met' && estimatedMonthlyNeed > 0 && shipment) {
      // Calculate how much to reduce
      const excess = difference;
      const excessPercentage = percentageDifference;
      const targetReduction = excess * 0.8; // Reduce by 80% of excess to get closer to need
      const quantityPerShipment = shipment.quantity;
      
      // Calculate reduction in shipments
      const shipmentsToReduce = Math.floor(targetReduction / quantityPerShipment);
      const minShipments = 1; // Minimum 1 shipment
      
      if (shipmentsToReduce > 0 && (shipment.shipments - shipmentsToReduce) >= minShipments) {
        recommendation = `Reduce number of shipments by ${shipmentsToReduce} (from ${shipment.shipments} to ${shipment.shipments - shipmentsToReduce} shipments)`;
        recommendationType = 'reduce';
      } else if (shipment.shipments > minShipments) {
        // Can't reduce by full amount, suggest reducing frequency or quantity
        const maxReduction = shipment.shipments - minShipments;
        if (maxReduction > 0) {
          recommendation = `Reduce number of shipments by ${maxReduction} (from ${shipment.shipments} to ${minShipments}) or reduce quantity per shipment by approximately ${excessPercentage.toFixed(1)}%`;
        } else {
          recommendation = `Reduce quantity per shipment by approximately ${excessPercentage.toFixed(1)}% to better match estimated need`;
        }
        recommendationType = 'reduce';
      } else {
        // Only 1 shipment, can only reduce quantity
        const quantityReductionPercent = (targetReduction / quantityPerShipment * 100);
        recommendation = `Reduce quantity per shipment by approximately ${quantityReductionPercent.toFixed(1)}% (currently ${quantityPerShipment.toLocaleString()} ${shipment.unit} per shipment)`;
        recommendationType = 'reduce';
      }
    } else if (needStatus === 'not-met' && estimatedMonthlyNeed > 0 && shipment) {
      // Calculate how much to increase
      const shortage = Math.abs(difference);
      const shortagePercentage = Math.abs(percentageDifference);
      const quantityPerShipment = shipment.quantity;
      const additionalQuantityNeeded = shortage * 1.1; // Add 10% buffer
      const shipmentsToAdd = Math.ceil(additionalQuantityNeeded / quantityPerShipment);
      const quantityIncreasePercent = (shortage / quantityPerShipment * 100);
      
      if (shipmentsToAdd > 0) {
        recommendation = `Increase number of shipments by ${shipmentsToAdd} (from ${shipment.shipments} to ${shipment.shipments + shipmentsToAdd} shipments) or increase quantity per shipment by approximately ${quantityIncreasePercent.toFixed(1)}%`;
      } else {
        recommendation = `Increase quantity per shipment by approximately ${shortagePercentage.toFixed(1)}% to meet estimated need`;
      }
      recommendationType = 'increase';
    } else if (needStatus === 'over-met' && estimatedMonthlyNeed === 0 && shipment) {
      // No estimated need but shipments are scheduled
      recommendation = `No usage detected in last 3 months. Consider reducing or eliminating shipments for this ingredient.`;
      recommendationType = 'reduce';
    } else {
      recommendation = 'No action necessary - scheduled shipments adequately meet estimated need';
      recommendationType = 'none';
    }

    return {
      dishUsage: pieData,
      monthlyUsage: monthlyUsageData,
      stackedAreaData,
      topDishesForChart,
      stats: {
        totalUsage: totalUsageAllMonths,
        averageMonthlyUsage,
        maxUsage,
        minUsage,
        topDish,
        topDishPercentage,
        unit: shipment?.unit || 'units',
        totalDishes: Object.keys(dishUsage).length
      },
      needAnalysis: {
        estimatedMonthlyNeed,
        scheduledShipmentAmount,
        needStatus,
        recommendation,
        recommendationType,
        difference,
        percentageDifference
      }
    };
  }, [selectedIngredient, menuItems, allMonthlyData, shipments]);

  // Get sort arrow icon
  const getSortArrow = (column: SortColumn) => {
    if (sortColumn !== column) {
      return (
        <span className="ml-1 text-gray-500 opacity-50">
          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </span>
      );
    }
    if (sortDirection === 'asc') {
      return (
        <span className="ml-1 text-gray-300">
          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </span>
      );
    } else {
      return (
        <span className="ml-1 text-gray-300">
          <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      );
    }
  };

  const COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444', '#a855f7', '#14b8a6', '#f97316', '#84cc16'];

  // Get available ingredients (excluding flour)
  const availableIngredients = useMemo(() => {
    return shipments
      .filter(s => s.name.toLowerCase() !== 'flour')
      .map(s => s.name)
      .sort();
  }, [shipments]);

  return (
    <div className="space-y-6">
      {/* Ingredient Analysis Section */}
      <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl p-6 shadow-xl">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-100 mb-2">Analyze Ingredient</h2>
          <p className="text-gray-400 text-sm mb-4">
            Select an ingredient to view detailed usage analysis across all dishes and months
          </p>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-300">Select Ingredient:</label>
            <select
              value={selectedIngredient}
              onChange={(e) => setSelectedIngredient(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none min-w-[200px]"
            >
              <option value="" className="bg-slate-800">-- Select Ingredient --</option>
              {availableIngredients.map((ingredient) => (
                <option key={ingredient} value={ingredient} className="bg-slate-800">
                  {ingredient}
                </option>
              ))}
            </select>
            {analyzingIngredient && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-400"></div>
                Loading data...
              </div>
            )}
          </div>
        </div>

        {ingredientAnalysis && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-pink-500/20 to-purple-500/20 backdrop-blur-lg border border-pink-400/30 p-4 rounded-xl">
                <p className="text-pink-300 text-xs font-medium mb-1">Total Usage</p>
                <p className="text-2xl font-bold text-pink-200">
                  {ingredientAnalysis.stats.totalUsage.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </p>
                <p className="text-pink-400 text-xs mt-1">{ingredientAnalysis.stats.unit}</p>
              </div>
              <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 backdrop-blur-lg border border-cyan-400/30 p-4 rounded-xl">
                <p className="text-cyan-300 text-xs font-medium mb-1">Avg Monthly</p>
                <p className="text-2xl font-bold text-cyan-200">
                  {ingredientAnalysis.stats.averageMonthlyUsage.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                </p>
                <p className="text-cyan-400 text-xs mt-1">{ingredientAnalysis.stats.unit}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-lg border border-green-400/30 p-4 rounded-xl">
                <p className="text-green-300 text-xs font-medium mb-1">Top Dish</p>
                <p className="text-lg font-bold text-green-200 truncate" title={ingredientAnalysis.stats.topDish}>
                  {ingredientAnalysis.stats.topDish}
                </p>
                <p className="text-green-400 text-xs mt-1">{ingredientAnalysis.stats.topDishPercentage.toFixed(1)}% of usage</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg border border-yellow-400/30 p-4 rounded-xl">
                <p className="text-yellow-300 text-xs font-medium mb-1">Total Dishes</p>
                <p className="text-2xl font-bold text-yellow-200">
                  {ingredientAnalysis.stats.totalDishes}
                </p>
                <p className="text-yellow-400 text-xs mt-1">different dishes</p>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart - Dish Usage Breakdown */}
              <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Usage by Dish (Pie Chart)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={ingredientAnalysis.dishUsage}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => `${entry.percentage.toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {ingredientAnalysis.dishUsage.map((entry, index) => (
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
                        const percentage = data.payload?.percentage ?? 0;
                        const sliceColor = data.color || '#cbd5e1';
                        
                        return (
                          <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
                            <p className="font-semibold mb-2" style={{ color: sliceColor }}>
                              {data.payload?.name || 'Unknown'}
                            </p>
                            <p className="text-sm text-gray-300">
                              {data.value?.toLocaleString(undefined, { maximumFractionDigits: 2 })} {ingredientAnalysis.stats.unit} ({percentage.toFixed(1)}%)
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Area Chart - Usage Trend by Dish */}
              <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Usage Trend (Area Chart)</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={ingredientAnalysis.stackedAreaData}>
                    <defs>
                      {ingredientAnalysis.topDishesForChart.map((dish, index) => {
                        const dishId = dish.replace(/[^a-zA-Z0-9]/g, ''); // Remove special characters for valid ID
                        return (
                          <linearGradient key={dish} id={`gradient-${dishId}-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                            <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.1}/>
                          </linearGradient>
                        );
                      })}
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
                      label={{ value: `Usage (${ingredientAnalysis.stats.unit})`, angle: -90, position: 'insideLeft', fill: '#cbd5e1' }}
                    />
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
                        
                        // Sort payload by value (largest first) for better display
                        const sortedPayload = [...payload].sort((a: any, b: any) => (b.value || 0) - (a.value || 0));
                        
                        return (
                          <div className="bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-lg">
                            <p className="font-semibold text-gray-200 mb-2 border-b border-slate-600 pb-1">
                              {payload[0].payload.month}
                            </p>
                            <div className="space-y-1 max-h-60 overflow-y-auto">
                              {sortedPayload.map((entry: any, index: number) => {
                                if (!entry.value || entry.value === 0) return null;
                                return (
                                  <div key={index} className="flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                      <div
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: entry.color }}
                                      />
                                      <span className="text-sm text-gray-300">{entry.name}</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-200">
                                      {entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} {ingredientAnalysis.stats.unit}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ color: '#cbd5e1', fontSize: '11px' }} />
                    {ingredientAnalysis.topDishesForChart.map((dish, index) => {
                      const dishId = dish.replace(/[^a-zA-Z0-9]/g, ''); // Remove special characters for valid ID
                      return (
                        <Area
                          key={dish}
                          type="monotone"
                          dataKey={dish}
                          stackId="1"
                          stroke={COLORS[index % COLORS.length]}
                          fill={`url(#gradient-${dishId}-${index})`}
                          fillOpacity={0.8}
                          name={dish}
                        />
                      );
                    })}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Need Analysis Section */}
            <div className="bg-slate-900/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-100 mb-6">Estimated Need Analysis</h3>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-lg border border-blue-400/30 p-4 rounded-xl">
                  <p className="text-blue-300 text-xs font-medium mb-1">Estimated Monthly Need</p>
                  <p className="text-2xl font-bold text-blue-200">
                    {ingredientAnalysis.needAnalysis.estimatedMonthlyNeed.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </p>
                  <p className="text-blue-400 text-xs mt-1">Based on previous trends</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-lg border border-purple-400/30 p-4 rounded-xl">
                  <p className="text-purple-300 text-xs font-medium mb-1">Scheduled Shipment</p>
                  <p className="text-2xl font-bold text-purple-200">
                    {ingredientAnalysis.needAnalysis.scheduledShipmentAmount.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                  </p>
                  <p className="text-purple-400 text-xs mt-1">{ingredientAnalysis.stats.unit} per month</p>
                </div>
                <div className={`backdrop-blur-lg border p-4 rounded-xl ${
                  ingredientAnalysis.needAnalysis.needStatus === 'met' 
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-400/30'
                    : ingredientAnalysis.needAnalysis.needStatus === 'over-met'
                    ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/30'
                    : 'bg-gradient-to-br from-red-500/20 to-pink-500/20 border-red-400/30'
                }`}>
                  <p className={`text-xs font-medium mb-1 ${
                    ingredientAnalysis.needAnalysis.needStatus === 'met' 
                      ? 'text-green-300'
                      : ingredientAnalysis.needAnalysis.needStatus === 'over-met'
                      ? 'text-yellow-300'
                      : 'text-red-300'
                  }`}>
                    Status
                  </p>
                  <p className={`text-2xl font-bold ${
                    ingredientAnalysis.needAnalysis.needStatus === 'met' 
                      ? 'text-green-200'
                      : ingredientAnalysis.needAnalysis.needStatus === 'over-met'
                      ? 'text-yellow-200'
                      : 'text-red-200'
                  }`}>
                    {ingredientAnalysis.needAnalysis.needStatus === 'met' 
                      ? 'Need Met'
                      : ingredientAnalysis.needAnalysis.needStatus === 'over-met'
                      ? 'Over-Met'
                      : 'Not Met'}
                  </p>
                  <p className={`text-xs mt-1 ${
                    ingredientAnalysis.needAnalysis.needStatus === 'met' 
                      ? 'text-green-400'
                      : ingredientAnalysis.needAnalysis.needStatus === 'over-met'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}>
                    {ingredientAnalysis.needAnalysis.difference > 0 
                      ? `+${ingredientAnalysis.needAnalysis.difference.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${ingredientAnalysis.stats.unit}`
                      : `${ingredientAnalysis.needAnalysis.difference.toLocaleString(undefined, { maximumFractionDigits: 1 })} ${ingredientAnalysis.stats.unit}`
                    } ({ingredientAnalysis.needAnalysis.percentageDifference > 0 ? '+' : ''}{ingredientAnalysis.needAnalysis.percentageDifference.toFixed(1)}%)
                  </p>
                </div>
              </div>

              {/* Recommendation */}
              <div className={`border-l-4 p-4 rounded-r-lg ${
                ingredientAnalysis.needAnalysis.recommendationType === 'reduce'
                  ? 'bg-yellow-500/10 border-yellow-400'
                  : ingredientAnalysis.needAnalysis.recommendationType === 'increase'
                  ? 'bg-red-500/10 border-red-400'
                  : 'bg-green-500/10 border-green-400'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 mt-1 ${
                    ingredientAnalysis.needAnalysis.recommendationType === 'reduce'
                      ? 'text-yellow-400'
                      : ingredientAnalysis.needAnalysis.recommendationType === 'increase'
                      ? 'text-red-400'
                      : 'text-green-400'
                  }`}>
                    {ingredientAnalysis.needAnalysis.recommendationType === 'reduce' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    )}
                    {ingredientAnalysis.needAnalysis.recommendationType === 'increase' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    )}
                    {ingredientAnalysis.needAnalysis.recommendationType === 'none' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold mb-1 ${
                      ingredientAnalysis.needAnalysis.recommendationType === 'reduce'
                        ? 'text-yellow-300'
                        : ingredientAnalysis.needAnalysis.recommendationType === 'increase'
                        ? 'text-red-300'
                        : 'text-green-300'
                    }`}>
                      Recommendation
                    </h4>
                    <p className={`text-sm ${
                      ingredientAnalysis.needAnalysis.recommendationType === 'reduce'
                        ? 'text-yellow-200'
                        : ingredientAnalysis.needAnalysis.recommendationType === 'increase'
                        ? 'text-red-200'
                        : 'text-green-200'
                    }`}>
                      {ingredientAnalysis.needAnalysis.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedIngredient && !analyzingIngredient && !ingredientAnalysis && (
          <div className="text-center py-12">
            <p className="text-gray-400">No usage data found for this ingredient.</p>
          </div>
        )}
      </div>

      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-100 mb-2">Shipment Statistics</h2>
        <p className="text-gray-400 text-sm">
          Monthly quantity calculation: Quantity per shipment × Number of shipments × Frequency multiplier
        </p>
      </div>

      {/* Month Selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-300">Select Month:</label>
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600 text-gray-100 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none"
        >
          <option value="" className="bg-slate-800">All Months</option>
          {availableMonths.map((month) => (
            <option key={month} value={month} className="bg-slate-800">
              {month}
            </option>
          ))}
        </select>
        {loading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-pink-400"></div>
            Loading...
          </div>
        )}
      </div>

      {/* Statistics Table - Scrollable with max 6 visible rows */}
      <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[330px] overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-slate-800 sticky top-0 z-10 shadow-lg">
                <tr>
                  <th 
                    className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase tracking-wider bg-slate-800 cursor-pointer hover:bg-slate-700 transition-colors select-none"
                    onClick={() => handleSort('ingredient')}
                  >
                    <div className="flex items-center">
                      Ingredient
                      {getSortArrow('ingredient')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-right text-xs font-medium text-pink-300 uppercase tracking-wider bg-slate-800 cursor-pointer hover:bg-slate-700 transition-colors select-none"
                    onClick={() => handleSort('quantityPerShipment')}
                  >
                    <div className="flex items-center justify-end">
                      Qty per Shipment
                      {getSortArrow('quantityPerShipment')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-right text-xs font-medium text-cyan-300 uppercase tracking-wider bg-slate-800 cursor-pointer hover:bg-slate-700 transition-colors select-none"
                    onClick={() => handleSort('numberOfShipments')}
                  >
                    <div className="flex items-center justify-end">
                      # of Shipments
                      {getSortArrow('numberOfShipments')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-center text-xs font-medium text-yellow-300 uppercase tracking-wider bg-slate-800 cursor-pointer hover:bg-slate-700 transition-colors select-none"
                    onClick={() => handleSort('frequency')}
                  >
                    <div className="flex items-center justify-center">
                      Frequency
                      {getSortArrow('frequency')}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 text-right text-xs font-medium text-green-300 uppercase tracking-wider bg-slate-800 cursor-pointer hover:bg-slate-700 transition-colors select-none"
                    onClick={() => handleSort('monthlyQuantity')}
                  >
                    <div className="flex items-center justify-end">
                      Monthly Quantity
                      {getSortArrow('monthlyQuantity')}
                    </div>
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider bg-slate-800">
                    Unit
                  </th>
                  {selectedMonth && (
                    <th 
                      className="px-4 py-2 text-right text-xs font-medium text-orange-300 uppercase tracking-wider bg-slate-800 cursor-pointer hover:bg-slate-700 transition-colors select-none"
                      onClick={() => handleSort('usagePercentage')}
                    >
                      <div className="flex items-center justify-end">
                        % Used
                        {getSortArrow('usagePercentage')}
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-slate-800/30 divide-y divide-slate-700/50">
                {sortedData.map((stat, index) => (
                  <tr key={index} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-200">
                      {stat.ingredient}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-pink-300 text-right">
                      {stat.quantityPerShipment.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-cyan-300 text-right">
                      {stat.numberOfShipments}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-yellow-300 text-center capitalize">
                      {stat.frequency}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-300 text-right font-semibold">
                      {stat.monthlyQuantity.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-400">
                      {stat.unit}
                    </td>
                    {selectedMonth && (
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                        {stat.usagePercentage !== null ? (
                          <span className={`font-semibold ${
                            stat.usagePercentage > 100 
                              ? 'text-red-400' 
                              : stat.usagePercentage > 80 
                              ? 'text-yellow-400' 
                              : 'text-orange-300'
                          }`}>
                            {stat.usagePercentage.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

