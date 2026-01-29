import { Phone, Mail, Calendar, FileText, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Activity = {
  id: number;
  type: 'chamada' | 'email' | 'reuniao' | 'nota' | 'tarefa_concluida';
  subject: string;
  description: string | null;
  activityDate: Date;
  duration: number | null;
  outcome: string | null;
  createdAt: Date;
};

interface ActivityTimelineProps {
  activities: Activity[];
  emptyMessage?: string;
}

const activityConfig = {
  chamada: {
    icon: Phone,
    label: "Chamada",
    color: "bg-blue-500",
  },
  email: {
    icon: Mail,
    label: "Email",
    color: "bg-green-500",
  },
  reuniao: {
    icon: Calendar,
    label: "Reunião",
    color: "bg-purple-500",
  },
  nota: {
    icon: FileText,
    label: "Nota",
    color: "bg-gray-500",
  },
  tarefa_concluida: {
    icon: CheckCircle,
    label: "Tarefa Concluída",
    color: "bg-emerald-500",
  },
};

export function ActivityTimeline({ activities, emptyMessage = "Nenhuma atividade registada" }: ActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const config = activityConfig[activity.type];
        const Icon = config.icon;
        const isLast = index === activities.length - 1;

        return (
          <div key={activity.id} className="flex gap-4">
            {/* Timeline line and icon */}
            <div className="flex flex-col items-center">
              <div className={`rounded-full p-2 ${config.color} text-white`}>
                <Icon className="h-4 w-4" />
              </div>
              {!isLast && (
                <div className="w-0.5 flex-1 bg-border mt-2" />
              )}
            </div>

            {/* Activity content */}
            <Card className="flex-1 p-4 mb-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{config.label}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {new Date(activity.activityDate).toLocaleString('pt-PT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                {activity.duration && (
                  <span className="text-sm text-muted-foreground">
                    {activity.duration} min
                  </span>
                )}
              </div>

              <h4 className="font-semibold mb-1">{activity.subject}</h4>

              {activity.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {activity.description}
                </p>
              )}

              {activity.outcome && (
                <div className="mt-2 p-2 bg-muted rounded-md">
                  <span className="text-xs font-medium text-muted-foreground">Resultado:</span>
                  <p className="text-sm mt-1">{activity.outcome}</p>
                </div>
              )}
            </Card>
          </div>
        );
      })}
    </div>
  );
}
