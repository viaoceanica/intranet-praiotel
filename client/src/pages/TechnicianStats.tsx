import { useState } from "react";
import PraiotelLayout from "@/components/PraiotelLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function TechnicianStats() {
  const { data: comparison, isLoading } = trpc.technicianStats.comparison.useQuery();

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h`;
  };

  const getComparisonBadge = (value: number, average: number, higherIsBetter: boolean = true) => {
    const diff = value - average;
    const percentage = average > 0 ? Math.abs((diff / average) * 100) : 0;
    
    if (Math.abs(diff) < 0.01) {
      return <Badge className="bg-gray-100 text-gray-800">Média</Badge>;
    }

    const isAbove = diff > 0;
    const isGood = higherIsBetter ? isAbove : !isAbove;

    if (isGood) {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />
          +{percentage.toFixed(0)}%
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-orange-100 text-orange-800 flex items-center gap-1">
          <TrendingDown className="h-3 w-3" />
          -{percentage.toFixed(0)}%
        </Badge>
      );
    }
  };

  return (
    <PraiotelLayout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Estatísticas por Técnico</h1>
          <p className="text-gray-600 mt-2">Desempenho individual e comparação com a média da equipa</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#F15A24]" />
          </div>
        ) : comparison && 'teamAverages' in comparison ? (
          <>
            {/* Métricas da Equipa */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Tickets</CardTitle>
                  <Users className="h-4 w-4 text-gray-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{comparison.teamAverages.totalTickets}</div>
                  <p className="text-xs text-gray-600 mt-1">Toda a equipa</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tickets Resolvidos</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{comparison.teamAverages.resolvedTickets}</div>
                  <p className="text-xs text-gray-600 mt-1">Toda a equipa</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                  <Clock className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatTime(comparison.teamAverages.avgResolutionTimeMs)}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Resolução média</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Cumprimento SLA</CardTitle>
                  <CheckCircle className="h-4 w-4 text-[#F15A24]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{comparison.teamAverages.avgSlaCompliance}%</div>
                  <p className="text-xs text-gray-600 mt-1">Média da equipa</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico de Comparação de SLA */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Cumprimento de SLA por Técnico</CardTitle>
                <CardDescription>Percentagem de tickets resolvidos dentro do prazo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparison.technicians}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="slaCompliancePercentage" fill="#F15A24" name="SLA %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tabela Detalhada */}
            <Card>
              <CardHeader>
                <CardTitle>Desempenho Detalhado por Técnico</CardTitle>
                <CardDescription>Comparação com a média da equipa</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Técnico</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      <TableHead className="text-center">Abertos</TableHead>
                      <TableHead className="text-center">Em Progresso</TableHead>
                      <TableHead className="text-center">Resolvidos</TableHead>
                      <TableHead className="text-center">Tempo Médio</TableHead>
                      <TableHead className="text-center">SLA %</TableHead>
                      <TableHead className="text-center">vs Média</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {'technicians' in comparison && comparison.technicians.map((tech) => (
                      <TableRow key={tech.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{tech.name}</div>
                            <div className="text-sm text-gray-500">{tech.email}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{tech.total}</TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-blue-100 text-blue-800">{tech.abertos}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-yellow-100 text-yellow-800">{tech.emProgresso}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-green-100 text-green-800">{tech.resolvidos}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {tech.avgResolutionTimeMs > 0 ? formatTime(tech.avgResolutionTimeMs) : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-medium">{tech.slaCompliancePercentage}%</span>
                            {tech.ticketsWithinSla > 0 && (
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <CheckCircle className="h-3 w-3 text-green-600" />
                                {tech.ticketsWithinSla}
                                <XCircle className="h-3 w-3 text-red-600 ml-1" />
                                {tech.ticketsBreachedSla}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {tech.resolvidos > 0 
                            ? getComparisonBadge(tech.slaCompliancePercentage, comparison.teamAverages.avgSlaCompliance)
                            : <span className="text-gray-400">-</span>
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {'technicians' in comparison && comparison.technicians.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum técnico com tickets atribuídos</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>Erro ao carregar estatísticas</p>
          </div>
        )}
      </div>
    </PraiotelLayout>
  );
}
