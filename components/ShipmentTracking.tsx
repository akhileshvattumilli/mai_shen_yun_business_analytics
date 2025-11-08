'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Ingredient } from '../lib/data-loader';

interface ShipmentTrackingProps {
  shipments: Ingredient[];
}

export default function ShipmentTracking({ shipments }: ShipmentTrackingProps) {
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Shipment Frequency by Ingredient</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={frequencyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              height={100}
              tick={{ fontSize: 10 }}
            />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="shipments" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Shipment Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry: any) => {
                const percent = entry.percent || 0;
                return `${entry.name}: ${(percent * 100).toFixed(0)}%`;
              }}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

