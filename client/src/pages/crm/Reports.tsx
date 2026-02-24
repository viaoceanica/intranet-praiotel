import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, CheckCircle2, Clock, AlertCircle, Calendar, DollarSign, Users, Target, Megaphone, Download } from "lucide-react";
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
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  FunnelChart,
  Funnel,
  LabelList,
} from "recharts";

const PRIORITY_COLORS: Record<string, string> = {
  urgente: "#ef4444",
  alta: "#f97316",
  media: "#eab308",
  baixa: "#22c55e",
};

const TYPE_COLORS: Record<string, string> = {
  chamada: "#3b82f6",
  email: "#8b5cf6",
  reuniao: "#ec4899",
  follow_up: "#14b8a6",
  outro: "#6b7280",
};

const STAGE_COLORS: Record<string, string> = {
  prospeccao: "#3b82f6",
  qualificacao: "#8b5cf6",
  proposta: "#f59e0b",
  negociacao: "#f97316",
  fechamento: "#22c55e",
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

  // Task reports data
  const { data: metrics } = trpc.crmTasksReports.getMetrics.useQuery(dateRange);
  const { data: byType } = trpc.crmTasksReports.getByType.useQuery(dateRange);
  const { data: byPriority } = trpc.crmTasksReports.getByPriority.useQuery(dateRange);
  const { data: productivity } = trpc.crmTasksReports.getUserProductivity.useQuery(dateRange);
  const { data: timeline } = trpc.crmTasksReports.getCompletionTimeline.useQuery(dateRange);
  const { data: avgTime } = trpc.crmTasksReports.getAvgCompletionTime.useQuery(dateRange);

  // Sales/CRM data
  const { data: leadsStats } = trpc.crmLeads.getStats.useQuery();
  const { data: opportunitiesStats } = trpc.crmOpportunities.getStats.useQuery();
  const { data: conversionRate } = trpc.crmOpportunities.getConversionRate.useQuery();
  const { data: campaignStats } = trpc.crmCampaigns.getStats.useQuery();
  const { data: scoreDistribution } = trpc.crmLeadScoring.getDistribution.useQuery();

  const periodLabels: Record<string, string> = {
    week: "Última Semana",
    month: "Último Mês",
    quarter: "Último Trimestre",
    year: "Último Ano",
  };

  // Prepare task chart data
  const typeChartData = byType?.map((item) => ({
    name: item.type === "chamada" ? "Chamada" : item.type === "email" ? "Email" : item.type === "reuniao" ? "Reunião" : item.type === "follow_up" ? "Follow-up" : "Outro",
    total: item.count,
    concluídas: item.completed,
    fill: TYPE_COLORS[item.type] || "#6b7280",
  })) || [];

  const priorityChartData = byPriority?.map((item) => ({
    name: item.priority === "urgente" ? "Urgente" : item.priority === "alta" ? "Alta" : item.priority === "media" ? "Média" : "Baixa",
    value: item.count,
    fill: PRIORITY_COLORS[item.priority] || "#6b7280",
  })) || [];

  const timelineChartData = timeline?.map((item) => ({
    date: new Date(item.date).toLocaleDateString("pt-PT", { day: "2-digit", month: "short" }),
    tarefas: item.count,
  })) || [];

  const completionRate = metrics ? (metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0) : 0;

  // Pipeline data
  const pipelineChartData = opportunitiesStats?.byStage ? [
    { name: "Prospecção", count: opportunitiesStats.byStage.prospeccao?.count || 0, value: parseFloat(opportunitiesStats.byStage.prospeccao?.totalValue || "0"), fill: STAGE_COLORS.prospeccao },
    { name: "Qualificação", count: opportunitiesStats.byStage.qualificacao?.count || 0, value: parseFloat(opportunitiesStats.byStage.qualificacao?.totalValue || "0"), fill: STAGE_COLORS.qualificacao },
    { name: "Proposta", count: opportunitiesStats.byStage.proposta?.count || 0, value: parseFloat(opportunitiesStats.byStage.proposta?.totalValue || "0"), fill: STAGE_COLORS.proposta },
    { name: "Negociação", count: opportunitiesStats.byStage.negociacao?.count || 0, value: parseFloat(opportunitiesStats.byStage.negociacao?.totalValue || "0"), fill: STAGE_COLORS.negociacao },
    { name: "Fechamento", count: opportunitiesStats.byStage.fechamento?.count || 0, value: parseFloat(opportunitiesStats.byStage.fechamento?.totalValue || "0"), fill: STAGE_COLORS.fechamento },
  ] : [];

  // Lead status data
  const leadStatusData = leadsStats?.byStatus ? [
    { name: "Novos", value: leadsStats.byStatus.novo || 0, fill: "#3b82f6" },
    { name: "Contactados", value: leadsStats.byStatus.contactado || 0, fill: "#8b5cf6" },
    { name: "Qualificados", value: leadsStats.byStatus.qualificado || 0, fill: "#22c55e" },
    { name: "Não Qualif.", value: leadsStats.byStatus.nao_qualificado || 0, fill: "#ef4444" },
    { name: "Convertidos", value: leadsStats.byStatus.convertido || 0, fill: "#f59e0b" },
  ].filter(d => d.value > 0) : [];

  // Lead source data
  const leadsBySourceData = leadsStats?.bySource ? Object.entries(leadsStats.bySource).map(([source, count], i) => ({
    name: source.charAt(0).toUpperCase() + source.slice(1),
    value: count as number,
    fill: ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#22c55e", "#14b8a6", "#6b7280"][i % 7],
  })) : [];

  // Score distribution data
  const scoreDistData = scoreDistribution?.map(d => ({
    name: d.range,
    value: d.count,
    fill: d.range.includes("Quente") ? "#ef4444" : d.range.includes("Morno") ? "#f97316" : d.range.includes("Frio (") ? "#eab308" : d.range.includes("Muito") ? "#3b82f6" : "#9ca3af",
  })) || [];

  // Calculated KPIs
  const totalPipelineValue = opportunitiesStats?.totalValue ? parseFloat(opportunitiesStats.totalValue) : 0;
  const wonValue = opportunitiesStats?.wonValue ? parseFloat(opportunitiesStats.wonValue) : 0;
  const activeLeads = leadsStats ? (leadsStats.byStatus.novo || 0) + (leadsStats.byStatus.contactado || 0) + (leadsStats.byStatus.qualificado || 0) : 0;

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Relatórios CRM</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Análise de desempenho comercial, leads e produtividade
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

        <Tabs defaultValue="sales" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Vendas
            </TabsTrigger>
            <TabsTrigger value="leads" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Leads & Campanhas
            </TabsTrigger>
            <TabsTrigger value="productivity" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Produtividade
            </TabsTrigger>
          </TabsList>

          {/* ===== VENDAS TAB ===== */}
          <TabsContent value="sales" className="space-y-6">
            {/* Sales KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-emerald-500" />
                    Receita Ganha
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    €{wonValue.toLocaleString("pt-PT", { minimumFractionDigits: 0 })}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Pipeline: €{totalPipelineValue.toLocaleString("pt-PT", { minimumFractionDigits: 0 })}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Taxa de Conversão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {(conversionRate?.rate || 0).toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {conversionRate?.won || 0} ganhas de {conversionRate?.total || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Target className="h-4 w-4 text-violet-500" />
                    Oportunidades Abertas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{opportunitiesStats?.byStatus?.aberta || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {opportunitiesStats?.total || 0} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Oportunidades Perdidas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{opportunitiesStats?.byStatus?.perdida || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {opportunitiesStats?.total && opportunitiesStats.byStatus?.perdida
                      ? ((opportunitiesStats.byStatus.perdida / opportunitiesStats.total) * 100).toFixed(1)
                      : 0}% do total
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Pipeline Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline de Vendas por Fase</CardTitle>
                  <CardDescription>Valor total por fase do pipeline</CardDescription>
                </CardHeader>
                <CardContent>
                  {pipelineChartData.length > 0 && pipelineChartData.some(d => d.count > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={pipelineChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} />
                        <YAxis type="category" dataKey="name" width={90} />
                        <Tooltip formatter={(value: number) => [`€${value.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`, "Valor"]} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {pipelineChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      Nenhuma oportunidade no pipeline
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Contagem por Fase</CardTitle>
                  <CardDescription>Número de oportunidades em cada fase</CardDescription>
                </CardHeader>
                <CardContent>
                  {pipelineChartData.length > 0 && pipelineChartData.some(d => d.count > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={pipelineChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="count" name="Oportunidades" radius={[4, 4, 0, 0]}>
                          {pipelineChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      Nenhuma oportunidade registada
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== LEADS & CAMPANHAS TAB ===== */}
          <TabsContent value="leads" className="space-y-6">
            {/* Leads KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    Leads Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{activeLeads}</div>
                  <p className="text-xs text-gray-500 mt-1">{leadsStats?.total || 0} leads totais</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Convertidos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{leadsStats?.byStatus?.convertido || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {leadsStats?.total && leadsStats.byStatus?.convertido
                      ? ((leadsStats.byStatus.convertido / leadsStats.total) * 100).toFixed(1)
                      : 0}% de conversão
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <Megaphone className="h-4 w-4 text-amber-500" />
                    Campanhas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{campaignStats?.total || 0}</div>
                  <p className="text-xs text-gray-500 mt-1">{campaignStats?.enviada || 0} enviadas</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    Taxa de Abertura
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    {campaignStats && campaignStats.totalRecipients > 0
                      ? ((campaignStats.totalOpened / campaignStats.totalRecipients) * 100).toFixed(1)
                      : 0}%
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {campaignStats?.totalOpened || 0} aberturas
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Leads por Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Leads por Estado</CardTitle>
                  <CardDescription>Distribuição de leads no funil</CardDescription>
                </CardHeader>
                <CardContent>
                  {leadStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={leadStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {leadStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      Nenhum lead registado
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Leads por Origem */}
              <Card>
                <CardHeader>
                  <CardTitle>Leads por Origem</CardTitle>
                  <CardDescription>Canal de aquisição de leads</CardDescription>
                </CardHeader>
                <CardContent>
                  {leadsBySourceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={leadsBySourceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]}>
                          {leadsBySourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      Nenhum dado de origem disponível
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Lead Score Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição de Lead Scoring</CardTitle>
                  <CardDescription>Classificação de leads por temperatura</CardDescription>
                </CardHeader>
                <CardContent>
                  {scoreDistData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={scoreDistData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]}>
                          {scoreDistData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-gray-400">
                      Nenhum dado de scoring disponível
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Campaign Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Desempenho de Campanhas</CardTitle>
                  <CardDescription>Métricas de envio, abertura e cliques</CardDescription>
                </CardHeader>
                <CardContent>
                  {campaignStats && campaignStats.total > 0 ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{campaignStats.totalRecipients || 0}</p>
                          <p className="text-xs text-gray-500 mt-1">Destinatários</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{campaignStats.totalOpened || 0}</p>
                          <p className="text-xs text-gray-500 mt-1">Aberturas</p>
                        </div>
                        <div className="text-center p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
                          <p className="text-2xl font-bold text-amber-600">{campaignStats.totalClicked || 0}</p>
                          <p className="text-xs text-gray-500 mt-1">Cliques</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Taxa de Abertura</span>
                          <span className="font-medium">
                            {campaignStats.totalRecipients > 0
                              ? ((campaignStats.totalOpened / campaignStats.totalRecipients) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full transition-all"
                            style={{ width: `${campaignStats.totalRecipients > 0 ? Math.min(100, (campaignStats.totalOpened / campaignStats.totalRecipients) * 100) : 0}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Taxa de Cliques</span>
                          <span className="font-medium">
                            {campaignStats.totalOpened > 0
                              ? ((campaignStats.totalClicked / campaignStats.totalOpened) * 100).toFixed(1)
                              : 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-amber-500 h-2 rounded-full transition-all"
                            style={{ width: `${campaignStats.totalOpened > 0 ? Math.min(100, (campaignStats.totalClicked / campaignStats.totalOpened) * 100) : 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-gray-400">
                      Nenhuma campanha registada
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ===== PRODUTIVIDADE TAB ===== */}
          <TabsContent value="productivity" className="space-y-6">
            {/* Task Metrics Cards */}
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
                  {typeChartData.length > 0 ? (
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
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      Nenhum dado disponível
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tasks by Priority */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribuição por Prioridade</CardTitle>
                  <CardDescription>Proporção de tarefas por nível de prioridade</CardDescription>
                </CardHeader>
                <CardContent>
                  {priorityChartData.length > 0 ? (
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
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      Nenhum dado disponível
                    </div>
                  )}
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
                {timelineChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={timelineChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="tarefas" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} name="Tarefas Concluídas" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-gray-400">
                    Nenhum dado disponível
                  </div>
                )}
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
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                          index === 0 ? "bg-amber-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-orange-600" : "bg-gray-300"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{user.userName || "Utilizador Desconhecido"}</span>
                            <span className="text-sm text-gray-500">
                              {user.completedTasks}/{user.totalTasks} tarefas
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
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
          </TabsContent>
        </Tabs>
      </div>
    </PraiotelLayout>
  );
}
