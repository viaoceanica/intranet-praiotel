import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { BarChart3, Clock, CheckCircle2, TrendingUp } from "lucide-react";

export default function ServiceTypePerformance() {
  const { data: performance, isLoading } = trpc.tickets.serviceTypePerformance.useQuery();

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Relatório de Desempenho por Tipo</h1>
        <p className="text-gray-600 mt-2">Análise detalhada de desempenho por tipo de assistência</p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {performance?.map((type) => (
          <Card key={type.serviceTypeId} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{type.serviceTypeName}</h3>
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total</span>
                <span className="font-semibold">{type.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Resolvidos</span>
                <span className="font-semibold text-green-600">{type.resolved}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tabela Detalhada */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-6">Análise Detalhada</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-semibold text-gray-700">Tipo de Assistência</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Tickets</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Resolvidos</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Tempo Médio</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Taxa Resolução</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Abertos</th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">Em Progresso</th>
              </tr>
            </thead>
            <tbody>
              {performance?.map((type) => (
                <tr key={type.serviceTypeId} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-600"></div>
                      <span className="font-medium">{type.serviceTypeName}</span>
                    </div>
                  </td>
                  <td className="text-center py-4 px-4">{type.total}</td>
                  <td className="text-center py-4 px-4">
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {type.resolved}
                    </span>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="inline-flex items-center gap-1 text-blue-600">
                      <Clock className="h-4 w-4" />
                      {type.avgResolutionTimeMs > 0 ? formatTime(type.avgResolutionTimeMs) : '-'}
                    </span>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className={`inline-flex items-center gap-1 font-semibold ${
                      type.resolutionRate >= 80 ? 'text-green-600' : type.resolutionRate >= 50 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className="h-4 w-4" />
                      {type.resolutionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                      {type.byStatus.aberto}
                    </span>
                  </td>
                  <td className="text-center py-4 px-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {type.byStatus.em_progresso}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Gráfico Comparativo */}
      <Card className="p-6 mt-6">
        <h2 className="text-xl font-bold mb-6">Comparação de Taxa de Resolução</h2>
        <div className="space-y-4">
          {performance?.map((type) => (
            <div key={type.serviceTypeId}>
              <div className="flex justify-between mb-2">
                <span className="font-medium">{type.serviceTypeName}</span>
                <span className="font-semibold">{type.resolutionRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    type.resolutionRate >= 80 ? 'bg-green-600' : type.resolutionRate >= 50 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${type.resolutionRate}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
