import { useState, useMemo } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Calendar, ListTodo, Check, Edit2, Trash2, X, GripVertical } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PRIORITY_COLORS = {
  urgente: "#ef4444",
  alta: "#f97316",
  media: "#eab308",
  baixa: "#22c55e",
};

const TYPE_COLORS = {
  follow_up: "#3b82f6",
  ligacao: "#8b5cf6",
  reuniao: "#ec4899",
  email: "#10b981",
  outro: "#6b7280",
};

const STATUS_CONFIG = {
  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: Clock },
  em_progresso: { label: "Em Progresso", color: "bg-blue-100 text-blue-800", icon: TrendingUp },
  concluida: { label: "Concluída", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
};

interface Task {
  id: number;
  title: string;
  description: string | null;
  type: string;
  priority: string;
  status: "pendente" | "em_progresso" | "concluida";
  dueDate: Date;
  assignedToId: number;
  reminderMinutes: number | null;
}

function SortableTaskCard({ task, onComplete, onEdit, onDelete }: { 
  task: Task; 
  onComplete: (id: number) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColor = PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || "#6b7280";
  const dueDate = new Date(task.dueDate);
  const isOverdue = dueDate < new Date() && task.status !== "concluida";

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card className={`p-3 ${isDragging ? 'shadow-lg' : 'hover:shadow-md'} transition-shadow`}>
        <div className="flex items-start gap-2">
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
              <div
                className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                style={{ backgroundColor: priorityColor }}
                title={task.priority}
              />
            </div>
            
            {task.description && (
              <p className="text-xs text-gray-600 mb-2 line-clamp-2">{task.description}</p>
            )}
            
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Calendar className="h-3 w-3" />
              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                {dueDate.toLocaleDateString('pt-PT')}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              {task.status !== "concluida" && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => onComplete(task.id)}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Concluir
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={() => onEdit(task)}
              >
                <Edit2 className="h-3 w-3 mr-1" />
                Editar
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => onDelete(task.id)}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function MyTasks() {
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month">("week");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<number | null>(null);

  // Queries
  const { data: stats } = trpc.crmTasksPersonal.getStats.useQuery();
  const { data: rawTasks } = trpc.crmTasks.list.useQuery({});
  const { data: productivityTimeline } = trpc.crmTasksPersonal.getProductivityTimeline.useQuery();
  const { data: tasksByPriority } = trpc.crmTasksPersonal.getTasksByPriority.useQuery();
  const { data: tasksByType } = trpc.crmTasksPersonal.getTasksByType.useQuery();

  // Map raw tasks (which have {task, lead, opportunity, client, assignedTo} structure) to flat Task objects
  const allTasks = useMemo(() => {
    if (!rawTasks) return undefined;
    return rawTasks.map((item: any) => {
      const t = item.task || item;
      return {
        id: t.id,
        title: t.title,
        description: t.description,
        type: t.type,
        priority: t.priority,
        status: t.status,
        dueDate: t.dueDate,
        assignedToId: t.assignedToId,
        reminderMinutes: t.reminderMinutes,
      } as Task;
    });
  }, [rawTasks]);

  // Mutations
  const utils = trpc.useUtils();
  const completeMutation = trpc.crmTasks.complete.useMutation({
    onSuccess: () => {
      utils.crmTasksPersonal.invalidate();
      utils.crmTasks.list.invalidate();
      toast.success("Tarefa marcada como concluída!");
    },
    onError: () => toast.error("Erro ao concluir tarefa"),
  });

  const updateMutation = trpc.crmTasks.update.useMutation({
    onSuccess: () => {
      utils.crmTasksPersonal.invalidate();
      utils.crmTasks.list.invalidate();
      setEditingTask(null);
      toast.success("Tarefa atualizada com sucesso!");
    },
    onError: () => toast.error("Erro ao atualizar tarefa"),
  });

  const deleteMutation = trpc.crmTasks.delete.useMutation({
    onSuccess: () => {
      utils.crmTasksPersonal.invalidate();
      utils.crmTasks.list.invalidate();
      setDeletingTaskId(null);
      toast.success("Tarefa eliminada com sucesso!");
    },
    onError: () => toast.error("Erro ao eliminar tarefa"),
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Group tasks by status
  const tasksByStatus = {
    pendente: allTasks?.filter((t: Task) => t.status === "pendente") || [],
    em_progresso: allTasks?.filter((t: Task) => t.status === "em_progresso") || [],
    concluida: allTasks?.filter((t: Task) => t.status === "concluida") || [],
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as number);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as number;
    const newStatus = over.id as "pendente" | "em_progresso" | "concluida";

    // Find the task
    const task = allTasks?.find((t: Task) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    // Update task status
    updateMutation.mutate({
      id: taskId,
      title: task.title,
      description: task.description || "",
      type: task.type as any,
      priority: task.priority as any,
      status: newStatus,
      assignedToId: task.assignedToId,
      dueDate: new Date(task.dueDate).toISOString(),
      reminderMinutes: task.reminderMinutes || 30,
    });

    toast.success(`Tarefa movida para ${STATUS_CONFIG[newStatus].label}`);
  };

  // Prepare chart data
  const priorityChartData = tasksByPriority?.map((item) => ({
    name: item.priority.charAt(0).toUpperCase() + item.priority.slice(1),
    value: item.count,
    completed: item.completed,
  })) || [];

  const typeChartData = tasksByType?.map((item) => ({
    name: item.type.replace("_", " ").charAt(0).toUpperCase() + item.type.slice(1),
    value: item.count,
  })) || [];

  const timelineData = productivityTimeline?.map((item) => ({
    date: new Date(item.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
    concluídas: (item as any).completed || item.count,
  })) || [];

  const activeTask = activeId ? allTasks?.find((t: Task) => t.id === activeId) : null;

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">As Minhas Tarefas</h1>
          <p className="text-gray-600">Dashboard pessoal de produtividade e gestão de tarefas</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ListTodo className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-xs text-gray-500">Todas as tarefas</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Concluídas</p>
                <p className="text-2xl font-bold">{stats?.completed || 0}</p>
                <p className="text-xs text-gray-500">0% taxa de conclusão</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Em Progresso</p>
                <p className="text-2xl font-bold">{stats?.inProgress || 0}</p>
                <p className="text-xs text-gray-500">Tarefas ativas</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                <p className="text-xs text-gray-500">Aguardando início</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Atrasadas</p>
                <p className="text-2xl font-bold text-red-600">{stats?.overdue || 0}</p>
                <p className="text-xs text-gray-500">Vencidas</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Kanban Board */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Quadro de Tarefas</h2>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map((status) => {
                const config = STATUS_CONFIG[status];
                const tasks = tasksByStatus[status];
                const Icon = config.icon;

                return (
                  <SortableContext
                    key={status}
                    id={status}
                    items={tasks.map((t: Task) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Card className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Icon className="h-5 w-5" />
                        <h3 className="font-semibold">{config.label}</h3>
                        <span className="ml-auto bg-gray-100 px-2 py-1 rounded-full text-sm">
                          {tasks.length}
                        </span>
                      </div>
                      
                      <div
                        className="min-h-[400px] space-y-2"
                        data-status={status}
                      >
                        {tasks.length === 0 ? (
                          <div className="text-center text-gray-400 py-8">
                            <p className="text-sm">Nenhuma tarefa</p>
                          </div>
                        ) : (
                          tasks.map((task: Task) => (
                            <SortableTaskCard
                              key={task.id}
                              task={task}
                              onComplete={(id) => completeMutation.mutate({ id })}
                              onEdit={setEditingTask}
                              onDelete={setDeletingTaskId}
                            />
                          ))
                        )}
                      </div>
                    </Card>
                  </SortableContext>
                );
              })}
            </div>

            <DragOverlay>
              {activeTask ? (
                <Card className="p-3 shadow-lg opacity-90">
                  <div className="flex items-start gap-2">
                    <GripVertical className="h-4 w-4 mt-1 text-gray-400" />
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{activeTask.title}</h4>
                      {activeTask.description && (
                        <p className="text-xs text-gray-600 mt-1">{activeTask.description}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Distribuição por Prioridade</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={priorityChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#3b82f6" name="Total" />
                <Bar dataKey="completed" fill="#22c55e" name="Concluídas" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Distribuição por Tipo</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={Object.values(TYPE_COLORS)[index % Object.values(TYPE_COLORS).length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Evolução de Produtividade (Últimos 30 dias)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="concluídas" stroke="#22c55e" strokeWidth={2} name="Tarefas Concluídas" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Edit Dialog */}
      {editingTask && (
        <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Tarefa</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Prioridade</Label>
                  <Select
                    value={editingTask.priority}
                    onValueChange={(value) => setEditingTask({ ...editingTask, priority: value })}
                  >
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
                <div>
                  <Label>Estado</Label>
                  <Select
                    value={editingTask.status}
                    onValueChange={(value) => setEditingTask({ ...editingTask, status: value as "pendente" | "em_progresso" | "concluida" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pendente">Pendente</SelectItem>
                      <SelectItem value="em_progresso">Em Progresso</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingTask(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  updateMutation.mutate({
                    id: editingTask.id,
                    title: editingTask.title,
                    description: editingTask.description || "",
                             type: editingTask.type as any,
                    priority: editingTask.priority as any,
                    status: editingTask.status as any,
                    assignedToId: editingTask.assignedToId,
                    dueDate: editingTask.dueDate.toString(),
                    reminderMinutes: editingTask.reminderMinutes || 30,
                  });
                }}
              >
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingTaskId && (
        <Dialog open={!!deletingTaskId} onOpenChange={() => setDeletingTaskId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Eliminação</DialogTitle>
              <DialogDescription>
                Tem a certeza que deseja eliminar esta tarefa? Esta ação não pode ser revertida.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeletingTaskId(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate({ id: deletingTaskId })}
              >
                Eliminar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </PraiotelLayout>
  );
}
