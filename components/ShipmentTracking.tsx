'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Ingredient } from '../lib/data-loader';

interface ShipmentTrackingProps {
  shipments: Ingredient[];
}

export default function ShipmentTracking({ shipments }: ShipmentTrackingProps) {
  const COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#ef4444'];

  const frequencyData = shipments.map((ship) => ({
    name: ship.name,
    shipments: ship.shipments,
    frequency: ship.frequency,
  }));

  const pieData = shipments.map((ship) => ({
    name: ship.name,
    value: ship.shipments,
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl shadow-xl">
        <h3 className="text-xl font-semibold mb-4 text-gray-100">Shipment Frequency by Ingredient</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={frequencyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              tick={{ fontSize: 10, fill: '#cbd5e1' }}
              stroke="#94a3b8"
            />
            <YAxis stroke="#94a3b8" tick={{ fill: '#cbd5e1' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#cbd5e1'
              }}
            />
            <Legend wrapperStyle={{ color: '#cbd5e1' }} />
            <Bar dataKey="shipments" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl shadow-xl">
        <h3 className="text-xl font-semibold mb-4 text-gray-100">Shipment Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => {
                const percent = entry.percent || 0;
                if (percent < 0.05) return ''; // Hide small labels
                return `${entry.name}: ${(percent * 100).toFixed(0)}%`;
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              style={{ fontSize: '12px', fill: '#cbd5e1' }}
            >
              {pieData.map((entry, index) => (
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
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

