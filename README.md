# Mai Shan Yun Business Analytics Dashboard

A comprehensive business analytics dashboard for Mai Shan Yun restaurant that provides insights into sales, inventory, and operations to help optimize business decisions.

## Dashboard Purpose and Key Insights

The dashboard provides three main analytical views:

**Dashboard Tab**
- Monthly earnings overview with growth trends
- Quick insights including best sellers, items to consider replacing, and ingredients to order more
- Monthly earnings breakdown by category
- AI Business Assistant for answering business questions and getting market intelligence

**Inventory Analytics Tab**
- Ingredient usage analysis and trends
- Dish usage breakdown by ingredient
- Monthly usage trends and forecasts
- Estimated need analysis based on previous trends
- Shipment statistics and inventory levels

**Item Analytics Tab**
- Individual item performance metrics
- Sales and revenue trends over time
- Monthly revenue comparisons
- Product performance status and recommendations
- Ingredient breakdown for each item
- Multi-item comparison capabilities

Key insights the dashboard provides:
- Identify top performing menu items and underperforming items
- Track seasonal sales patterns and trends
- Monitor ingredient usage and forecast future needs
- Get recommendations for inventory management
- Understand customer preferences and buying patterns
- Analyze revenue by category and item
- Get market intelligence for ingredients and business decisions

## Datasets Used and Integration

The dashboard integrates the following data sources:

**Menu Items and Ingredients (MSY Data - Ingredient.csv)**
- Contains menu items and their ingredient requirements
- Maps each dish to specific ingredients and quantities
- Used to calculate ingredient usage based on sales

**Shipment Data (MSY Data - Shipment.csv)**
- Tracks ingredient shipments including quantity per shipment, units, and frequency
- Used for inventory level analysis and cost optimization
- Helps identify overstocked and understocked ingredients

**Monthly Sales Data (Excel files)**
- May_Data_Matrix (1).xlsx
- June_Data_Matrix.xlsx
- July_Data_Matrix (1).xlsx
- August_Data_Matrix (1).xlsx
- September_Data_Matrix.xlsx
- October_Data_Matrix_20251103_214000.xlsx

Each monthly file contains:
- Sheet 1: Category-level sales data with counts and amounts
- Sheet 2: Additional category sales data for detailed analysis
- Item-level sales data for individual menu item analysis

**Data Integration Process**
- Sales data is loaded from Excel files using XLSX library
- Menu items and ingredients are parsed from CSV using PapaParse
- Ingredient usage is calculated by multiplying menu item sales with ingredient requirements from the menu data
- Monthly trends are aggregated across all months to identify patterns
- Shipment data is matched with ingredient usage to calculate utilization percentages
- Category and item-level data are processed separately for different analytical views
- Unit conversions are handled where necessary (grams to pounds, etc.)

## Setup and Run Instructions

**Prerequisites**
- Node.js 18 or higher
- npm package manager

**Installation Steps**

1. Navigate to the project directory:
```
cd mai_shen_yun_business_analytics
```

2. Install dependencies:
```
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with your Google Gemini API key:
```
GOOGLE_GEMINI_API_KEY=your_api_key_here
```
Get your API key from https://makersuite.google.com/app/apikey

4. Ensure data files are in place:
All data files should be in the `public/data/` directory:
- MSY Data - Ingredient.csv
- MSY Data - Shipment.csv
- May_Data_Matrix (1).xlsx
- June_Data_Matrix.xlsx
- July_Data_Matrix (1).xlsx
- August_Data_Matrix (1).xlsx
- September_Data_Matrix.xlsx
- October_Data_Matrix_20251103_214000.xlsx

**Running the Application**

1. Start the development server:
```
npm run dev
```

2. Open your browser and navigate to:
```
http://localhost:3000
```

3. The dashboard will load and display all analytics and visualizations.

**Building for Production**

To create a production build:
```
npm run build
npm start
```

## Example Insights and Use Cases

**Use Case 1: Identifying Best Sellers**
The Quick Insights section on the Dashboard tab shows the top 3 best sellers for the current month. This helps identify which menu items are most popular and may need more inventory support.

**Use Case 2: Finding Underperforming Items**
The "Consider Replacing" section highlights items with 1 or fewer orders in the last 3 months. This helps identify menu items that may not be resonating with customers and could be replaced or removed.

**Use Case 3: Inventory Management**
The Inventory Analytics tab shows ingredient usage trends and estimated monthly needs. Managers can see which ingredients are being used most and forecast future requirements based on previous trends.

**Use Case 4: Seasonal Pattern Analysis**
The monthly earnings progression chart shows sales trends over time. The AI Assistant can explain seasonal dips, such as decreased sales in June and July due to students leaving for summer vacation in College Station, TX.

**Use Case 5: Ingredient Market Intelligence**
When asking about specific ingredients in the AI Business Assistant, the system provides market conditions, latest news affecting supply, cost trends, and recommendations. This helps with purchasing decisions and cost management.

**Use Case 6: Item Performance Tracking**
The Item Analytics tab allows tracking individual menu item performance over time. Managers can compare sales and revenue across multiple items to identify trends and make menu optimization decisions.

**Use Case 7: Category Revenue Analysis**
The Monthly Breakdown Analysis shows revenue by category, helping identify which categories contribute most to overall sales. The pie chart visualization groups smaller categories for easier analysis.

**Use Case 8: Inventory Optimization**
The Inventory Analytics tab calculates estimated monthly needs based on previous trends with a 10% buffer. This helps prevent shortages while avoiding overstocking.

**Use Case 9: Ingredient Usage by Dish**
The Analyze Ingredient feature shows which dishes use the most of a specific ingredient. This helps understand ingredient dependencies and plan for menu changes.

**Use Case 10: Multi-Item Comparison**
The Item Analytics tab allows selecting multiple items for comparison. This helps identify patterns across items and make data-driven decisions about menu changes.

## Technical Stack

- Next.js 16 (React framework)
- TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- PapaParse for CSV parsing
- XLSX for Excel file processing
- Google Gemini AI for business intelligence
- React Markdown for formatted text rendering

## Project Structure

- app/: Next.js application files including API routes
- components/: React components for dashboard views
- lib/: Data loading and analytics utilities
- public/data/: Data files (CSV and Excel)
- app/api/chat/: AI chat API endpoint

## Environment Variables

- GOOGLE_GEMINI_API_KEY: Required for AI Business Assistant functionality
