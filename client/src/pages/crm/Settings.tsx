import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings as SettingsIcon, Mail, Sliders, RefreshCw, Save, RotateCcw, Zap, BarChart3, Info } from "lucide-react";
import PraiotelLayout from "@/components/PraiotelLayout";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
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
  ResponsiveContainer,
} from "recharts";

interface ScoringRule {
  id: string;
  name: string;
  description: string;
  field: string;
  condition: "equals" | "not_empty" | "greater_than" | "contains" | "activity_count" | "has_opportunity";
  value: string;
  points: number;
  active: boolean;
}

const DISTRIBUTION_COLORS: Record<string, string> = {
  "Quente (80-100)": "#ef4444",
  "Morno (60-79)": "#f97316",
  "Frio (40-59)": "#eab308",
  "Muito Frio (20-39)": "#3b82f6",
  "Sem Score (0-19)": "#9ca3af",
};

export default function Settings() {
  const [rules, setRules] = useState<ScoringRule[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  const utils = trpc.useUtils();

  // Queries
  const { data: scoringRules, isLoading: rulesLoading } = trpc.crmLeadScoring.getRules.useQuery();
  const { data: distribution } = trpc.crmLeadScoring.getDistribution.useQuery();

  // Mutations
  const updateRulesMutation = trpc.crmLeadScoring.updateRules.useMutation({
    onSuccess: () => {
      toast.success("Regras de scoring atualizadas com sucesso!");
      utils.crmLeadScoring.getRules.invalidate();
      setHasChanges(false);
    },
    onError: (error) => toast.error(`Erro ao atualizar regras: ${error.message}`),
  });

  const resetRulesMutation = trpc.crmLeadScoring.resetRules.useMutation({
    onSuccess: () => {
      toast.success("Regras restauradas para os valores padrão!");
      utils.crmLeadScoring.getRules.invalidate();
      setHasChanges(false);
    },
    onError: (error) => toast.error(`Erro ao restaurar regras: ${error.message}`),
  });

  const recalculateMutation = trpc.crmLeadScoring.recalculateAll.useMutation({
    onSuccess: (data) => {
      toast.success(`Scores recalculados: ${data.updated} leads atualizados${data.errors > 0 ? `, ${data.errors} erros` : ""}`);
      utils.crmLeadScoring.getDistribution.invalidate();
    },
    onError: (error) => toast.error(`Erro ao recalcular: ${error.message}`),
  });

  // Sync rules from server
  useEffect(() => {
    if (scoringRules) {
      setRules(scoringRules as ScoringRule[]);
    }
  }, [scoringRules]);

  const handleToggleRule = (ruleId: string) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, active: !r.active } : r));
    setHasChanges(true);
  };

  const handlePointsChange = (ruleId: string, points: number) => {
    setRules(prev => prev.map(r => r.id === ruleId ? { ...r, points: Math.max(0, Math.min(50, points)) } : r));
    setHasChanges(true);
  };

  const handleSaveRules = () => {
    updateRulesMutation.mutate(rules);
  };

  const handleResetRules = () => {
    resetRulesMutation.mutate();
  };

  const handleRecalculate = () => {
    recalculateMutation.mutate();
  };

  const totalMaxScore = rules.filter(r => r.active).reduce((sum, r) => sum + r.points, 0);

  const distributionData = distribution?.map(d => ({
    name: d.range,
    value: d.count,
    fill: DISTRIBUTION_COLORS[d.range] || "#6b7280",
  })) || [];

  return (
    <PraiotelLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Configurações CRM</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Configurar parâmetros do sistema CRM de vendas
          </p>
        </div>

        <Tabs defaultValue="scoring" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="scoring" className="flex items-center gap-2">
              <Sliders className="h-4 w-4" />
              Lead Scoring
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email / SMTP
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              Geral
            </TabsTrigger>
          </TabsList>

          {/* Lead Scoring Tab */}
          <TabsContent value="scoring" className="space-y-6">
            {/* Info Banner */}
            <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Como funciona o Lead Scoring</p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      O sistema avalia cada lead com base nas regras abaixo. Cada regra atribui pontos quando a condição é cumprida. 
                      O score final é normalizado para uma escala de 0-100. Pode ativar/desativar regras e ajustar os pontos.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Rules Configuration */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Sliders className="h-5 w-5" />
                          Regras de Pontuação
                        </CardTitle>
                        <CardDescription>
                          Ative/desative regras e ajuste os pontos atribuídos
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetRules}
                          disabled={resetRulesMutation.isPending}
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          Restaurar
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveRules}
                          disabled={!hasChanges || updateRulesMutation.isPending}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          Guardar
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {rulesLoading ? (
                      <div className="text-center py-8 text-gray-400">A carregar regras...</div>
                    ) : (
                      <div className="space-y-3">
                        {rules.map((rule) => (
                          <div
                            key={rule.id}
                            className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                              rule.active ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700" : "bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-60"
                            }`}
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <Switch
                                checked={rule.active}
                                onCheckedChange={() => handleToggleRule(rule.id)}
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm">{rule.name}</p>
                                  <Badge variant="outline" className="text-xs">
                                    {rule.condition === "not_empty" ? "Campo preenchido" :
                                     rule.condition === "equals" ? `= ${rule.value}` :
                                     rule.condition === "greater_than" ? `> ${rule.value}` :
                                     rule.condition === "activity_count" ? `≥ ${rule.value} atividades` :
                                     rule.condition === "has_opportunity" ? "Tem oportunidade" :
                                     rule.condition}
                                  </Badge>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{rule.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs text-gray-500">Pontos:</Label>
                              <Input
                                type="number"
                                min={0}
                                max={50}
                                value={rule.points}
                                onChange={(e) => handlePointsChange(rule.id, parseInt(e.target.value) || 0)}
                                className="w-20 text-center"
                                disabled={!rule.active}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Total máximo de pontos (regras ativas):
                      </span>
                      <span className="text-lg font-bold">{totalMaxScore} pts</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Score Distribution + Actions */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Distribuição de Scores
                    </CardTitle>
                    <CardDescription>
                      Classificação atual dos leads
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {distributionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={distributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, value }) => value > 0 ? `${value}` : ""}
                          >
                            {distributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[250px] flex items-center justify-center text-gray-400 text-sm">
                        Nenhum dado disponível
                      </div>
                    )}
                    <div className="space-y-2 mt-4">
                      {distributionData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.fill }} />
                            <span>{d.name}</span>
                          </div>
                          <span className="font-medium">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Ações
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full"
                      onClick={handleRecalculate}
                      disabled={recalculateMutation.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${recalculateMutation.isPending ? "animate-spin" : ""}`} />
                      {recalculateMutation.isPending ? "A recalcular..." : "Recalcular Todos os Scores"}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      Aplica as regras atuais a todos os leads e atualiza os scores
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Email / SMTP Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Configuração SMTP
                </CardTitle>
                <CardDescription>
                  Configurar servidor de email para campanhas de marketing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Servidor SMTP</Label>
                      <Input placeholder="smtp.exemplo.com" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Porta</Label>
                      <Input placeholder="587" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Utilizador</Label>
                      <Input placeholder="email@exemplo.com" disabled />
                    </div>
                    <div className="space-y-2">
                      <Label>Password</Label>
                      <Input type="password" placeholder="••••••••" disabled />
                    </div>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      A configuração SMTP será ativada numa próxima atualização. As campanhas de email utilizam atualmente o sistema de notificações interno.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Configurações Gerais do CRM
                </CardTitle>
                <CardDescription>
                  Parâmetros gerais do sistema CRM
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Moeda Padrão</Label>
                      <Input value="EUR (€)" disabled />
                      <p className="text-xs text-gray-500">Moeda utilizada nos valores de oportunidades</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Fuso Horário</Label>
                      <Input value="Europe/Lisbon (WET)" disabled />
                      <p className="text-xs text-gray-500">Fuso horário para agendamentos e relatórios</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Pipeline de Vendas</h3>
                    <div className="space-y-2">
                      {["Prospecção", "Qualificação", "Proposta", "Negociação", "Fechamento"].map((stage, i) => (
                        <div key={stage} className="flex items-center gap-3 p-2 border rounded-lg">
                          <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                            {i + 1}
                          </div>
                          <span className="text-sm font-medium">{stage}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      As fases do pipeline estão definidas no schema da base de dados. Para alterar, contacte o administrador.
                    </p>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-3">Origens de Leads</h3>
                    <div className="flex flex-wrap gap-2">
                      {["Formulário", "Evento", "Anúncio", "Referência", "Importação", "Website", "Telefone", "Email"].map((source) => (
                        <Badge key={source} variant="outline">{source}</Badge>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      As origens de leads são campos livres. Estes são os valores mais comuns.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PraiotelLayout>
  );
}
