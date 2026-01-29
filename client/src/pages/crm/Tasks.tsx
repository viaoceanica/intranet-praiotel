import { useState } from "react";
import PraiotelLayout from "@/components/PraiotelLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, User, AlertCircle, CheckCircle2, Clock, Trash2, Edit, Filter } from "lucide-react";
import { toast } from "sonner";

export default function Tasks() {

  const utils = trpc.useUtils();
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  
  // Dialog states
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    type: "chamada" | "email" | "reuniao" | "follow_up" | "outro";
    priority: "baixa" | "media" | "alta" | "urgente";
    status: "pendente" | "em_progresso" | "concluida" | "cancelada";
    dueDate: string;
    assignedToId?: number;
    reminderMinutes: number;
  }>({
    title: "",
    description: "",
    type: "follow_up",
    priority: "media",
    status: "pendente",
    dueDate: "",
    assignedToId: undefined,
    reminderMinutes: 30,
  });
  
  // Queries
  const { data: tasks = [], isLoading } = trpc.crmTasks.list.useQuery({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    type: typeFilter || undefined,
    overdue: overdueOnly || undefined,
  });
  
  const { data: stats } = trpc.crmTasks.getStats.useQuery();
  const { data: users = [] } = trpc.users.list.useQuery();
  
  // Mutations
  const createMutation = trpc.crmTasks.create.useMutation({
    onSuccess: () => {
      toast.success("Tarefa criada com sucesso!");
      utils.crmTasks.list.invalidate();
      utils.crmTasks.getStats.invalidate();
      setIsNewTaskOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao criar tarefa", { description: error.message });
    },
  });
  
  const updateMutation = trpc.crmTasks.update.useMutation({
    onSuccess: () => {
      toast.success("Tarefa atualizada com sucesso!");
      utils.crmTasks.list.invalidate();
      utils.crmTasks.getStats.invalidate();
      setEditingTask(null);
      resetForm();
    },
    onError: (error) => {
      toast.error("Erro ao atualizar tarefa", { description: error.message });
    },
  });
  
  const completeMutation = trpc.crmTasks.complete.useMutation({
    onSuccess: () => {
      toast.success("Tarefa marcada como concluída!");
      utils.crmTasks.list.invalidate();
      utils.crmTasks.getStats.invalidate();
    },
  });
  
  const deleteMutation = trpc.crmTasks.delete.useMutation({
    onSuccess: () => {
      toast.success("Tarefa eliminada com sucesso!");
      utils.crmTasks.list.invalidate();
      utils.crmTasks.getStats.invalidate();
    },
  });
  
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      type: "follow_up",
      priority: "media",
      status: "pendente",
      dueDate: "",
      assignedToId: undefined,
      reminderMinutes: 30,
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.dueDate || !formData.assignedToId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    if (editingTask) {
      updateMutation.mutate({
        id: editingTask.task.id,
        ...formData,
      });
    } else {
      createMutation.mutate({
        ...formData,
        assignedToId: formData.assignedToId!,
      });
    }
  };
  
  const handleEdit = (task: any) => {
    setEditingTask(task);
    setFormData({
      title: task.task.title,
      description: task.task.description || "",
      type: task.task.type,
      priority: task.task.priority,
      status: task.task.status,
      dueDate: new Date(task.task.dueDate).toISOString().slice(0, 16),
      assignedToId: task.task.assignedToId,
      reminderMinutes: task.task.reminderMinutes || 30,
    });
  };
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pendente: { variant: "secondary", label: "Pendente" },
      em_progresso: { variant: "default", label: "Em Progresso" },
      concluida: { variant: "outline", label: "Concluída" },
      cancelada: { variant: "destructive", label: "Cancelada" },
    };
    const config = variants[status] || variants.pendente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };
  
  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      baixa: { className: "bg-blue-100 text-blue-800", label: "Baixa" },
      media: { className: "bg-yellow-100 text-yellow-800", label: "Média" },
      alta: { className: "bg-orange-100 text-orange-800", label: "Alta" },
      urgente: { className: "bg-red-100 text-red-800", label: "Urgente" },
    };
    const config = variants[priority] || variants.media;
    return <Badge className={config.className}>{config.label}</Badge>;
  };
  
  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      chamada: "📞",
      email: "📧",
      reuniao: "📅",
      follow_up: "🔄",
      outro: "📋",
    };
    return icons[type] || "📋";
  };
  
  const isOverdue = (dueDate: Date, status: string) => {
    return new Date(dueDate) < new Date() && (status === "pendente" || status === "em_progresso");
  };
  
  return (
    <PraiotelLayout>
      <div className="container mx-auto py-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Tarefas</h1>
            <p className="text-muted-foreground">Gerir tarefas e follow-ups do CRM</p>
          </div>
          <Dialog open={isNewTaskOpen || !!editingTask} onOpenChange={(open) => {
            if (!open) {
              setIsNewTaskOpen(false);
              setEditingTask(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsNewTaskOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTask ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
                <DialogDescription>
                  {editingTask ? "Atualizar informações da tarefa" : "Criar uma nova tarefa para acompanhamento"}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Título *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Ex: Ligar para follow-up da proposta"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="type">Tipo *</Label>
                      <Select value={formData.type} onValueChange={(value: any) => setFormData({ ...formData, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chamada">📞 Chamada</SelectItem>
                          <SelectItem value="email">📧 Email</SelectItem>
                          <SelectItem value="reuniao">📅 Reunião</SelectItem>
                          <SelectItem value="follow_up">🔄 Follow-up</SelectItem>
                          <SelectItem value="outro">📋 Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="priority">Prioridade *</Label>
                      <Select value={formData.priority} onValueChange={(value: any) => setFormData({ ...formData, priority: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="status">Estado *</Label>
                      <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="em_progresso">Em Progresso</SelectItem>
                          <SelectItem value="concluida">Concluída</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="assignedToId">Atribuir a *</Label>
                      <Select value={formData.assignedToId?.toString() || undefined} onValueChange={(value) => setFormData({ ...formData, assignedToId: parseInt(value) })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecionar utilizador" />
                        </SelectTrigger>
                        <SelectContent>
                          {users.map((user: any) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="dueDate">Data de Vencimento *</Label>
                      <Input
                        id="dueDate"
                        type="datetime-local"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="reminderMinutes">Lembrete (minutos antes)</Label>
                      <Input
                        id="reminderMinutes"
                        type="number"
                        value={formData.reminderMinutes}
                        onChange={(e) => setFormData({ ...formData, reminderMinutes: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detalhes adicionais sobre a tarefa..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsNewTaskOpen(false);
                    setEditingTask(null);
                    resetForm();
                  }}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingTask ? "Atualizar" : "Criar"} Tarefa
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Statistics */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-5 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendente}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.em_progresso}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.concluida}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Atrasadas</CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
              </CardContent>
            </Card>
          </div>
        )}
        
        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <Select value={statusFilter || undefined} onValueChange={(v) => setStatusFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_progresso">Em Progresso</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priorityFilter || undefined} onValueChange={(v) => setPriorityFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={typeFilter || undefined} onValueChange={(v) => setTypeFilter(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chamada">Chamada</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="reuniao">Reunião</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                variant={overdueOnly ? "default" : "outline"}
                onClick={() => setOverdueOnly(!overdueOnly)}
              >
                <AlertCircle className="mr-2 h-4 w-4" />
                Apenas Atrasadas
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Tasks List */}
        <Card>
          <CardHeader>
            <CardTitle>Tarefas ({tasks.length})</CardTitle>
            <CardDescription>Lista de todas as tarefas no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">A carregar tarefas...</p>
            ) : tasks.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Nenhuma tarefa encontrada</p>
            ) : (
              <div className="space-y-4">
                {tasks.map((item: any) => {
                  const task = item.task;
                  const overdue = isOverdue(task.dueDate, task.status);
                  
                  return (
                    <div
                      key={task.id}
                      className={`border rounded-lg p-4 ${overdue ? "border-red-300 bg-red-50" : ""}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{getTypeIcon(task.type)}</span>
                            <h3 className="font-semibold text-lg">{task.title}</h3>
                            {overdue && (
                              <Badge variant="destructive" className="ml-2">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Atrasada
                              </Badge>
                            )}
                          </div>
                          
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-3">{task.description}</p>
                          )}
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {getStatusBadge(task.status)}
                            {getPriorityBadge(task.priority)}
                            
                            {item.assignedTo && (
                              <Badge variant="outline">
                                <User className="h-3 w-3 mr-1" />
                                {item.assignedTo.name}
                              </Badge>
                            )}
                            
                            <Badge variant="outline">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(task.dueDate).toLocaleString("pt-PT")}
                            </Badge>
                          </div>
                          
                          {(item.lead || item.opportunity || item.client) && (
                            <div className="text-sm text-muted-foreground">
                              Relacionado com:{" "}
                              {item.lead && `Lead: ${item.lead.name}`}
                              {item.opportunity && `Oportunidade: ${item.opportunity.title}`}
                              {item.client && `Cliente: ${item.client.name}`}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {task.status !== "concluida" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => completeMutation.mutate({ id: task.id })}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja eliminar esta tarefa?")) {
                                deleteMutation.mutate({ id: task.id });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PraiotelLayout>
  );
}
