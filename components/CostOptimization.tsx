'use client';

interface CostOptimizationProps {
  recommendations: Array<{ ingredient: string; costPerUnit: number; recommendation: string }>;
}

export default function CostOptimization({ recommendations }: CostOptimizationProps) {
  const overstocked = recommendations.filter((r) => r.recommendation.includes('overstocked'));
  const atRisk = recommendations.filter((r) => r.recommendation.includes('shortage'));
  const optimal = recommendations.filter((r) => r.recommendation === 'Optimal');

  return (
    <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700/50 p-6 rounded-xl shadow-xl">
      <h3 className="text-xl font-semibold mb-4 text-gray-100">Cost Optimization Recommendations</h3>
      
      {atRisk.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-red-400 mb-2">⚠️ Risk of Shortage</h4>
          <div className="space-y-2">
            {atRisk.slice(0, 5).map((rec, idx) => (
              <div key={idx} className="p-3 bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-lg border border-red-400/30 rounded-lg">
                <p className="font-medium text-gray-100">{rec.ingredient}</p>
                <p className="text-sm text-red-200">
                  {rec.recommendation} (Utilization: {rec.costPerUnit.toFixed(1)}%)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {overstocked.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-yellow-400 mb-2">📦 Overstocked Items</h4>
          <div className="space-y-2">
            {overstocked.slice(0, 5).map((rec, idx) => (
              <div key={idx} className="p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-lg border border-yellow-400/30 rounded-lg">
                <p className="font-medium text-gray-100">{rec.ingredient}</p>
                <p className="text-sm text-yellow-200">
                  {rec.recommendation} (Utilization: {rec.costPerUnit.toFixed(1)}%)
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {optimal.length > 0 && (
        <div>
          <h4 className="text-lg font-medium text-green-400 mb-2">✅ Optimal Inventory Levels</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {optimal.slice(0, 9).map((rec, idx) => (
              <div key={idx} className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 backdrop-blur-lg border border-green-400/30 rounded-lg">
                <p className="text-sm font-medium text-gray-100">{rec.ingredient}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

