import { MenuItem, SalesData, Ingredient } from './data-loader';

export interface IngredientUsage {
  ingredient: string;
  totalUsage: number;
  unit: string;
}

export interface MonthlyIngredientUsage {
  month: string;
  usage: Record<string, number>;
}

// Mapping between sales categories and menu items
const categoryToMenuItems: Record<string, string[]> = {
  'Ramen': ['Beef Ramen', 'Pork Ramen', 'Chicken Ramen'],
  'Tossed Ramen': ['Beef Tossed Ramen', 'Pork Tossed Ramen', 'Chicken Tossed Ramen'],
  'Fried Rice': ['Beef Fried Rice', 'Pork Fried Rice', 'Chicken Fried Rice'],
  'Rice Noodle': ['Beef Rice Noodle Soup', 'Pork Rice Noodle Soup', 'Chicken Rice Noodle Soup'],
  'Tossed Rice Noodle': ['Beef Tossed Rice Noodles', 'Pork Tossed Rice Noodles', 'Chicken Tossed Rice Noodles'],
  'Fried Chicken': ['Fried Wings', 'Chicken Cutlet'],
  'All Day Menu': [
    'Beef Tossed Ramen', 'Beef Ramen', 'Beef Fried Rice', 'Pork Fried Rice',
    'Chicken Fried Rice', 'Fried Wings', 'Pork Tossed Ramen', 'Pork Ramen',
    'Chicken Tossed Ramen', 'Chicken Ramen', 'Chicken Cutlet',
    'Beef Tossed Rice Noodles', 'Pork Tossed Rice Noodles', 'Chicken Tossed Rice Noodles',
    'Beef Rice Noodle Soup', 'Pork Rice Noodle Soup', 'Chicken Rice Noodle Soup'
  ],
  'Lunch Menu': [
    'Beef Fried Rice', 'Pork Fried Rice', 'Chicken Fried Rice',
    'Beef Ramen', 'Pork Ramen', 'Chicken Ramen'
  ],
};

function getMenuItemsForCategory(category: string, allMenuItems: MenuItem[]): MenuItem[] {
  const categoryLower = category.toLowerCase();
  
  // Check exact mapping first
  for (const [key, itemNames] of Object.entries(categoryToMenuItems)) {
    if (categoryLower.includes(key.toLowerCase())) {
      return allMenuItems.filter(item => itemNames.includes(item.itemName));
    }
  }
  
  // Fallback to pattern matching
  return allMenuItems.filter(item => {
    const itemLower = item.itemName.toLowerCase();
    if (categoryLower.includes('ramen') && itemLower.includes('ramen')) return true;
    if (categoryLower.includes('rice') && itemLower.includes('rice') && !itemLower.includes('noodle')) return true;
    if (categoryLower.includes('noodle') && itemLower.includes('noodle')) return true;
    if (categoryLower.includes('chicken') && (itemLower.includes('chicken') || itemLower.includes('wing'))) return true;
    if (categoryLower.includes('fried') && itemLower.includes('fried')) return true;
    return false;
  });
}

export function calculateIngredientUsage(
  menuItems: MenuItem[],
  salesData: SalesData[]
): MonthlyIngredientUsage[] {
  const monthlyUsage: Record<string, Record<string, number>> = {};

  salesData.forEach((sale) => {
    if (!monthlyUsage[sale.month]) {
      monthlyUsage[sale.month] = {};
    }

    // Skip non-food categories
    if (sale.category.includes('Gift Card') || sale.category.includes('Drink') || 
        sale.category.includes('Milk Tea') || sale.category.includes('Fruit Tea') ||
        sale.category.includes('Signature Drinks') || sale.category.includes('Bingsu') ||
        sale.category.includes('Dessert') || sale.category.includes('Appetizer') ||
        sale.category.includes('Wonton') || sale.category.includes('Special Offer') ||
        sale.category.includes('Combo') || sale.category.includes('Jas-Lemonade')) {
      return;
    }

    const matchingItems = getMenuItemsForCategory(sale.category, menuItems);
    
    if (matchingItems.length > 0) {
      // Distribute sales count evenly among matching items
      const countPerItem = sale.count / matchingItems.length;
      
      matchingItems.forEach((item) => {
        Object.entries(item.ingredients).forEach(([ingredient, amount]) => {
          if (amount > 0) {
            monthlyUsage[sale.month][ingredient] =
              (monthlyUsage[sale.month][ingredient] || 0) + amount * countPerItem;
          }
        });
      });
    }
  });

  return Object.entries(monthlyUsage).map(([month, usage]) => ({
    month,
    usage,
  }));
}

export function getTopIngredients(
  monthlyUsage: MonthlyIngredientUsage[],
  limit: number = 10
): IngredientUsage[] {
  const totalUsage: Record<string, number> = {};

  monthlyUsage.forEach((monthData) => {
    Object.entries(monthData.usage).forEach(([ingredient, amount]) => {
      totalUsage[ingredient] = (totalUsage[ingredient] || 0) + amount;
    });
  });

  return Object.entries(totalUsage)
    .map(([ingredient, totalUsage]) => ({
      ingredient,
      totalUsage,
      unit: getUnit(ingredient),
    }))
    .sort((a, b) => b.totalUsage - a.totalUsage)
    .slice(0, limit);
}

export function getLeastUsedIngredients(
  monthlyUsage: MonthlyIngredientUsage[],
  limit: number = 10
): IngredientUsage[] {
  const totalUsage: Record<string, number> = {};

  monthlyUsage.forEach((monthData) => {
    Object.entries(monthData.usage).forEach(([ingredient, amount]) => {
      totalUsage[ingredient] = (totalUsage[ingredient] || 0) + amount;
    });
  });

  return Object.entries(totalUsage)
    .map(([ingredient, totalUsage]) => ({
      ingredient,
      totalUsage,
      unit: getUnit(ingredient),
    }))
    .sort((a, b) => a.totalUsage - b.totalUsage)
    .filter((item) => item.totalUsage > 0)
    .slice(0, limit);
}

function getUnit(ingredient: string): string {
  if (ingredient.includes('(g)')) return 'g';
  if (ingredient.includes('(count)')) return 'count';
  if (ingredient.includes('(pcs)')) return 'pcs';
  return 'units';
}

export function predictNextMonthUsage(
  monthlyUsage: MonthlyIngredientUsage[]
): Record<string, number> {
  const ingredientTrends: Record<string, number[]> = {};

  monthlyUsage.forEach((monthData) => {
    Object.entries(monthData.usage).forEach(([ingredient, amount]) => {
      if (!ingredientTrends[ingredient]) {
        ingredientTrends[ingredient] = [];
      }
      ingredientTrends[ingredient].push(amount);
    });
  });

  const predictions: Record<string, number> = {};

  Object.entries(ingredientTrends).forEach(([ingredient, amounts]) => {
    if (amounts.length >= 2) {
      const recent = amounts.slice(-3);
      const average = recent.reduce((a, b) => a + b, 0) / recent.length;
      const trend = amounts.length >= 2
        ? (amounts[amounts.length - 1] - amounts[0]) / amounts.length
        : 0;
      predictions[ingredient] = Math.max(0, average + trend);
    } else if (amounts.length === 1) {
      predictions[ingredient] = amounts[0];
    }
  });

  return predictions;
}

// Map ingredient names from menu items to shipment names
const ingredientToShipmentMap: Record<string, string> = {
  'braised beef used (g)': 'Beef',
  'Braised Chicken(g)': 'Chicken',
  'Braised Pork(g)': 'Chicken', // No pork in shipments, using chicken as proxy
  'Rice(g)': 'Rice',
  'Ramen (count)': 'Ramen',
  'Rice Noodles(g)': 'Rice Noodles',
  'flour (g)': 'Flour',
  'Tapioca Starch': 'Tapioca Starch',
  'Green Onion': 'Green Onion',
  'White onion': 'White Onion',
  'Cilantro': 'Cilantro',
  'Peas(g)': 'Peas + Carrot',
  'Carrot(g)': 'Peas + Carrot',
  'Boychoy(g)': 'Bokchoy',
  'Chicken Wings (pcs)': 'Chicken Wings',
  'Egg(count)': 'Egg',
};

function findShipmentForIngredient(ingredient: string, shipments: Ingredient[]): Ingredient | null {
  // First try exact mapping
  const mappedName = ingredientToShipmentMap[ingredient];
  if (mappedName) {
    const found = shipments.find(s => s.name === mappedName);
    if (found) return found;
  }

  // Try partial matching
  const ingredientLower = ingredient.toLowerCase();
  for (const ship of shipments) {
    const shipLower = ship.name.toLowerCase();
    if (ingredientLower.includes(shipLower) || shipLower.includes(ingredientLower.split(' ')[0])) {
      return ship;
    }
  }

  // Try matching key words
  if (ingredientLower.includes('beef')) {
    return shipments.find(s => s.name.toLowerCase().includes('beef')) || null;
  }
  if (ingredientLower.includes('chicken') && !ingredientLower.includes('wing')) {
    return shipments.find(s => s.name.toLowerCase().includes('chicken') && !s.name.toLowerCase().includes('wing')) || null;
  }
  if (ingredientLower.includes('rice') && !ingredientLower.includes('noodle')) {
    return shipments.find(s => s.name.toLowerCase().includes('rice') && !s.name.toLowerCase().includes('noodle')) || null;
  }

  return null;
}

export function calculateCostOptimization(
  monthlyUsage: MonthlyIngredientUsage[],
  shipments: Ingredient[]
): Array<{ ingredient: string; costPerUnit: number; recommendation: string }> {
  const totalUsage: Record<string, number> = {};
  monthlyUsage.forEach((monthData) => {
    Object.entries(monthData.usage).forEach(([ingredient, amount]) => {
      totalUsage[ingredient] = (totalUsage[ingredient] || 0) + amount;
    });
  });

  // Calculate average monthly usage
  const avgMonthlyUsage: Record<string, number> = {};
  Object.entries(totalUsage).forEach(([ingredient, total]) => {
    avgMonthlyUsage[ingredient] = total / monthlyUsage.length;
  });

  return Object.entries(avgMonthlyUsage)
    .map(([ingredient, avgUsage]) => {
      const shipment = findShipmentForIngredient(ingredient, shipments);
      if (!shipment) {
        return {
          ingredient: ingredient.replace(/\([^)]*\)/g, '').trim(),
          costPerUnit: 0,
          recommendation: 'No shipment data available',
        };
      }

      // Calculate monthly shipment quantity based on frequency
      let monthlyShipment = 0;
      const freq = shipment.frequency.toLowerCase();
      if (freq.includes('weekly')) {
        monthlyShipment = shipment.quantity * shipment.shipments * 4; // Approximate 4 weeks
      } else if (freq.includes('biweekly')) {
        monthlyShipment = shipment.quantity * shipment.shipments * 2;
      } else if (freq.includes('monthly')) {
        monthlyShipment = shipment.quantity * shipment.shipments;
      } else {
        monthlyShipment = shipment.quantity * shipment.shipments;
      }

      // Convert units if needed (this is a simplification)
      let usage = avgUsage;
      if (ingredient.includes('(g)') && shipment.unit === 'lbs') {
        usage = usage / 453.592; // Convert grams to pounds
      } else if (ingredient.includes('(count)') && shipment.unit === 'eggs') {
        // Already in count
      } else if (ingredient.includes('(pcs)') && shipment.unit === 'pieces') {
        // Already in pieces
      }

      const utilization = monthlyShipment > 0 ? (usage / monthlyShipment) * 100 : 0;

      let recommendation = 'Optimal';
      if (utilization < 50 && monthlyShipment > 0) {
        recommendation = 'Reduce shipments - overstocked';
      } else if (utilization > 90) {
        recommendation = 'Increase shipments - risk of shortage';
      } else if (monthlyShipment === 0) {
        recommendation = 'No shipment data available';
      }

      return {
        ingredient: ingredient.replace(/\([^)]*\)/g, '').trim(),
        costPerUnit: utilization,
        recommendation,
      };
    })
    .filter(item => item.recommendation !== 'No shipment data available' || item.costPerUnit > 0)
    .sort((a, b) => Math.abs(b.costPerUnit - 50) - Math.abs(a.costPerUnit - 50)); // Sort by deviation from optimal
}

