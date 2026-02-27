import { useRoute, useLocation } from "wouter";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Loader2, Ticket } from "lucide-react";
import { format } from "date-fns";

export default function ClientTickets() {
  const [, params] = useRoute("/clients/:id/tickets");
  const [, setLocation] = useLocation();
  const clientId = params?.id ? parseInt(params.id) : null;

  const { data: client, isLoading: loadingClient } = trpc.clients.getById.useQuery(
    { id: clientId! },
    { enabled: !!clientId }
  );

  const { data: clientTickets, isLoading: loadingTickets } = trpc.tickets.listByClient.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId }
  );

  const { data: clientStats } = trpc.tickets.clientStats.useQuery(
    { clientId: clientId! },
    { enabled: !!clientId }
  );

  if (loadingClient || loadingTickets) {
    return (
      <PraiotelLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
        </div>
      </PraiotelLayout>
    );
  }

  if (!client) {
    return (
      <PraiotelLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Cliente não encontrado</p>
        </div>
      </PraiotelLayout>
    );
  }

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation(`/clients/${clientId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Histórico de Tickets - {client.designation}
            </h1>
            <p className="text-gray-500 mt-1">
              NIF: {client.nif} | Email: {client.primaryEmail}
            </p>
          </div>
        </div>

        {/* Estatísticas */}
        {clientStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Total Tickets</div>
                <div className="text-2xl font-bold">{clientStats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Abertos</div>
                <div className="text-2xl font-bold text-orange-600">
                  {clientStats.abertos + clientStats.emProgresso}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Resolvidos</div>
                <div className="text-2xl font-bold text-green-600">
                  {clientStats.resolvidos + (clientStats.fechados || 0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-sm text-gray-500">Tempo Médio</div>
                <div className="text-2xl font-bold">
                  {clientStats.avgResolutionTimeMs > 0
                    ? `${Math.round(clientStats.avgResolutionTimeMs / (1000 * 60 * 60 * 24))}d`
                    : "-"}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Lista de Tickets */}
        <Card>
          <CardHeader>
            <CardTitle>Todos os Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {clientTickets && clientTickets.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Tipo de Problema</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Prioridade</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientTickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">
                        {ticket.ticketNumber}
                      </TableCell>
                      <TableCell>{ticket.equipment}</TableCell>
                      <TableCell>{ticket.problemType}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ticket.status === "aberto"
                              ? "destructive"
                              : ticket.status === "em_progresso"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {ticket.status.replace("_", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            ticket.priority === "urgente" || ticket.priority === "alta"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {ticket.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/tickets/${ticket.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">Nenhum ticket registado para este cliente</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PraiotelLayout>
  );
}
