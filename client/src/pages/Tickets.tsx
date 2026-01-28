import { useState } from "react";
import { useLocation } from "wouter";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { Plus, Loader2, Search, Eye } from "lucide-react";
import { format } from "date-fns";

export default function Tickets() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const { data: tickets, isLoading } = trpc.tickets.list.useQuery();

  const statusLabels: Record<string, string> = {
    aberto: "Aberto",
    em_progresso: "Em Progresso",
    resolvido: "Resolvido",
    fechado: "Fechado",
  };

  const statusColors: Record<string, string> = {
    aberto: "bg-blue-100 text-blue-800",
    em_progresso: "bg-yellow-100 text-yellow-800",
    resolvido: "bg-green-100 text-green-800",
    fechado: "bg-gray-100 text-gray-800",
  };

  const priorityLabels: Record<string, string> = {
    baixa: "Baixa",
    media: "Média",
    alta: "Alta",
    urgente: "Urgente",
  };

  const priorityColors: Record<string, string> = {
    baixa: "bg-gray-100 text-gray-800",
    media: "bg-blue-100 text-blue-800",
    alta: "bg-orange-100 text-orange-800",
    urgente: "bg-red-100 text-red-800",
  };

  const filteredTickets = tickets?.filter((ticket) => {
    const matchesSearch =
      ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.equipment.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tickets</h1>
            <p className="text-gray-500 mt-1">Gerir tickets de assistência técnica</p>
          </div>

          <Button
            className="bg-[#F15A24] hover:bg-[#D14A1A]"
            onClick={() => setLocation("/tickets/new")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Ticket
          </Button>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar por número, cliente ou equipamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os estados</SelectItem>
                <SelectItem value="aberto">Aberto</SelectItem>
                <SelectItem value="em_progresso">Em Progresso</SelectItem>
                <SelectItem value="resolvido">Resolvido</SelectItem>
                <SelectItem value="fechado">Fechado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as prioridades</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          {isLoading ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
            </div>
          ) : filteredTickets && filteredTickets.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Equipamento</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                    <TableCell>{ticket.clientName}</TableCell>
                    <TableCell>{ticket.equipment}</TableCell>
                    <TableCell>{ticket.location}</TableCell>
                    <TableCell>
                      <Badge className={priorityColors[ticket.priority]}>
                        {priorityLabels[ticket.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[ticket.status]}>
                        {statusLabels[ticket.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(ticket.createdAt), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setLocation(`/tickets/${ticket.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Nenhum ticket encontrado</p>
            </div>
          )}
        </div>
      </div>
    </PraiotelLayout>
  );
}
