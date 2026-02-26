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
import { Plus, Loader2, Search, Eye, X, Calendar, AlertTriangle, Edit2, User, MapPin, Wrench, Users, Building2 } from "lucide-react";
import { SlaIndicator } from "@/components/SlaIndicator";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function Tickets() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [technicianFilter, setTechnicianFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [showQuickEditModal, setShowQuickEditModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<any>(null);
  const [quickEditData, setQuickEditData] = useState({
    status: "",
    priority: "",
    assignedToId: undefined as number | undefined,
  });

  const utils = trpc.useUtils();

  const { data: tickets, isLoading } = trpc.tickets.list.useQuery();
  const { data: priorities } = trpc.sla.list.useQuery();
  const { data: serviceTypes } = trpc.serviceTypes.listActive.useQuery();

  const quickEditMutation = trpc.tickets.update.useMutation({
    onSuccess: () => {
      alert("Ticket atualizado com sucesso!");
      utils.tickets.list.invalidate();
      setShowQuickEditModal(false);
      setEditingTicket(null);
    },
    onError: (error) => {
      alert("Erro ao atualizar ticket: " + error.message);
    },
  });

  const handleQuickEdit = (ticket: any) => {
    setEditingTicket(ticket);
    setQuickEditData({
      status: ticket.status,
      priority: ticket.priority,
      assignedToId: ticket.assignedToId,
    });
    setShowQuickEditModal(true);
  };

  const handleQuickEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTicket) return;
    
    quickEditMutation.mutate({
      id: editingTicket.id,
      status: quickEditData.status as any,
      priority: quickEditData.priority as any,
      assignedToId: quickEditData.assignedToId,
    });
  };
  const { data: users } = trpc.users.list.useQuery();
  const { data: clients } = trpc.clients.list.useQuery();

  const technicians = users?.filter(u => (u.role === 'tecnico' || u.role === 'admin') && u.active) || [];
  
  const uniqueLocations = Array.from(new Set(tickets?.map(t => t.location).filter(Boolean))) as string[];

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
    const matchesTechnician = technicianFilter === "all" || 
      (technicianFilter === "-1" && ticket.assignedToId === -1) ||
      (ticket.assignedToId && ticket.assignedToId.toString() === technicianFilter);
    const matchesClient = clientFilter === "all" || 
      (ticket.clientId && ticket.clientId.toString() === clientFilter);
    const matchesLocation = locationFilter === "all" || ticket.location === locationFilter;
    const matchesServiceType = serviceTypeFilter === "all" || 
      (ticket.serviceTypeId && ticket.serviceTypeId.toString() === serviceTypeFilter);
    
    const ticketDate = new Date(ticket.createdAt);
    const matchesDateFrom = !dateFrom || ticketDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || ticketDate <= new Date(dateTo + 'T23:59:59');

    return matchesSearch && matchesStatus && matchesPriority && matchesTechnician && 
           matchesClient && matchesLocation && matchesServiceType && matchesDateFrom && matchesDateTo;
  });

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setTechnicianFilter("all");
    setClientFilter("all");
    setLocationFilter("all");
    setServiceTypeFilter("all");
    setDateFrom("");
    setDateTo("");
  };

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

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Search className="h-4 w-4 text-[#F15A24]" />
              Filtros
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>

          <div className="p-6 space-y-6">
            {/* Pesquisa Principal */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Search className="h-4 w-4 text-gray-500" />
                Pesquisa
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Pesquisar por número, cliente ou equipamento..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
                />
              </div>
            </div>

            {/* Filtros de Estado e Prioridade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-gray-500" />
                  Estado
                </Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-11">
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
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-gray-500" />
                  Prioridade
                </Label>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="h-11">
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

            {/* Filtros de Atribuição e Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-500" />
                  Técnico
                </Label>
                <Select value={technicianFilter} onValueChange={setTechnicianFilter}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Todos os técnicos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os técnicos</SelectItem>
                    <SelectItem value="-1" className="font-semibold text-[#F15A24]">👥 Atribuído a Todos</SelectItem>
                    {technicians.map((tech) => (
                      <SelectItem key={tech.id} value={tech.id.toString()}>
                        {tech.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-gray-500" />
                  Tipo de Assistência
                </Label>
                <Select value={serviceTypeFilter} onValueChange={setServiceTypeFilter}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Todos os tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {serviceTypes?.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtros de Cliente e Localização */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-500" />
                  Cliente
                </Label>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Todos os clientes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os clientes</SelectItem>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.designation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  Localização
                </Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Todas as localizações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as localizações</SelectItem>
                    {uniqueLocations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtro de Período */}
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                Período
              </Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    placeholder="Data inicial"
                    className="h-11"
                  />
                </div>
                <div>
                  <Input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    placeholder="Data final"
                    className="h-11"
                  />
                </div>
              </div>
            </div>
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
                  <TableHead>Tipo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Técnico</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                    <TableCell>{ticket.clientName}</TableCell>
                    <TableCell>
                      {ticket.equipmentData?.id ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {ticket.equipmentData.brand} {ticket.equipmentData.model}
                            <span className="text-gray-500 text-xs ml-1">
                              (N/S: {ticket.equipmentData.serialNumber})
                            </span>
                          </span>
                          {ticket.equipmentData.isCritical && (
                            <Badge className="bg-red-100 text-red-800 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Crítico
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">{ticket.equipment || '-'}</span>
                      )}
                    </TableCell>
                    <TableCell>{ticket.location}</TableCell>
                    <TableCell>
                      <Badge className={priorityColors[ticket.priority]}>
                        {priorityLabels[ticket.priority]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.serviceTypeId ? (
                        <Badge className="bg-purple-100 text-purple-800">
                          {serviceTypes?.find(st => st.id === ticket.serviceTypeId)?.name || 'N/A'}
                        </Badge>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[ticket.status]}>
                        {statusLabels[ticket.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {ticket.assignedToId === -1 ? (
                        <Badge className="bg-[#F15A24] hover:bg-[#D14A1F] text-white">
                          👥 Todos
                        </Badge>
                      ) : ticket.assignedToId ? (
                        <span className="text-sm">
                          {technicians.find(t => t.id === ticket.assignedToId)?.name || 'N/A'}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">Não atribuído</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <SlaIndicator
                        createdAt={new Date(ticket.createdAt)}
                        priority={ticket.priority}
                        status={ticket.status}
                        resolvedAt={ticket.resolvedAt}
                      />
                    </TableCell>
                    <TableCell>{format(new Date(ticket.createdAt), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleQuickEdit(ticket)}
                          title="Edição Rápida"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setLocation(`/tickets/${ticket.id}`)}
                          title="Ver Detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
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

      {/* Modal de Edição Rápida */}
      <Dialog open={showQuickEditModal} onOpenChange={setShowQuickEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edição Rápida - {editingTicket?.ticketNumber}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleQuickEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quickEditStatus">Estado</Label>
              <Select
                value={quickEditData.status}
                onValueChange={(value) => setQuickEditData({ ...quickEditData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_progresso">Em Progresso</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickEditPriority">Prioridade</Label>
              <Select
                value={quickEditData.priority}
                onValueChange={(value) => setQuickEditData({ ...quickEditData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {priorities?.map((p) => (
                    <SelectItem key={p.priority} value={p.priority}>
                      {p.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quickEditTechnician">Técnico Atribuído</Label>
              <Select
                value={quickEditData.assignedToId === -1 ? "-1" : (quickEditData.assignedToId?.toString() || "none")}
                onValueChange={(value) => 
                  setQuickEditData({ 
                    ...quickEditData, 
                    assignedToId: value === "none" ? undefined : (value === "-1" ? -1 : parseInt(value))
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um técnico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Não atribuído</SelectItem>
                  <SelectItem value="-1" className="font-semibold text-[#F15A24]">Todos os Técnicos</SelectItem>
                  {technicians?.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id.toString()}>
                      {tech.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowQuickEditModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-[#F15A24] hover:bg-[#D14A1A]"
                disabled={quickEditMutation.isPending}
              >
                {quickEditMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    A guardar...
                  </>
                ) : (
                  "Guardar Alterações"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </PraiotelLayout>
  );
}
