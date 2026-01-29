import { useState } from "react";
import { trpc } from "@/lib/trpc";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Calendar, ListTodo } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

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

export default function MyTasks() {
  const [timeFilter, setTimeFilter] = useState<"today" | "week" | "month">("week");

  // Queries
  const { data: stats } = trpc.crmTasksPersonal.getStats.useQuery();
  const { data: todayTasks } = trpc.crmTasksPersonal.getTodayTasks.useQuery();
  const { data: upcomingTasks } = trpc.crmTasksPersonal.getUpcomingTasks.useQuery({ days: 7 });
  const { data: highPriorityTasks } = trpc.crmTasksPersonal.getHighPriorityTasks.useQuery();
  const { data: productivityTimeline } = trpc.crmTasksPersonal.getProductivityTimeline.useQuery();
  const { data: tasksByPriority } = trpc.crmTasksPersonal.getTasksByPriority.useQuery();
  const { data: tasksByType } = trpc.crmTasksPersonal.getTasksByType.useQuery();

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

  const timelineChartData = productivityTimeline?.map((item) => ({
    date: new Date(item.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" }),
    tasks: item.count,
  })) || [];

  // Calculate completion rate
  const completionRate = stats?.total ? Math.round((stats.completed / stats.total) * 100) : 0;
  const weeklyProgress = stats?.completedThisWeek || 0;
  const monthlyProgress = stats?.completedThisMonth || 0;

  const formatDate = (date: Date | null) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case "urgente":
        return "🔴";
      case "alta":
        return "🟠";
      case "media":
        return "🟡";
      case "baixa":
        return "🟢";
      default:
        return "⚪";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "follow_up":
        return "🔄";
      case "ligacao":
        return "📞";
      case "reuniao":
        return "📅";
      case "email":
        return "📧";
      default:
        return "📝";
    }
  };

  return (
    <PraiotelLayout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">As Minhas Tarefas</h1>
          <p className="text-muted-foreground mt-1">
            Dashboard pessoal de produtividade e gestão de tarefas
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <ListTodo className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats?.total || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Todas as tarefas</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{stats?.completed || 0}</p>
                <p className="text-xs text-green-600 mt-1">{completionRate}% taxa de conclusão</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Em Progresso</p>
                <p className="text-2xl font-bold">{stats?.inProgress || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Tarefas ativas</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{stats?.pending || 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Aguardando início</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Atrasadas</p>
                <p className="text-2xl font-bold text-red-600">{stats?.overdue || 0}</p>
                <p className="text-xs text-red-600 mt-1">Vencidas</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold">Progresso Semanal</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tarefas concluídas esta semana</span>
                <span className="font-semibold">{weeklyProgress}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((weeklyProgress / 10) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Meta: 10 tarefas/semana</p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold">Progresso Mensal</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tarefas concluídas este mês</span>
                <span className="font-semibold">{monthlyProgress}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((monthlyProgress / 40) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">Meta: 40 tarefas/mês</p>
            </div>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Priority Distribution */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Distribuição por Prioridade</h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={priorityChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name.toLowerCase() as keyof typeof PRIORITY_COLORS] || "#6b7280"} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Type Distribution */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Distribuição por Tipo</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={typeChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Productivity Timeline */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Evolução de Produtividade (Últimos 30 dias)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timelineChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="tasks" stroke="#10b981" strokeWidth={2} name="Tarefas Concluídas" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Tasks Lists */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Tasks */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Tarefas de Hoje
            </h3>
            <div className="space-y-3">
              {todayTasks && todayTasks.length > 0 ? (
                todayTasks.map((task) => (
                  <div key={task.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>{getTypeIcon(task.type)}</span>
                          <span className="font-medium">{task.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      </div>
                      <span className="text-lg">{getPriorityIcon(task.priority)}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>⏰ {formatDate(task.dueDate)}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded">{task.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma tarefa para hoje</p>
              )}
            </div>
          </Card>

          {/* High Priority Tasks */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Tarefas Prioritárias
            </h3>
            <div className="space-y-3">
              {highPriorityTasks && highPriorityTasks.length > 0 ? (
                highPriorityTasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span>{getTypeIcon(task.type)}</span>
                          <span className="font-medium">{task.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      </div>
                      <span className="text-lg">{getPriorityIcon(task.priority)}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>⏰ {formatDate(task.dueDate)}</span>
                      <span className="px-2 py-1 bg-gray-100 rounded">{task.status}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">Nenhuma tarefa prioritária</p>
              )}
            </div>
          </Card>
        </div>

        {/* Upcoming Tasks */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Próximas Tarefas (7 dias)
          </h3>
          <div className="space-y-3">
            {upcomingTasks && upcomingTasks.length > 0 ? (
              upcomingTasks.map((task) => (
                <div key={task.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>{getTypeIcon(task.type)}</span>
                        <span className="font-medium">{task.title}</span>
                        <span className="text-lg">{getPriorityIcon(task.priority)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>⏰ {formatDate(task.dueDate)}</span>
                        <span className="px-2 py-1 bg-gray-100 rounded">{task.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">Nenhuma tarefa próxima</p>
            )}
          </div>
        </Card>
      </div>
    </PraiotelLayout>
  );
}
