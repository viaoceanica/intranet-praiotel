import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

export function VolumeAlerts() {
  const { data: alerts, isLoading } = trpc.alertThresholds.checkAlerts.useQuery();

  if (isLoading || !alerts || alerts.length === 0) {
    return null;
  }

  return (
    <Card className="p-6 border-orange-200 bg-orange-50">
      <div className="flex items-center gap-3 mb-4">
        <AlertTriangle className="h-6 w-6 text-orange-600" />
        <h3 className="text-lg font-semibold text-orange-900">Alertas de Volume</h3>
      </div>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.serviceTypeId} className="flex items-center justify-between p-3 bg-white rounded-lg border border-orange-200">
            <div>
              <p className="font-medium text-gray-900">{alert.serviceTypeName}</p>
              <p className="text-sm text-gray-600">
                {alert.currentCount} tickets pendentes (limite: {alert.threshold})
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-orange-100 text-orange-700">
                +{alert.exceeded} acima do limite
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
