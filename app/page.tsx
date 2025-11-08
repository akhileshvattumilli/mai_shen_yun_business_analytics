'use client';

import { useEffect, useState } from 'react';
import { loadMenuItems, loadShipments, loadSalesData } from '../lib/data-loader';
import {
  calculateIngredientUsage,
  getTopIngredients,
  getLeastUsedIngredients,
  predictNextMonthUsage,
  calculateCostOptimization,
  MonthlyIngredientUsage,
} from '../lib/analytics';
import IngredientInsights from '../components/IngredientInsights';
import MonthlyTrends from '../components/MonthlyTrends';
import ShipmentTracking from '../components/ShipmentTracking';
import PredictiveAnalytics from '../components/PredictiveAnalytics';
import CostOptimization from '../components/CostOptimization';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyIngredientUsage[]>([]);
  const [topIngredients, setTopIngredients] = useState<any[]>([]);
  const [leastUsedIngredients, setLeastUsedIngredients] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<string, number>>({});
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [menuItems, shipmentsData, salesData] = await Promise.all([
          loadMenuItems(),
          loadShipments(),
          loadSalesData(),
        ]);

        const usage = calculateIngredientUsage(menuItems, salesData);
        const top = getTopIngredients(usage, 10);
        const least = getLeastUsedIngredients(usage, 10);
        const pred = predictNextMonthUsage(usage);
        const recs = calculateCostOptimization(usage, shipmentsData);

        setMonthlyUsage(usage);
        setTopIngredients(top);
        setLeastUsedIngredients(least);
        setShipments(shipmentsData);
        setPredictions(pred);
        setRecommendations(recs);
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Mai Shan Yun Inventory Intelligence Dashboard
          </h1>
          <p className="mt-2 text-gray-600">
            Transform raw restaurant data into actionable intelligence
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Ingredient Insights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Ingredient Insights</h2>
            <IngredientInsights
              topIngredients={topIngredients}
              leastUsedIngredients={leastUsedIngredients}
            />
          </section>

          {/* Monthly Trends */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Monthly Usage Trends</h2>
            <MonthlyTrends monthlyUsage={monthlyUsage} />
          </section>

          {/* Shipment Tracking */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Shipment Tracking</h2>
            <ShipmentTracking shipments={shipments} />
          </section>

          {/* Predictive Analytics */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Predictive Analytics</h2>
            <PredictiveAnalytics predictions={predictions} />
          </section>

          {/* Cost Optimization */}
          <section>
            <h2 className="text-2xl font-semibold mb-4">Cost Optimization</h2>
            <CostOptimization recommendations={recommendations} />
          </section>
        </div>
      </main>
    </div>
  );
}
