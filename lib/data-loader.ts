import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
  shipments: number;
  frequency: string;
}

export interface MenuItem {
  itemName: string;
  ingredients: Record<string, number>;
}

export interface SalesData {
  month: string;
  category: string;
  count: number;
  amount: number;
}

export interface MonthlyEarnings {
  month: string;
  totalEarnings: number;
  transactionCount: number;
}

export interface MonthlyCategoryEarnings {
  month: string;
  categories: Record<string, number>;
}

export async function loadMenuItems(): Promise<MenuItem[]> {
  const response = await fetch('/data/MSY Data - Ingredient.csv');
  const text = await response.text();
  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true,
      complete: (results) => {
        const menuItems: MenuItem[] = results.data
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
        resolve(menuItems);
      },
    });
  });
}

export async function loadShipments(): Promise<Ingredient[]> {
  const response = await fetch('/data/MSY Data - Shipment.csv');
  const text = await response.text();
  return new Promise((resolve) => {
    Papa.parse(text, {
      header: true,
      complete: (results) => {
        const shipments: Ingredient[] = results.data
          .filter((row: any) => row.Ingredient)
          .map((row: any) => ({
            name: row.Ingredient,
            quantity: parseFloat(row['Quantity per shipment']) || 0,
            unit: row['Unit of shipment'],
            shipments: parseInt(row['Number of shipments']) || 0,
            frequency: row.frequency,
          }));
        resolve(shipments);
      },
    });
  });
}

export async function loadSalesData(): Promise<SalesData[]> {
  const months = [
    { file: 'May_Data_Matrix (1).xlsx', month: 'May' },
    { file: 'June_Data_Matrix.xlsx', month: 'June' },
    { file: 'July_Data_Matrix (1).xlsx', month: 'July' },
    { file: 'August_Data_Matrix (1).xlsx', month: 'August' },
    { file: 'September_Data_Matrix.xlsx', month: 'September' },
    { file: 'October_Data_Matrix_20251103_214000.xlsx', month: 'October' },
  ];

  const allSales: SalesData[] = [];

  for (const { file, month } of months) {
    try {
      const response = await fetch(`/data/${file}`);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      jsonData.forEach((row: any) => {
        const category = row.Category || row.Group || 'Unknown';
        const countStr = (row.Count || '0').toString().replace(/,/g, '');
        const amountStr = (row.Amount || '$0')
          .toString()
          .replace(/[$,]/g, '');
        allSales.push({
          month,
          category,
          count: parseInt(countStr) || 0,
          amount: parseFloat(amountStr) || 0,
        });
      });
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
    }
  }

  return allSales;
}

export async function loadMonthlyEarnings(): Promise<MonthlyEarnings[]> {
  const months = [
    { file: 'May_Data_Matrix (1).xlsx', month: 'May' },
    { file: 'June_Data_Matrix.xlsx', month: 'June' },
    { file: 'July_Data_Matrix (1).xlsx', month: 'July' },
    { file: 'August_Data_Matrix (1).xlsx', month: 'August' },
    { file: 'September_Data_Matrix.xlsx', month: 'September' },
    { file: 'October_Data_Matrix_20251103_214000.xlsx', month: 'October' },
  ];

  const monthlyEarnings: MonthlyEarnings[] = [];

  for (const { file, month } of months) {
    try {
      const response = await fetch(`/data/${file}`);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get the first sheet only
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      let totalEarnings = 0;
      let totalCount = 0;
      
      jsonData.forEach((row: any) => {
        const amountStr = (row.Amount || '$0')
          .toString()
          .replace(/[$,]/g, '');
        const countStr = (row.Count || '0').toString().replace(/,/g, '');
        
        totalEarnings += parseFloat(amountStr) || 0;
        totalCount += parseInt(countStr) || 0;
      });
      
      monthlyEarnings.push({
        month,
        totalEarnings,
        transactionCount: totalCount,
      });
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
    }
  }

  // Sort by month order
  const monthOrder = ['May', 'June', 'July', 'August', 'September', 'October'];
  return monthlyEarnings.sort((a, b) => 
    monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
  );
}

export async function loadMonthlyCategoryEarnings(): Promise<MonthlyCategoryEarnings[]> {
  const months = [
    { file: 'May_Data_Matrix (1).xlsx', month: 'May' },
    { file: 'June_Data_Matrix.xlsx', month: 'June' },
    { file: 'July_Data_Matrix (1).xlsx', month: 'July' },
    { file: 'August_Data_Matrix (1).xlsx', month: 'August' },
    { file: 'September_Data_Matrix.xlsx', month: 'September' },
    { file: 'October_Data_Matrix_20251103_214000.xlsx', month: 'October' },
  ];

  const monthlyCategoryEarnings: MonthlyCategoryEarnings[] = [];

  for (const { file, month } of months) {
    try {
      const response = await fetch(`/data/${file}`);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get the first sheet only
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      const categories: Record<string, number> = {};
      
      jsonData.forEach((row: any) => {
        const category = row.Category || row.Group || 'Unknown';
        if (category && category !== 'Unknown') {
          const amountStr = (row.Amount || '$0')
            .toString()
            .replace(/[$,]/g, '');
          const amount = parseFloat(amountStr) || 0;
          
          categories[category] = (categories[category] || 0) + amount;
        }
      });
      
      monthlyCategoryEarnings.push({
        month,
        categories,
      });
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
    }
  }

  // Sort by month order
  const monthOrder = ['May', 'June', 'July', 'August', 'September', 'October'];
  return monthlyCategoryEarnings.sort((a, b) => 
    monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
  );
}

export async function loadMonthlyCategoryEarningsSheet2(): Promise<MonthlyCategoryEarnings[]> {
  const months = [
    { file: 'May_Data_Matrix (1).xlsx', month: 'May' },
    { file: 'June_Data_Matrix.xlsx', month: 'June' },
    { file: 'July_Data_Matrix (1).xlsx', month: 'July' },
    { file: 'August_Data_Matrix (1).xlsx', month: 'August' },
    { file: 'September_Data_Matrix.xlsx', month: 'September' },
    { file: 'October_Data_Matrix_20251103_214000.xlsx', month: 'October' },
  ];

  const monthlyCategoryEarnings: MonthlyCategoryEarnings[] = [];

  for (const { file, month } of months) {
    try {
      const response = await fetch(`/data/${file}`);
      const arrayBuffer = await response.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Get the second sheet (index 1) if it exists, otherwise use first sheet
      const sheetIndex = workbook.SheetNames.length > 1 ? 1 : 0;
      const sheetName = workbook.SheetNames[sheetIndex];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      const categories: Record<string, number> = {};
      
      jsonData.forEach((row: any) => {
        const category = row.Category || row.Group || row.Item || row['Item Name'] || 'Unknown';
        if (category && category !== 'Unknown') {
          const amountStr = (row.Amount || row.Price || row['Total Amount'] || '$0')
            .toString()
            .replace(/[$,]/g, '');
          const amount = parseFloat(amountStr) || 0;
          
          categories[category] = (categories[category] || 0) + amount;
        }
      });
      
      monthlyCategoryEarnings.push({
        month,
        categories,
      });
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
    }
  }

  // Sort by month order
  const monthOrder = ['May', 'June', 'July', 'August', 'September', 'October'];
  return monthlyCategoryEarnings.sort((a, b) => 
    monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month)
  );
}

