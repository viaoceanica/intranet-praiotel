import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Target, CheckSquare, DollarSign, TrendingDown } from "lucide-react";
import PraiotelLayout from "@/components/PraiotelLayout";
import { trpc } from "@/lib/trpc";

export default function CrmDashboard() {
  // Buscar estatísticas de leads
  const { data: leadsStats, isLoading: leadsLoading } = trpc.crmLeads.getStats.useQuery();
  
  // Buscar estatísticas de oportunidades
  const { data: opportunitiesStats, isLoading: opportunitiesLoading } = trpc.crmOpportunities.getStats.useQuery();
  
  // Buscar taxa de conversão
  const { data: conversionRate, isLoading: conversionLoading } = trpc.crmOpportunities.getConversionRate.useQuery();

  const isLoading = leadsLoading || opportunitiesLoading || conversionLoading;

  // Calcular valor total em pipeline
  const totalPipelineValue = opportunitiesStats?.totalValue 
    ? parseFloat(opportunitiesStats.totalValue)
    : 0;

  const metrics = [
    {
      title: "Total de Leads",
      value: isLoading ? "..." : (leadsStats?.total || 0).toString(),
      subtitle: leadsStats ? `${leadsStats.byStatus.novo || 0} novos, ${leadsStats.byStatus.qualificado || 0} qualificados` : "",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Oportunidades Abertas",
      value: isLoading ? "..." : (opportunitiesStats?.total || 0).toString(),
      subtitle: opportunitiesStats ? `${opportunitiesStats.byStatus.aberta || 0} abertas, ${opportunitiesStats.byStatus.ganha || 0} ganhas` : "",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Valor em Pipeline",
      value: isLoading ? "..." : `€${totalPipelineValue.toLocaleString("pt-PT", { minimumFractionDigits: 2 })}`,
      subtitle: opportunitiesStats?.byStage ? `${Object.keys(opportunitiesStats.byStage).length} fases ativas` : "",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Taxa de Conversão",
      value: isLoading ? "..." : `${conversionRate?.rate || 0}%`,
      subtitle: conversionRate ? `${conversionRate.won} ganhas de ${conversionRate.total} totais` : "",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  // Preparar dados do pipeline para visualização
  const pipelineStages = opportunitiesStats?.byStage ? [
    { name: "Prospecção", count: opportunitiesStats.byStage.prospeccao?.count || 0, value: parseFloat(opportunitiesStats.byStage.prospeccao?.totalValue || "0") },
    { name: "Qualificação", count: opportunitiesStats.byStage.qualificacao?.count || 0, value: parseFloat(opportunitiesStats.byStage.qualificacao?.totalValue || "0") },
    { name: "Proposta", count: opportunitiesStats.byStage.proposta?.count || 0, value: parseFloat(opportunitiesStats.byStage.proposta?.totalValue || "0") },
    { name: "Negociação", count: opportunitiesStats.byStage.negociacao?.count || 0, value: parseFloat(opportunitiesStats.byStage.negociacao?.totalValue || "0") },
    { name: "Fechamento", count: opportunitiesStats.byStage.fechamento?.count || 0, value: parseFloat(opportunitiesStats.byStage.fechamento?.totalValue || "0") },
  ] : [];

  // Preparar dados de leads por origem
  const leadsBySource = leadsStats?.bySource ? Object.entries(leadsStats.bySource).map(([source, count]) => ({
    source: source.charAt(0).toUpperCase() + source.slice(1),
    count,
  })) : [];

  return (
    <PraiotelLayout>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard CRM</h1>
        <p className="text-gray-500 mt-1">
          Visão geral do desempenho de vendas e marketing
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {metric.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                <metric.icon className={`h-5 w-5 ${metric.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
              {metric.subtitle && (
                <p className="text-sm text-gray-500 mt-1">{metric.subtitle}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficos e Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline de Vendas</CardTitle>
            <CardDescription>
              Oportunidades por fase do pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pipelineStages.length > 0 ? (
              <div className="space-y-4">
                {pipelineStages.map((stage) => (
                  <div key={stage.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-700">{stage.name}</span>
                      <span className="text-gray-500">
                        {stage.count} ({stage.value.toLocaleString("pt-PT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{
                          width: `${totalPipelineValue > 0 ? Math.min(100, (stage.value / totalPipelineValue) * 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Nenhuma oportunidade no pipeline
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Leads por Origem</CardTitle>
            <CardDescription>
              Distribuição de leads por canal de aquisição
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leadsBySource.length > 0 ? (
              <div className="space-y-4">
                {leadsBySource.map((item) => (
                  <div key={item.source} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{item.source}</span>
                    <span className="text-sm text-gray-500">{item.count} leads</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                Nenhum lead registado
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tarefas Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Tarefas Pendentes
          </CardTitle>
          <CardDescription>
            Próximas atividades agendadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-400">
            Sistema de tarefas será implementado na Fase 4
          </div>
        </CardContent>
      </Card>
      </div>
    </PraiotelLayout>
  );
}
