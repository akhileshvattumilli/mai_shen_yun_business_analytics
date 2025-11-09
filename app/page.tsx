'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { loadMenuItems, loadShipments, loadSalesData, loadMonthlyEarnings, loadMonthlyCategoryEarnings, loadMonthlyCategoryEarningsSheet2 } from '../lib/data-loader';
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
import DashboardOverview from '../components/DashboardOverview';
import Tabs from '../components/Tabs';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [monthlyEarnings, setMonthlyEarnings] = useState<any[]>([]);
  const [monthlyCategoryEarnings, setMonthlyCategoryEarnings] = useState<any[]>([]);
  const [monthlyCategoryEarningsSheet2, setMonthlyCategoryEarningsSheet2] = useState<any[]>([]);
  const [monthlyUsage, setMonthlyUsage] = useState<MonthlyIngredientUsage[]>([]);
  const [topIngredients, setTopIngredients] = useState<any[]>([]);
  const [leastUsedIngredients, setLeastUsedIngredients] = useState<any[]>([]);
  const [shipments, setShipments] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<string, number>>({});
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [earnings, categoryEarnings, categoryEarningsSheet2, menuItems, shipmentsData, salesData] = await Promise.all([
          loadMonthlyEarnings(),
          loadMonthlyCategoryEarnings(),
          loadMonthlyCategoryEarningsSheet2(),
          loadMenuItems(),
          loadShipments(),
          loadSalesData(),
        ]);

        const usage = calculateIngredientUsage(menuItems, salesData);
        const top = getTopIngredients(usage, 10);
        const least = getLeastUsedIngredients(usage, 10);
        const pred = predictNextMonthUsage(usage);
        const recs = calculateCostOptimization(usage, shipmentsData);

        setMonthlyEarnings(earnings);
        setMonthlyCategoryEarnings(categoryEarnings);
        setMonthlyCategoryEarningsSheet2(categoryEarningsSheet2);
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      content: (
        <div>
          <DashboardOverview 
            monthlyEarnings={monthlyEarnings} 
            monthlyCategoryEarnings={monthlyCategoryEarnings}
            monthlyCategoryEarningsSheet2={monthlyCategoryEarningsSheet2}
          />
        </div>
      ),
    },
    {
      id: 'inventory',
      label: 'Inventory Analytics',
      content: (
        <div className="space-y-8">
          {/* Ingredient Insights */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-100">Ingredient Insights</h2>
            <IngredientInsights
              topIngredients={topIngredients}
              leastUsedIngredients={leastUsedIngredients}
            />
          </section>

          {/* Monthly Trends */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-100">Monthly Usage Trends</h2>
            <MonthlyTrends monthlyUsage={monthlyUsage} />
          </section>

          {/* Shipment Tracking */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-100">Shipment Tracking</h2>
            <ShipmentTracking shipments={shipments} />
          </section>

          {/* Predictive Analytics */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-100">Predictive Analytics</h2>
            <PredictiveAnalytics predictions={predictions} />
          </section>

          {/* Cost Optimization */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-100">Cost Optimization</h2>
            <CostOptimization recommendations={recommendations} />
          </section>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <header className="bg-slate-800/50 backdrop-blur-lg border-b border-slate-700/50 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              <img
                src="/MSY_logo.png"
                alt="Mai Shan Yun Logo"
                width={250}
                height={91}
                className="object-contain drop-shadow-lg"
                style={{ maxWidth: '250px', height: 'auto' }}
              />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Business Analytics Dashboard
              </h1>
              <p className="mt-2 text-gray-300">
                Transform raw restaurant data into actionable intelligence
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </main>
    </div>
  );
}
