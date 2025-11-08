'use client';

interface CostOptimizationProps {
  recommendations: Array<{ ingredient: string; costPerUnit: number; recommendation: string }>;
}

export default function CostOptimization({ recommendations }: CostOptimizationProps) {
  const overstocked = recommendations.filter((r) => r.recommendation.includes('overstocked'));
  const atRisk = recommendations.filter((r) => r.recommendation.includes('shortage'));
  const optimal = recommendations.filter((r) => r.recommendation === 'Optimal');

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">Cost Optimization Recommendations</h3>
      
      {atRisk.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-red-600 mb-2">⚠️ Risk of Shortage</h4>
          <div className="space-y-2">
            {atRisk.slice(0, 5).map((rec, idx) => (
              <div key={idx} className="p-3 bg-red-50 rounded border border-red-200">
                <p className="font-medium">{rec.ingredient}</p>
                <p className="text-sm text-gray-600">
                  {rec.recommendation} (Utilization: {rec.costPerUnit.toFixed(1)}%)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {overstocked.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-yellow-600 mb-2">📦 Overstocked Items</h4>
          <div className="space-y-2">
            {overstocked.slice(0, 5).map((rec, idx) => (
              <div key={idx} className="p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="font-medium">{rec.ingredient}</p>
                <p className="text-sm text-gray-600">
                  {rec.recommendation} (Utilization: {rec.costPerUnit.toFixed(1)}%)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {optimal.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-green-600 mb-2">✅ Optimal Inventory Levels</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {optimal.slice(0, 9).map((rec, idx) => (
              <div key={idx} className="p-2 bg-green-50 rounded border border-green-200">
                <p className="text-sm font-medium">{rec.ingredient}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

