import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, CheckCircle2, Clock, AlertCircle, Calendar } from "lucide-react";
import PraiotelLayout from "@/components/PraiotelLayout";
import { trpc } from "@/lib/trpc";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = {
  urgente: "#ef4444",
  alta: "#f97316",
  media: "#eab308",
  baixa: "#22c55e",
  chamada: "#3b82f6",
  email: "#8b5cf6",
  reuniao: "#ec4899",
  follow_up: "#14b8a6",
  outro: "#6b7280",
};

type PeriodType = "week" | "month" | "quarter" | "year";

export default function Reports() {
  const [period, setPeriod] = useState<PeriodType>("month");

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }, [period]);

  // Fetch all reports data
  const { data: metrics } = trpc.crmTasksReports.getMetrics.useQuery(dateRange);
  const { data: byType } = trpc.crmTasksReports.getByType.useQuery(dateRange);
  const { data: byPriority } = trpc.crmTasksReports.getByPriority.useQuery(dateRange);
  const { data: productivity } = trpc.crmTasksReports.getUserProductivity.useQuery(dateRange);
  const { data: timeline } = trpc.crmTasksReports.getCompletionTimeline.useQuery(dateRange);
  const { data: avgTime } = trpc.crmTasksReports.getAvgCompletionTime.useQuery(dateRange);

  const periodLabels = {
    week: "Última Semana",
    month: "Último Mês",
    quarter: "Último Trimestre",
    year: "Último Ano",
  };

  // Prepare chart data
  const typeChartData = byType?.map((item) => ({
    name: item.type === "chamada" ? "Chamada" : item.type === "email" ? "Email" : item.type === "reuniao" ? "Reunião" : item.type === "follow_up" ? "Follow-up" : "Outro",
    total: item.count,
    concluídas: item.completed,
  })) || [];

  const priorityChartData = byPriority?.map((item) => ({
    name: item.priority === "urgente" ? "Urgente" : item.priority === "alta" ? "Alta" : item.priority === "media" ? "Média" : "Baixa",
    value: item.count,
    color: COLORS[item.priority as keyof typeof COLORS],
  })) || [];

  const timelineChartData = timeline?.map((item) => ({
    date: new Date(item.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }),
    tarefas: item.count,
  })) || [];

  const completionRate = metrics ? Math.round((metrics.completed / metrics.total) * 100) : 0;

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Relatórios de Produtividade</h1>
            <p className="text-gray-500 mt-1">
              Análise de desempenho e métricas de tarefas CRM
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={period === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("week")}
            >
              Semana
            </Button>
            <Button
              variant={period === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("month")}
            >
              Mês
            </Button>
            <Button
              variant={period === "quarter" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("quarter")}
            >
              Trimestre
            </Button>
            <Button
              variant={period === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("year")}
            >
              Ano
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{metrics?.total || 0}</div>
              <p className="text-xs text-gray-500 mt-1">{periodLabels[period]}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{metrics?.completed || 0}</div>
              <p className="text-xs text-gray-500 mt-1">{completionRate}% de conclusão</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                Em Progresso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{metrics?.inProgress || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Tarefas ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-yellow-500" />
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{metrics?.pending || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Aguardando início</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                Atrasadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{metrics?.overdue || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Vencidas</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks by Type */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo</CardTitle>
              <CardDescription>Tarefas criadas por tipo de atividade</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" fill="#3b82f6" name="Total" />
                  <Bar dataKey="concluídas" fill="#22c55e" name="Concluídas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tasks by Priority */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Prioridade</CardTitle>
              <CardDescription>Proporção de tarefas por nível de prioridade</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Completion Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução de Conclusão de Tarefas</CardTitle>
            <CardDescription>Tarefas concluídas ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="tarefas" stroke="#3b82f6" strokeWidth={2} name="Tarefas Concluídas" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Productivity Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ranking de Produtividade
            </CardTitle>
            <CardDescription>Desempenho de utilizadores por taxa de conclusão</CardDescription>
          </CardHeader>
          <CardContent>
            {productivity && productivity.length > 0 ? (
              <div className="space-y-4">
                {productivity.map((user, index) => (
                  <div key={user.userId} className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{user.userName || "Utilizador Desconhecido"}</span>
                        <span className="text-sm text-gray-500">
                          {user.completedTasks}/{user.totalTasks} tarefas
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${user.completionRate}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 mt-1">{user.completionRate}% de conclusão</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>Nenhum dado de produtividade disponível para este período</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Average Completion Time */}
        {avgTime && avgTime.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Tempo Médio de Conclusão</CardTitle>
              <CardDescription>Horas médias para concluir tarefas por prioridade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {avgTime.map((item) => (
                  <div key={item.priority} className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold">{item.avgHours || 0}h</div>
                    <div className="text-sm text-gray-500 mt-1 capitalize">{item.priority}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PraiotelLayout>
  );
}
