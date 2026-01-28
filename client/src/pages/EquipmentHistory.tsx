import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, User, MapPin } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";

const priorityColors: Record<string, string> = {
  baixa: "bg-blue-500",
  media: "bg-yellow-500",
  alta: "bg-orange-500",
  urgente: "bg-red-500",
};

const getPriorityColor = (priority: string) => {
  return priorityColors[priority] || "bg-gray-500";
};

const statusColors = {
  aberto: "bg-red-500",
  em_progresso: "bg-yellow-500",
  resolvido: "bg-green-500",
  fechado: "bg-gray-500",
};

export default function EquipmentHistory() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const equipmentId = parseInt(params.id!);

  const { data: equipment, isLoading: loadingEquipment } = trpc.equipment.getById.useQuery({ id: equipmentId });
  const { data: stats } = trpc.equipment.getStats.useQuery({ equipmentId });
  const { data: history, isLoading: loadingHistory } = trpc.equipment.getHistory.useQuery({ equipmentId });
  const { data: users } = trpc.users.list.useQuery();

  const getTechnicianName = (id?: number | null) => {
    if (!id) return "Não atribuído";
    const user = users?.find(u => u.id === id);
    return user?.name || "Desconhecido";
  };

  if (loadingEquipment || loadingHistory) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">A carregar histórico...</div>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/equipment")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-3xl font-bold">Equipamento não encontrado</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/equipment")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Histórico de Intervenções</h1>
          <p className="text-muted-foreground">
            {equipment.brand} {equipment.model} - N/S: {equipment.serialNumber}
          </p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTickets || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Tickets Abertos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.openTickets || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Última Intervenção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.lastIntervention
                ? format(new Date(stats.lastIntervention), "dd/MM/yyyy")
                : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Tickets */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Tickets</CardTitle>
          <CardDescription>Todas as intervenções registadas neste equipamento</CardDescription>
        </CardHeader>
        <CardContent>
          {history && history.length > 0 ? (
            <div className="space-y-4">
              {history.map((ticket) => (
                <div
                  key={ticket.id}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => setLocation(`/tickets/${ticket.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{ticket.ticketNumber}</span>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={statusColors[ticket.status]}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <p className="text-sm">{ticket.problemType}</p>

                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm")}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {getTechnicianName(ticket.assignedToId)}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {ticket.location}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma intervenção registada para este equipamento
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
