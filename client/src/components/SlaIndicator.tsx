import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface SlaIndicatorProps {
  createdAt: Date;
  priority: string;
  status: string;
  resolvedAt?: Date | null;
}

export function SlaIndicator({ createdAt, priority, status, resolvedAt }: SlaIndicatorProps) {
  const { data: slaConfig } = trpc.sla.getByPriority.useQuery({ priority });

  if (!slaConfig) return null;

  const now = resolvedAt || new Date();
  const elapsed = now.getTime() - new Date(createdAt).getTime();
  const hoursElapsed = elapsed / (1000 * 60 * 60);
  const slaHours = slaConfig.resolutionTimeHours;
  const hoursRemaining = Math.max(0, slaHours - hoursElapsed);
  const percentageUsed = Math.min(100, (hoursElapsed / slaHours) * 100);
  const isBreached = hoursElapsed > slaHours;

  // Se o ticket está resolvido ou fechado, mostrar apenas se violou SLA
  if (status === "resolvido" || status === "fechado") {
    if (isBreached) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          SLA Violado
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 bg-green-100 text-green-800">
        <Clock className="h-3 w-3" />
        Dentro do SLA
      </Badge>
    );
  }

  // Para tickets abertos ou em progresso
  if (isBreached) {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" />
        {Math.round(hoursElapsed - slaHours)}h excedido
      </Badge>
    );
  }

  if (percentageUsed >= 80) {
    return (
      <Badge className="gap-1 bg-orange-100 text-orange-800">
        <Clock className="h-3 w-3" />
        {Math.round(hoursRemaining)}h restantes
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1">
      <Clock className="h-3 w-3" />
      {Math.round(hoursRemaining)}h restantes
    </Badge>
  );
}
