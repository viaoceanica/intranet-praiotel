import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Target, CheckSquare, DollarSign, TrendingDown } from "lucide-react";

export default function CrmDashboard() {
  // TODO: Implementar queries tRPC para buscar métricas reais

  const metrics = [
    {
      title: "Total de Leads",
      value: "0",
      change: "+0%",
      trend: "up",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Oportunidades Abertas",
      value: "0",
      change: "+0%",
      trend: "up",
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Valor em Pipeline",
      value: "€0",
      change: "+0%",
      trend: "up",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Taxa de Conversão",
      value: "0%",
      change: "+0%",
      trend: "up",
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
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
              <div className="flex items-center gap-1 mt-1">
                {metric.trend === "up" ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    metric.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {metric.change}
                </span>
                <span className="text-sm text-gray-500">vs. mês anterior</span>
              </div>
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
            <div className="h-64 flex items-center justify-center text-gray-400">
              Gráfico de pipeline será implementado na Fase 3
            </div>
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
            <div className="h-64 flex items-center justify-center text-gray-400">
              Gráfico de leads será implementado na Fase 2
            </div>
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
            Nenhuma tarefa pendente
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
