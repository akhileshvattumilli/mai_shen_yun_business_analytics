import Papa from 'papaparse';

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
    { file: 'May_Data_Matrix (1).csv', month: 'May' },
    { file: 'June_Data_Matrix.csv', month: 'June' },
    { file: 'July_Data_Matrix (1).csv', month: 'July' },
    { file: 'August_Data_Matrix (1).csv', month: 'August' },
    { file: 'September_Data_Matrix.csv', month: 'September' },
    { file: 'October_Data_Matrix_20251103_214000.csv', month: 'October' },
  ];

  const allSales: SalesData[] = [];

  for (const { file, month } of months) {
    try {
      const response = await fetch(`/data/${file}`);
      const text = await response.text();
      await new Promise<void>((resolve) => {
        Papa.parse(text, {
          header: true,
          complete: (results) => {
            results.data.forEach((row: any) => {
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
            resolve();
          },
        });
      });
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
    }
  }

  return allSales;
}

