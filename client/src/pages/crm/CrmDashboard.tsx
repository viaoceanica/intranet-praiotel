import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Target, CheckSquare, DollarSign, Mail, BarChart3, Calendar, ArrowUpRight, ArrowDownRight, Clock, AlertCircle, Megaphone } from "lucide-react";
import PraiotelLayout from "@/components/PraiotelLayout";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  BarChart,
  Bar,
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
  Treemap,
} from "recharts";

const STAGE_COLORS: Record<string, string> = {
  prospeccao: "#3b82f6",
  qualificacao: "#8b5cf6",
  proposta: "#f59e0b",
  negociacao: "#f97316",
  fechamento: "#22c55e",
};

const STATUS_COLORS: Record<string, string> = {
  novo: "#3b82f6",
  contactado: "#8b5cf6",
  qualificado: "#22c55e",
  nao_qualificado: "#ef4444",
  convertido: "#f59e0b",
};

const SOURCE_COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#22c55e", "#14b8a6", "#6b7280"];

export default function CrmDashboard() {
  // Buscar estatísticas de leads
  const { data: leadsStats, isLoading: leadsLoading } = trpc.crmLeads.getStats.useQuery();
  
  // Buscar estatísticas de oportunidades
  const { data: opportunitiesStats, isLoading: opportunitiesLoading } = trpc.crmOpportunities.getStats.useQuery();
  
  // Buscar taxa de conversão
  const { data: conversionRate, isLoading: conversionLoading } = trpc.crmOpportunities.getConversionRate.useQuery();

  // Buscar estatísticas de tarefas
  const { data: taskStats } = trpc.crmTasks.getStats.useQuery();

  // Buscar estatísticas de campanhas
  const { data: campaignStats } = trpc.crmCampaigns.getStats.useQuery();

  // Buscar tarefas pendentes (overdue)
  const { data: overdueTasks } = trpc.crmTasks.getOverdue.useQuery();

  // Buscar campanhas recentes
  const { data: recentCampaigns } = trpc.crmCampaigns.getRecent.useQuery({ limit: 5 });

  const isLoading = leadsLoading || opportunitiesLoading || conversionLoading;

  // Calcular valores
  const totalPipelineValue = opportunitiesStats?.totalValue 
    ? parseFloat(opportunitiesStats.totalValue)
    : 0;

  const wonValue = opportunitiesStats?.wonValue 
    ? parseFloat(opportunitiesStats.wonValue)
    : 0;

  // ROI de campanhas (simplificado: valor ganho / total campanhas enviadas)
  const campaignROI = campaignStats && campaignStats.enviada > 0
    ? ((wonValue / campaignStats.enviada) * 100).toFixed(0)
    : "0";

  // Leads ativos (novos + contactados + qualificados)
  const activeLeads = leadsStats 
    ? (leadsStats.byStatus.novo || 0) + (leadsStats.byStatus.contactado || 0) + (leadsStats.byStatus.qualificado || 0)
    : 0;

  // KPI Cards
  const kpiCards = [
    {
      title: "Receita Ganha",
      value: isLoading ? "..." : `€${wonValue.toLocaleString("pt-PT", { minimumFractionDigits: 0 })}`,
      subtitle: `Pipeline: €${totalPipelineValue.toLocaleString("pt-PT", { minimumFractionDigits: 0 })}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      trend: wonValue > 0 ? "up" : "neutral",
    },
    {
      title: "Taxa de Conversão",
      value: isLoading ? "..." : `${(conversionRate?.rate || 0).toFixed(1)}%`,
      subtitle: conversionRate ? `${conversionRate.won} ganhas de ${conversionRate.total}` : "",
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: (conversionRate?.rate || 0) > 20 ? "up" : "down",
    },
    {
      title: "Leads Ativos",
      value: isLoading ? "..." : activeLeads.toString(),
      subtitle: `${leadsStats?.total || 0} leads totais`,
      icon: Users,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
      trend: activeLeads > 0 ? "up" : "neutral",
    },
    {
      title: "Campanhas Enviadas",
      value: campaignStats?.enviada?.toString() || "0",
      subtitle: `${campaignStats?.totalOpened || 0} aberturas totais`,
      icon: Megaphone,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
      trend: "neutral",
    },
  ];

  // Pipeline data para gráfico
  const pipelineChartData = opportunitiesStats?.byStage ? [
    { name: "Prospecção", count: opportunitiesStats.byStage.prospeccao?.count || 0, value: parseFloat(opportunitiesStats.byStage.prospeccao?.totalValue || "0"), fill: STAGE_COLORS.prospeccao },
    { name: "Qualificação", count: opportunitiesStats.byStage.qualificacao?.count || 0, value: parseFloat(opportunitiesStats.byStage.qualificacao?.totalValue || "0"), fill: STAGE_COLORS.qualificacao },
    { name: "Proposta", count: opportunitiesStats.byStage.proposta?.count || 0, value: parseFloat(opportunitiesStats.byStage.proposta?.totalValue || "0"), fill: STAGE_COLORS.proposta },
    { name: "Negociação", count: opportunitiesStats.byStage.negociacao?.count || 0, value: parseFloat(opportunitiesStats.byStage.negociacao?.totalValue || "0"), fill: STAGE_COLORS.negociacao },
    { name: "Fechamento", count: opportunitiesStats.byStage.fechamento?.count || 0, value: parseFloat(opportunitiesStats.byStage.fechamento?.totalValue || "0"), fill: STAGE_COLORS.fechamento },
  ] : [];

  // Leads por status para gráfico pie
  const leadStatusData = leadsStats?.byStatus ? [
    { name: "Novos", value: leadsStats.byStatus.novo || 0, fill: STATUS_COLORS.novo },
    { name: "Contactados", value: leadsStats.byStatus.contactado || 0, fill: STATUS_COLORS.contactado },
    { name: "Qualificados", value: leadsStats.byStatus.qualificado || 0, fill: STATUS_COLORS.qualificado },
    { name: "Não Qualif.", value: leadsStats.byStatus.nao_qualificado || 0, fill: STATUS_COLORS.nao_qualificado },
    { name: "Convertidos", value: leadsStats.byStatus.convertido || 0, fill: STATUS_COLORS.convertido },
  ].filter(d => d.value > 0) : [];

  // Leads por origem para gráfico
  const leadsBySourceData = leadsStats?.bySource ? Object.entries(leadsStats.bySource).map(([source, count], i) => ({
    name: source.charAt(0).toUpperCase() + source.slice(1),
    value: count as number,
    fill: SOURCE_COLORS[i % SOURCE_COLORS.length],
  })) : [];

  // Métricas de campanhas para gráfico
  const campaignMetricsData = campaignStats ? [
    { name: "Enviados", value: campaignStats.totalRecipients || 0, fill: "#3b82f6" },
    { name: "Abertos", value: campaignStats.totalOpened || 0, fill: "#22c55e" },
    { name: "Clicados", value: campaignStats.totalClicked || 0, fill: "#f59e0b" },
  ] : [];

  // Tarefas overdue formatadas
  const formattedOverdueTasks = useMemo(() => {
    if (!overdueTasks) return [];
    return overdueTasks.slice(0, 5).map((item: any) => {
      const task = item.task || item;
      return {
        id: task.id,
        title: task.title,
        priority: task.priority,
        dueDate: new Date(task.dueDate),
        assignedTo: item.assignedTo?.name || "Sem atribuição",
      };
    });
  }, [overdueTasks]);

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgente: "bg-red-100 text-red-800",
      alta: "bg-orange-100 text-orange-800",
      media: "bg-yellow-100 text-yellow-800",
      baixa: "bg-green-100 text-green-800",
    };
    return colors[priority] || "bg-gray-100 text-gray-800";
  };

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Dashboard CRM</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Visão geral do desempenho comercial e marketing
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/crm/leads">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-1" /> Leads
              </Button>
            </Link>
            <Link href="/crm/opportunities">
              <Button variant="outline" size="sm">
                <Target className="h-4 w-4 mr-1" /> Oportunidades
              </Button>
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((kpi) => (
            <Card key={kpi.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{kpi.value}</div>
                  {kpi.trend === "up" && <ArrowUpRight className="h-4 w-4 text-green-500" />}
                  {kpi.trend === "down" && <ArrowDownRight className="h-4 w-4 text-red-500" />}
                </div>
                {kpi.subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{kpi.subtitle}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Secondary KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Target className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Oportunidades Abertas</p>
                <p className="text-lg font-bold">{opportunitiesStats?.byStatus?.aberta || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckSquare className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tarefas Concluídas</p>
                <p className="text-lg font-bold">{taskStats?.concluida || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Tarefas Atrasadas</p>
                <p className="text-lg font-bold text-red-600">{taskStats?.overdue || 0}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Oportunidades Ganhas</p>
                <p className="text-lg font-bold text-green-600">{opportunitiesStats?.byStatus?.ganha || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Row 1: Pipeline + Leads Status */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Pipeline de Vendas
              </CardTitle>
              <CardDescription>
                Valor e quantidade por fase do pipeline
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pipelineChartData.length > 0 && pipelineChartData.some(d => d.count > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={pipelineChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" width={90} />
                    <Tooltip 
                      formatter={(value: number) => [`€${value.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`, "Valor"]}
                    />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {pipelineChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
                  <Target className="h-12 w-12 mb-3 opacity-30" />
                  <p>Nenhuma oportunidade no pipeline</p>
                  <Link href="/crm/opportunities">
                    <Button variant="link" size="sm" className="mt-2">Criar oportunidade</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Leads por Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Leads por Estado
              </CardTitle>
              <CardDescription>
                Distribuição de leads no funil de vendas
              </CardDescription>
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
                <div className="h-[300px] flex flex-col items-center justify-center text-gray-400">
                  <Users className="h-12 w-12 mb-3 opacity-30" />
                  <p>Nenhum lead registado</p>
                  <Link href="/crm/leads">
                    <Button variant="link" size="sm" className="mt-2">Adicionar lead</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2: Leads por Origem + Métricas de Campanhas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Leads por Origem */}
          <Card>
            <CardHeader>
              <CardTitle>Leads por Origem</CardTitle>
              <CardDescription>Canal de aquisição de leads</CardDescription>
            </CardHeader>
            <CardContent>
              {leadsBySourceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
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
                <div className="h-[280px] flex items-center justify-center text-gray-400">
                  Nenhum dado de origem disponível
                </div>
              )}
            </CardContent>
          </Card>

          {/* Métricas de Campanhas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Desempenho de Campanhas
              </CardTitle>
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
                  <div className="flex justify-between text-sm border-t pt-3">
                    <span className="text-gray-500">Total de campanhas</span>
                    <span className="font-medium">{campaignStats.total}</span>
                  </div>
                </div>
              ) : (
                <div className="h-[280px] flex flex-col items-center justify-center text-gray-400">
                  <Mail className="h-12 w-12 mb-3 opacity-30" />
                  <p>Nenhuma campanha registada</p>
                  <Link href="/crm/campaigns">
                    <Button variant="link" size="sm" className="mt-2">Criar campanha</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row: Tarefas Atrasadas + Campanhas Recentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tarefas Atrasadas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Tarefas Atrasadas
              </CardTitle>
              <CardDescription>Tarefas que ultrapassaram a data limite</CardDescription>
            </CardHeader>
            <CardContent>
              {formattedOverdueTasks.length > 0 ? (
                <div className="space-y-3">
                  {formattedOverdueTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500">{task.assignedTo}</span>
                          <span className="text-xs text-red-600 font-medium">
                            Vencida: {task.dueDate.toLocaleDateString("pt-PT")}
                          </span>
                        </div>
                      </div>
                      <Badge className={getPriorityBadge(task.priority)} variant="outline">
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                  <Link href="/crm/tasks">
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Ver todas as tarefas
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                  <CheckSquare className="h-12 w-12 mb-3 opacity-30 text-green-400" />
                  <p className="text-green-600 font-medium">Sem tarefas atrasadas!</p>
                  <p className="text-sm">Todas as tarefas estão em dia</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Campanhas Recentes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Campanhas Recentes
              </CardTitle>
              <CardDescription>Últimas campanhas de marketing</CardDescription>
            </CardHeader>
            <CardContent>
              {recentCampaigns && recentCampaigns.length > 0 ? (
                <div className="space-y-3">
                  {recentCampaigns.map((campaign: any) => {
                    const statusColors: Record<string, string> = {
                      rascunho: "bg-gray-100 text-gray-800",
                      agendada: "bg-blue-100 text-blue-800",
                      em_envio: "bg-yellow-100 text-yellow-800",
                      enviada: "bg-green-100 text-green-800",
                      cancelada: "bg-red-100 text-red-800",
                    };
                    const statusLabels: Record<string, string> = {
                      rascunho: "Rascunho",
                      agendada: "Agendada",
                      em_envio: "Em Envio",
                      enviada: "Enviada",
                      cancelada: "Cancelada",
                    };
                    return (
                      <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{campaign.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">
                              {new Date(campaign.createdAt).toLocaleDateString("pt-PT")}
                            </span>
                            {campaign.sentCount > 0 && (
                              <span className="text-xs text-gray-500">
                                {campaign.sentCount} enviados
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge className={statusColors[campaign.status] || "bg-gray-100 text-gray-800"} variant="outline">
                          {statusLabels[campaign.status] || campaign.status}
                        </Badge>
                      </div>
                    );
                  })}
                  <Link href="/crm/campaigns">
                    <Button variant="outline" size="sm" className="w-full mt-2">
                      Ver todas as campanhas
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="h-48 flex flex-col items-center justify-center text-gray-400">
                  <Megaphone className="h-12 w-12 mb-3 opacity-30" />
                  <p>Nenhuma campanha registada</p>
                  <Link href="/crm/campaigns">
                    <Button variant="link" size="sm" className="mt-2">Criar campanha</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PraiotelLayout>
  );
}
