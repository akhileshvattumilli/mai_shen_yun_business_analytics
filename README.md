# Mai Shan Yun Inventory Intelligence Dashboard

A data-powered inventory management dashboard that provides restaurant managers with insights into their operations, helping optimize inventory by minimizing waste, avoiding shortages, and predicting when to restock ingredients.

## Dashboard Purpose

This dashboard transforms raw restaurant data into actionable intelligence by:
- Tracking ingredient usage patterns and identifying top-used and least-used ingredients
- Visualizing monthly trends in ingredient consumption
- Monitoring shipment frequencies and patterns
- Predicting future ingredient needs based on historical patterns
- Providing cost optimization recommendations to identify overstocked items and potential shortages

## Key Features

### 1. Ingredient Insights
- **Top Used Ingredients**: Visual bar chart showing the most frequently used ingredients across all months
- **Least Used Ingredients**: Identifies ingredients with low usage to help optimize inventory

### 2. Monthly Usage Trends
- Interactive line chart displaying usage trends for top ingredients over time (May - October)
- Helps identify seasonal patterns and consumption trends

### 3. Shipment Tracking
- Bar chart showing shipment frequency by ingredient
- Pie chart visualizing shipment distribution
- Helps track delivery patterns and frequency

### 4. Predictive Analytics
- Forecasts next month's ingredient usage based on historical trend analysis
- Uses moving averages and trend calculations to predict future demand
- Helps plan inventory restocking

### 5. Cost Optimization
- Identifies ingredients at risk of shortage (utilization > 90%)
- Highlights overstocked items (utilization < 50%)
- Shows optimal inventory levels
- Provides actionable recommendations for inventory management

## Datasets Used

The dashboard integrates multiple data sources:

1. **Menu Items & Ingredient Usage** (`MSY Data - Ingredient.csv`)
   - Contains menu items and their ingredient requirements
   - Maps each dish to the ingredients and quantities needed

2. **Shipment Data** (`MSY Data - Shipment.csv`)
   - Tracks ingredient shipments including quantity, frequency, and number of shipments
   - Used for cost optimization and inventory level analysis

3. **Monthly Sales Data** (May - October CSV files)
   - May_Data_Matrix (1).csv
   - June_Data_Matrix.csv
   - July_Data_Matrix (1).csv
   - August_Data_Matrix (1).csv
   - September_Data_Matrix.csv
   - October_Data_Matrix_20251103_214000.csv
   - Contains sales counts and amounts by category for each month
   - Used to calculate ingredient consumption based on menu item sales

### Data Integration

The dashboard:
- Maps sales categories to specific menu items
- Calculates ingredient usage by multiplying menu item sales with ingredient requirements
- Aggregates usage across months to identify trends
- Matches ingredient names between menu items and shipment data for optimization analysis
- Handles unit conversions (grams to pounds, etc.) where necessary

## Setup and Run Instructions

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository or navigate to the project directory:
```bash
cd mai_shen_yun_business_analytics
```

2. Install dependencies:
```bash
npm install
```

3. Ensure data files are in the `public/data/` directory:
   - MSY Data - Ingredient.csv
   - MSY Data - Shipment.csv
   - May_Data_Matrix (1).csv
   - June_Data_Matrix.csv
   - July_Data_Matrix (1).csv
   - August_Data_Matrix (1).csv
   - September_Data_Matrix.csv
   - October_Data_Matrix_20251103_214000.csv

### Running the Dashboard

1. Start the development server:
```bash
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. The dashboard will load and display all visualizations and insights.

### Building for Production

To create an optimized production build:
```bash
npm run build
npm start
```

## Example Insights and Use Cases

### Use Case 1: Identifying Overstocked Ingredients
The Cost Optimization section highlights ingredients with utilization below 50%, indicating they are overstocked. Managers can use this to reduce shipment frequency and minimize waste.

### Use Case 2: Preventing Shortages
Ingredients with utilization above 90% are flagged as at risk of shortage. Managers can proactively increase shipment quantities or frequency to avoid running out.

### Use Case 3: Planning Future Inventory
The Predictive Analytics section forecasts next month's ingredient needs based on historical trends, helping managers plan purchases in advance.

### Use Case 4: Understanding Consumption Patterns
The Monthly Usage Trends chart shows how ingredient consumption changes over time, helping identify seasonal patterns or changes in menu popularity.

### Use Case 5: Optimizing Shipment Schedules
The Shipment Tracking section visualizes current shipment frequencies, helping managers evaluate if adjustments are needed based on actual usage patterns.

## Technical Stack

- **Framework**: Next.js 16 (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Data Processing**: PapaParse (CSV parsing)

## Project Structure

```
mai_shen_yun_business_analytics/
├── app/
│   ├── page.tsx          # Main dashboard page
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── components/
│   ├── IngredientInsights.tsx    # Top/least used ingredients
│   ├── MonthlyTrends.tsx         # Monthly usage trends
│   ├── ShipmentTracking.tsx      # Shipment visualizations
│   ├── PredictiveAnalytics.tsx   # Demand forecasting
│   └── CostOptimization.tsx      # Optimization recommendations
├── lib/
│   ├── data-loader.ts    # CSV data loading utilities
│   └── analytics.ts      # Data analysis and calculations
└── public/
    └── data/             # CSV data files
```

## Future Enhancements

Potential improvements for the dashboard:
- Real-time data updates
- Export functionality for reports
- Custom date range selection
- Ingredient-level drill-down views
- Alert notifications for critical inventory levels
- Integration with ordering systems
