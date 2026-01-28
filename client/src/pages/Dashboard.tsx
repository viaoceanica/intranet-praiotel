import PraiotelLayout from "@/components/PraiotelLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Ticket, Clock, TrendingUp, Users, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  BarChart,
  Bar,
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

export default function Dashboard() {
  const { data: stats, isLoading } = trpc.tickets.dashboardStats.useQuery();
  const { data: slaMetrics } = trpc.sla.metrics.useQuery();
  const { data: techRanking } = trpc.sla.technicianRanking.useQuery();

  if (isLoading) {
    return (
      <PraiotelLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
        </div>
      </PraiotelLayout>
    );
  }

  if (!stats) {
    return (
      <PraiotelLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Erro ao carregar estatísticas</p>
        </div>
      </PraiotelLayout>
    );
  }

  const estadoData = [
    { name: "Aberto", value: stats.porEstado.aberto, color: "#EF4444" },
    { name: "Em Progresso", value: stats.porEstado.em_progresso, color: "#F15A24" },
    { name: "Resolvido", value: stats.porEstado.resolvido, color: "#10B981" },
    { name: "Fechado", value: stats.porEstado.fechado, color: "#6B7280" },
  ];

  const prioridadeData = [
    { name: "Baixa", value: stats.porPrioridade.baixa },
    { name: "Média", value: stats.porPrioridade.media },
    { name: "Alta", value: stats.porPrioridade.alta },
    { name: "Urgente", value: stats.porPrioridade.urgente },
  ];

  const avgDays = stats.avgResolutionTimeMs > 0
    ? Math.round(stats.avgResolutionTimeMs / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Visão geral do sistema de tickets</p>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total de Tickets</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-[#F15A24] bg-opacity-10 rounded-full flex items-center justify-center">
                  <Ticket className="h-6 w-6 text-[#F15A24]" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tickets Abertos</p>
                  <p className="text-3xl font-bold text-orange-600">
                    {stats.porEstado.aberto + stats.porEstado.em_progresso}
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tempo Médio Resolução</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {avgDays > 0 ? `${avgDays}d` : "-"}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Clientes Ativos</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.topClientes.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Tickets por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={estadoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {estadoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tickets por Prioridade</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={prioridadeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#F15A24" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Clientes */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Clientes com Mais Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topClientes.length > 0 ? (
              <div className="space-y-4">
                {stats.topClientes.map((cliente, index) => (
                  <div key={cliente.clientId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#F15A24] rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{cliente.clientName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">{cliente.count} tickets</span>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#F15A24] h-2 rounded-full"
                          style={{
                            width: `${(cliente.count / stats.topClientes[0].count) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                Nenhum cliente com tickets registados
              </p>
            )}
          </CardContent>
        </Card>

        {/* Métricas de SLA */}
        {slaMetrics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cumprimento de SLA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Percentagem de Cumprimento</p>
                        <p className="text-2xl font-bold text-green-600">
                          {slaMetrics.slaCompliancePercentage}%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-gray-500">Total Analisados</p>
                      <p className="text-lg font-semibold">{slaMetrics.totalTickets}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Dentro do SLA</p>
                      <p className="text-lg font-semibold text-green-600">
                        {slaMetrics.ticketsWithinSla}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Fora do SLA</p>
                      <p className="text-lg font-semibold text-red-600">
                        {slaMetrics.ticketsBreachedSla}
                      </p>
                    </div>
                  </div>

                  {slaMetrics.averageBreachHours > 0 && (
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="text-sm text-gray-500">Tempo Médio de Violação</p>
                        <p className="text-lg font-semibold text-orange-600">
                          {slaMetrics.averageBreachHours}h
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-4">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: "Dentro do SLA", value: slaMetrics.ticketsWithinSla, color: "#10B981" },
                            { name: "Fora do SLA", value: slaMetrics.ticketsBreachedSla, color: "#EF4444" },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { name: "Dentro do SLA", value: slaMetrics.ticketsWithinSla, color: "#10B981" },
                            { name: "Fora do SLA", value: slaMetrics.ticketsBreachedSla, color: "#EF4444" },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ranking de Técnicos (Cumprimento SLA)</CardTitle>
              </CardHeader>
              <CardContent>
                {techRanking && techRanking.length > 0 ? (
                  <div className="space-y-3">
                    {techRanking.slice(0, 5).map((tech, index) => (
                      <div key={tech.technicianId} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#F15A24] bg-opacity-10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-bold text-[#F15A24]">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{tech.name}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{tech.total} tickets</span>
                            <span className="text-green-600">{tech.withinSla} dentro</span>
                            <span className="text-red-600">{tech.breached} fora</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-[#F15A24]">
                            {tech.compliancePercentage}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-8">
                    Sem dados de cumprimento de SLA
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </PraiotelLayout>
  );
}
